import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ContactInfo, NotificationBody } from '../api/types'
import { formatPhoneDigits, normalizePhone, toChatId } from '../utils/phone'
import {
  chatFromNotification,
  deletedMessageId,
  extractText,
  findChatByIds,
  findChatIdByMessageId,
  messageDirection,
  senderPhone,
  withAlias,
} from './notifications'
import type { Chat, Message } from './types'

export type { Chat, Message, MessageStatus } from './types'
export { numericChatId } from './types'

type ChatState = {
  chats: Chat[]
  messages: Record<string, Message[]>
  activeChatId: string | null
  createChat: (phoneInput: string) => string | null
  selectChat: (chatId: string) => void
  addMessage: (chatId: string, message: Message) => void
  updateMessage: (chatId: string, messageId: string, patch: Partial<Message>) => void
  applyNotification: (body: NotificationBody) => void
  applyContactInfo: (chatId: string, info: ContactInfo) => void
  mergeHistory: (chatId: string, history: Message[], deletedIds?: string[]) => void
  deleteChat: (chatId: string) => void
  reset: () => void
}

export const EMPTY_MESSAGES: Message[] = []

const withMessages = (state: ChatState, chatId: string, list: Message[]): ChatState => ({
  ...state,
  messages: { ...state.messages, [chatId]: list },
})

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      chats: [],
      messages: {},
      activeChatId: null,

      createChat: (phoneInput) => {
        const phone = normalizePhone(phoneInput)
        if (phone.length < 10) return null

        const existing = get().chats.find((chat) => chat.phone === phone)
        if (existing) {
          set({ activeChatId: existing.id })
          return existing.id
        }

        const id = toChatId(phone)
        set((state) => ({
          chats: [
            ...state.chats,
            { id, phone, name: formatPhoneDigits(phone), aliasIds: [], createdAt: Date.now() },
          ],
          messages: { ...state.messages, [id]: [] },
          activeChatId: id,
        }))
        return id
      },

      selectChat: (chatId) => set({ activeChatId: chatId }),

      addMessage: (chatId, message) =>
        set((state) => withMessages(state, chatId, [...(state.messages[chatId] ?? []), message])),

      updateMessage: (chatId, messageId, patch) =>
        set((state) =>
          withMessages(
            state,
            chatId,
            (state.messages[chatId] ?? []).map((message) =>
              message.id === messageId ? { ...message, ...patch } : message,
            ),
          ),
        ),

      applyNotification: (body) =>
        set((state) => {
          const direction = messageDirection(body)
          if (!direction) return state

          // Сообщение удалили в MAX — убираем его и из нашей ленты.
          const deletedId = deletedMessageId(body.messageData)
          if (deletedId) {
            const ownerChatId = findChatIdByMessageId(state.messages, deletedId)
            if (!ownerChatId) return state
            const kept = state.messages[ownerChatId].filter((message) => message.id !== deletedId)
            return withMessages(state, ownerChatId, kept)
          }

          const text = extractText(body.messageData)
          if (text === null) return state

          const incoming = direction === 'incoming'
          const remoteChatId = body.senderData?.chatId ?? ''
          const idMessage = body.idMessage ?? `${body.typeWebhook}-${Date.now()}`
          const timestamp = body.timestamp ? body.timestamp * 1000 : Date.now()

          // Сообщение уже в сторе: это эхо нашей отправки или повторная доставка уведомления.
          // Дублировать не нужно, но полезно запомнить числовой chatId MAX как алиас чата.
          const knownChatId = findChatIdByMessageId(state.messages, idMessage)
          if (knownChatId) {
            const chats = withAlias(state.chats, knownChatId, remoteChatId)
            return chats === state.chats ? state : { ...state, chats }
          }

          // Во входящих chatId — внутренний id MAX, поэтому дополнительно ищем чат по номеру.
          const phone = incoming ? senderPhone(body.senderData) : ''
          const chat =
            findChatByIds(state.chats, remoteChatId) ??
            (phone ? state.chats.find((item) => item.phone === phone) : undefined)

          const created = chat ? null : chatFromNotification(body.senderData, incoming, timestamp)
          const target = chat ?? created
          if (!target) return state

          const chats = created
            ? [...state.chats, created]
            : withAlias(state.chats, target.id, remoteChatId)

          const message: Message = {
            id: idMessage,
            text,
            outgoing: !incoming,
            timestamp,
            status: incoming ? undefined : 'sent',
          }

          return {
            ...withMessages(state, target.id, [...(state.messages[target.id] ?? []), message]),
            chats,
            activeChatId: state.activeChatId ?? target.id,
          }
        }),

      /** Настоящее имя, аватар и числовой id MAX из карточки собеседника. */
      applyContactInfo: (chatId, info) =>
        set((state) => {
          const chat = state.chats.find((item) => item.id === chatId)
          if (!chat) return state

          const name = info.contactName || info.name || chat.name
          const avatarUrl = info.avatar ?? ''
          const chats = withAlias(state.chats, chatId, info.chatId ?? '')

          // Без изменений — возвращаем прежний стейт, чтобы не будить подписчиков.
          if (name === chat.name && avatarUrl === chat.avatarUrl && chats === state.chats) {
            return state
          }

          return {
            ...state,
            chats: chats.map((item) => (item.id === chatId ? { ...item, name, avatarUrl } : item)),
          }
        }),

      /**
       * Добавляет сообщения из истории, пропуская уже известные по idMessage,
       * и убирает те, что в MAX уже удалены.
       */
      mergeHistory: (chatId, history, deletedIds = []) =>
        set((state) => {
          const stored = state.messages[chatId] ?? []
          const deleted = new Set(deletedIds)
          const kept = deleted.size > 0 ? stored.filter((item) => !deleted.has(item.id)) : stored
          const known = new Set(kept.map((message) => message.id))
          const fresh = history.filter(
            (message) => !known.has(message.id) && !deleted.has(message.id),
          )
          if (fresh.length === 0 && kept.length === stored.length) return state

          const merged = [...kept, ...fresh].sort((a, b) => a.timestamp - b.timestamp)
          return withMessages(state, chatId, merged)
        }),

      /** Удаляет чат только локально: переписка в MAX остаётся нетронутой. */
      deleteChat: (chatId) =>
        set((state) => {
          const messages = { ...state.messages }
          delete messages[chatId]

          return {
            ...state,
            chats: state.chats.filter((chat) => chat.id !== chatId),
            messages,
            activeChatId: state.activeChatId === chatId ? null : state.activeChatId,
          }
        }),

      reset: () => set({ chats: [], messages: {}, activeChatId: null }),
    }),
    {
      name: 'greenapi-chats',
      partialize: (state) =>
        ({
          chats: state.chats,
          messages: state.messages,
          activeChatId: state.activeChatId,
        }) as ChatState,
      // Сообщение, которое отправлялось в момент закрытия вкладки, уже не подтвердится:
      // помечаем его неотправленным, иначе оно навсегда зависнет в статусе «отправка…».
      onRehydrateStorage: () => (state) => {
        if (!state) return
        for (const [chatId, list] of Object.entries(state.messages)) {
          if (list.some((message) => message.status === 'pending')) {
            state.messages[chatId] = list.map((message) =>
              message.status === 'pending'
                ? { ...message, status: 'error' as const, error: 'Отправка прервана' }
                : message,
            )
          }
        }
      },
    },
  ),
)
