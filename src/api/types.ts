/** Учётные данные инстанса GREEN-API (личный кабинет → «Инстансы»). */
export type Credentials = {
  idInstance: string
  apiTokenInstance: string
  apiUrl: string
}

export type StateInstanceResponse = {
  stateInstance: string
}

export type SendMessageResponse = {
  idMessage: string
}

export type DeleteNotificationResponse = {
  result: boolean
  reason?: string
}

export type SenderData = {
  /** В MAX это внутренний числовой id чата, а не номер телефона. */
  chatId: string
  chatName?: string
  sender?: string
  senderName?: string
  senderContactName?: string
  senderPhoneNumber?: number | string
}

export type MessageData = {
  typeMessage: string
  textMessageData?: { textMessage: string }
  extendedTextMessageData?: { text?: string; description?: string; title?: string }
  /** typeMessage: 'deletedMessage' — stanzaId указывает на удалённое сообщение */
  deletedMessageData?: { stanzaId?: string }
}

export type NotificationBody = {
  typeWebhook: string
  timestamp?: number
  idMessage?: string
  senderData?: SenderData
  messageData?: MessageData
}

export type Notification = {
  receiptId: number
  body: NotificationBody
}

/**
 * Ответ GetContactInfo. Принимает chatId вида 79991234567@c.us и возвращает
 * внутренний числовой id MAX, имя и ссылку на аватар.
 */
export type ContactInfo = {
  chatId?: string
  chatType?: string
  name?: string
  contactName?: string
  avatar?: string
  phoneNumber?: number | string
  lastSeen?: string | number
}

/** Элемент ответа GetChatHistory (формат отличается от формата уведомлений). */
export type HistoryMessage = {
  type: 'incoming' | 'outgoing'
  idMessage: string
  timestamp: number
  typeMessage: string
  chatId: string
  chatType?: string
  textMessage?: string
  extendedTextMessage?: { text?: string }
  statusMessage?: string
  sendByApi?: boolean
  isDeleted?: boolean
  /** у записи об удалении — id сообщения, которое удалили */
  deletedMessageId?: string
}
