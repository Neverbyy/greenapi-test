import { useQuery } from '@tanstack/react-query'
import { deleteNotification, receiveNotification } from '../api/greenApi'
import { useCredentials } from '../store/authStore'
import { useChatStore } from '../store/chatStore'

/** Сколько секунд сервер держит соединение, ожидая уведомление (допустимо 5–60). */
const RECEIVE_TIMEOUT_SECONDS = 20

/**
 * Пауза перед следующим запросом, если очередь пуста.
 * MAX-инстансы игнорируют receiveTimeout и отвечают пустым телом за ~70 мс
 * вместо обещанного ожидания, поэтому интервал опроса задаём сами:
 * 1 запрос в секунду против лимита в 100 запросов в секунду.
 */
const IDLE_INTERVAL_MS = 1000

/** Очередь непустая — забираем следующее уведомление сразу, чтобы не копить отставание. */
const BUSY_INTERVAL_MS = 100

/**
 * Единственный источник входящих сообщений: бесконечный цикл
 * receiveNotification → обработка → deleteNotification.
 * Запросы с одним queryKey не выполняются параллельно, поэтому очередь читается строго по одному.
 */
export function useNotificationPoller() {
  const credentials = useCredentials()
  const applyNotification = useChatStore((state) => state.applyNotification)

  return useQuery({
    queryKey: ['notification', credentials.idInstance],
    queryFn: async ({ signal }) => {
      const notification = await receiveNotification(credentials, RECEIVE_TIMEOUT_SECONDS, signal)
      if (!notification) return null

      applyNotification(notification.body)
      await deleteNotification(credentials, notification.receiptId)
      return notification.receiptId
    },
    refetchInterval: (query) => (query.state.data == null ? IDLE_INTERVAL_MS : BUSY_INTERVAL_MS),
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: false,
    staleTime: 0,
    gcTime: 0,
    retry: true,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 15000),
  })
}
