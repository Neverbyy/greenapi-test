export type MessageStatus = 'pending' | 'sent' | 'error'

export type Message = {
  id: string
  text: string
  outgoing: boolean
  /** миллисекунды */
  timestamp: number
  status?: MessageStatus
  error?: string
  /** Сообщение из истории, у которого мы показываем только тип («Фото», «Файл»). */
  attachment?: boolean
}

export type Chat = {
  /** chatId, пригодный для отправки: 79991234567@c.us или числовой id MAX */
  id: string
  /** нормализованный номер, если известен */
  phone: string
  name: string
  /** другие chatId того же собеседника (MAX присылает внутренний числовой id) */
  aliasIds: string[]
  avatarUrl?: string
  createdAt: number
}

/**
 * Внутренний числовой id MAX — его требует GetChatHistory.
 * Узнаём его из карточки контакта либо из эхо-уведомления о своей отправке.
 */
export function numericChatId(chat: Chat): string | null {
  if (/^\d+$/.test(chat.id)) return chat.id
  return chat.aliasIds.find((id) => /^\d+$/.test(id)) ?? null
}
