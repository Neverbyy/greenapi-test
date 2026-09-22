import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getChatHistory } from '../api/greenApi'
import type { HistoryMessage } from '../api/types'
import { useCredentials } from '../store/authStore'
import type { Chat, Message } from '../store/chatStore'
import { numericChatId, useChatStore } from '../store/chatStore'
import { rateLimitedQueryOptions } from './rateLimit'

const HISTORY_COUNT = 100

const ATTACHMENT_LABELS: Record<string, string> = {
  imageMessage: 'Фото',
  videoMessage: 'Видео',
  documentMessage: 'Файл',
  audioMessage: 'Аудио',
  stickerMessage: 'Стикер',
  pollMessage: 'Опрос',
  reactionMessage: 'Реакция',
  locationMessage: 'Геопозиция',
  contactMessage: 'Контакт',
}

function toMessage(item: HistoryMessage): Message {
  const text = item.textMessage ?? item.extendedTextMessage?.text ?? null

  return {
    id: item.idMessage,
    text: text ?? ATTACHMENT_LABELS[item.typeMessage] ?? 'Вложение',
    attachment: text === null,
    outgoing: item.type === 'outgoing',
    timestamp: item.timestamp * 1000,
    status: item.type === 'outgoing' ? 'sent' : undefined,
  }
}

/**
 * Раскладывает ответ GetChatHistory на сообщения для ленты и идентификаторы удалённых.
 * Удаление приходит отдельной записью (typeMessage: deletedMessage) либо флагом isDeleted.
 */
export function splitHistory(history: HistoryMessage[]): {
  messages: Message[]
  deletedIds: string[]
} {
  const deletedIds = history
    .filter((item) => item.typeMessage === 'deletedMessage' || item.isDeleted)
    .map((item) => item.deletedMessageId ?? item.idMessage)

  const deleted = new Set(deletedIds)
  const messages = history
    .filter(
      (item) =>
        item.typeMessage !== 'deletedMessage' && !item.isDeleted && !deleted.has(item.idMessage),
    )
    .map(toMessage)

  return { messages, deletedIds }
}

/**
 * Подгружает последние сообщения чата один раз за сессию.
 * История доступна только по числовому chatId MAX и хранится на стороне
 * GREEN-API 3 месяца (максимум 5000 сообщений).
 */
export function useChatHistory(chat: Chat) {
  const credentials = useCredentials()
  const id = numericChatId(chat)
  const mergeHistory = useChatStore((state) => state.mergeHistory)

  const query = useQuery({
    queryKey: ['history', credentials.idInstance, id],
    queryFn: () => getChatHistory(credentials, id!, HISTORY_COUNT),
    enabled: id !== null,
    ...rateLimitedQueryOptions,
  })

  // Слияние в эффекте, а не в queryFn: ответ из кеша тоже должен попасть в ленту.
  const history = query.data
  useEffect(() => {
    if (!history) return
    const { messages, deletedIds } = splitHistory(history)
    mergeHistory(chat.id, messages, deletedIds)
  }, [history, chat.id, mergeHistory])

  return query
}
