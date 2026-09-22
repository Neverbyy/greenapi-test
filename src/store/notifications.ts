import type { MessageData, NotificationBody, SenderData } from '../api/types'
import { formatPhoneDigits, normalizePhone, phoneFromChatId, toChatId } from '../utils/phone'
import type { Chat, Message } from './types'

const INCOMING = 'incomingMessageReceived'
const OUTGOING = ['outgoingMessageReceived', 'outgoingAPIMessageReceived']

/** Направление сообщения; null — уведомление не про сообщения (статусы, состояние инстанса). */
export function messageDirection(body: NotificationBody): 'incoming' | 'outgoing' | null {
  if (body.typeWebhook === INCOMING) return 'incoming'
  return OUTGOING.includes(body.typeWebhook) ? 'outgoing' : null
}

/** Текст сообщения; null — тип, который приложение не показывает (медиа, опрос, реакция). */
export function extractText(messageData?: MessageData): string | null {
  if (messageData?.typeMessage === 'textMessage') {
    return messageData.textMessageData?.textMessage ?? null
  }
  if (messageData?.typeMessage === 'extendedTextMessage') {
    return messageData.extendedTextMessageData?.text ?? null
  }
  return null
}

/** id сообщения, которое удалили в MAX, если уведомление об этом. */
export function deletedMessageId(messageData?: MessageData): string | null {
  if (messageData?.typeMessage !== 'deletedMessage') return null
  return messageData.deletedMessageData?.stanzaId ?? null
}

/** Номер собеседника: во входящих он есть явно, иначе пробуем достать из chatId. */
export function senderPhone(senderData?: SenderData): string {
  if (senderData?.senderPhoneNumber != null) {
    return normalizePhone(String(senderData.senderPhoneNumber))
  }
  return senderData?.chatId ? phoneFromChatId(senderData.chatId) : ''
}

export function findChatByIds(chats: Chat[], chatId: string): Chat | undefined {
  if (!chatId) return undefined
  return chats.find((chat) => chat.id === chatId || chat.aliasIds.includes(chatId))
}

export function findChatIdByMessageId(
  messages: Record<string, Message[]>,
  messageId: string,
): string | null {
  for (const [chatId, list] of Object.entries(messages)) {
    if (list.some((message) => message.id === messageId)) return chatId
  }
  return null
}

/**
 * Запоминает ещё один chatId того же собеседника (MAX присылает внутренний числовой id).
 * Если добавлять нечего, возвращает прежний массив — иначе подписчики стора
 * будут просыпаться на каждом эхо-уведомлении.
 */
export function withAlias(chats: Chat[], chatId: string, alias: string): Chat[] {
  if (!alias) return chats

  const index = chats.findIndex(
    (chat) => chat.id === chatId && chat.id !== alias && !chat.aliasIds.includes(alias),
  )
  if (index === -1) return chats

  const next = [...chats]
  next[index] = { ...next[index], aliasIds: [...next[index].aliasIds, alias] }
  return next
}

/** Новый чат по данным уведомления — собеседник, которого ещё нет в списке. */
export function chatFromNotification(
  senderData: SenderData | undefined,
  incoming: boolean,
  timestamp: number,
): Chat | null {
  const remoteChatId = senderData?.chatId ?? ''
  const phone = incoming ? senderPhone(senderData) : phoneFromChatId(remoteChatId)
  const id = phone ? toChatId(phone) : remoteChatId
  if (!id) return null

  return {
    id,
    phone,
    name: senderData?.chatName || senderData?.senderName || formatPhoneDigits(phone) || id,
    aliasIds: remoteChatId && remoteChatId !== id ? [remoteChatId] : [],
    createdAt: timestamp,
  }
}
