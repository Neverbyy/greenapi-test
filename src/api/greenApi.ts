import { request } from './client'
import type {
  ContactInfo,
  Credentials,
  DeleteNotificationResponse,
  HistoryMessage,
  Notification,
  SendMessageResponse,
  StateInstanceResponse,
} from './types'

/** https://green-api.com/v3/docs/api/account/GetStateInstance/ */
export async function getStateInstance(
  creds: Credentials,
  signal?: AbortSignal,
): Promise<StateInstanceResponse> {
  const result = await request<StateInstanceResponse>(creds, 'getStateInstance', { signal })
  return result ?? { stateInstance: 'unknown' }
}

/** https://green-api.com/v3/docs/api/sending/SendMessage/ */
export async function sendMessage(
  creds: Credentials,
  chatId: string,
  message: string,
): Promise<SendMessageResponse> {
  const result = await request<SendMessageResponse>(creds, 'sendMessage', {
    method: 'POST',
    body: { chatId, message },
  })
  if (!result?.idMessage) throw new Error('GREEN-API не вернул идентификатор сообщения')
  return result
}

/**
 * Long polling: соединение висит до receiveTimeout секунд и завершается сразу,
 * как только в очереди появляется уведомление.
 * https://green-api.com/v3/docs/api/receiving/technology-http-api/ReceiveNotification/
 */
export function receiveNotification(
  creds: Credentials,
  receiveTimeout: number,
  signal?: AbortSignal,
): Promise<Notification | null> {
  return request<Notification>(creds, 'receiveNotification', {
    search: { receiveTimeout: String(receiveTimeout) },
    signal,
  })
}

/**
 * Карточка собеседника: имя, аватар и внутренний числовой chatId MAX.
 * Единственный метод, который принимает идентификатор вида 79991234567@c.us,
 * поэтому именно с него начинается работа с новым чатом.
 * https://green-api.com/v3/docs/api/service/GetContactInfo/
 */
export function getContactInfo(creds: Credentials, chatId: string): Promise<ContactInfo | null> {
  return request<ContactInfo>(creds, 'getContactInfo', {
    method: 'POST',
    body: { chatId },
  })
}

/**
 * История переписки. Работает только с числовым chatId MAX:
 * с идентификатором вида 79991234567@c.us возвращает пустой массив.
 * https://green-api.com/v3/docs/api/journals/GetChatHistory/
 */
export async function getChatHistory(
  creds: Credentials,
  chatId: string,
  count: number,
): Promise<HistoryMessage[]> {
  const result = await request<HistoryMessage[]>(creds, 'getChatHistory', {
    method: 'POST',
    body: { chatId, count },
  })
  return result ?? []
}

/** Подтверждение обработки: без него то же уведомление придёт снова. */
export function deleteNotification(
  creds: Credentials,
  receiptId: number,
): Promise<DeleteNotificationResponse | null> {
  return request<DeleteNotificationResponse>(creds, 'deleteNotification', {
    method: 'DELETE',
    extraPath: `/${receiptId}`,
  })
}
