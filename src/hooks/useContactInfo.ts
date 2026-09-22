import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getContactInfo } from '../api/greenApi'
import { useCredentials } from '../store/authStore'
import type { Chat } from '../store/chatStore'
import { useChatStore } from '../store/chatStore'
import { rateLimitedQueryOptions } from './rateLimit'

/**
 * Карточка собеседника — первое, что запрашивается для нового чата:
 * из неё берутся имя, аватар и числовой chatId MAX, без которого
 * не работает история переписки.
 */
export function useContactInfo(chat: Chat) {
  const credentials = useCredentials()
  const applyContactInfo = useChatStore((state) => state.applyContactInfo)

  const query = useQuery({
    queryKey: ['contactInfo', credentials.idInstance, chat.id],
    queryFn: () => getContactInfo(credentials, chat.id),
    ...rateLimitedQueryOptions,
  })

  // Применяем в эффекте, а не в queryFn: иначе удалённый и заново созданный чат
  // получит ответ из кеша и останется без имени и аватара.
  const info = query.data
  useEffect(() => {
    if (info) applyContactInfo(chat.id, info)
  }, [info, chat.id, applyContactInfo])

  return query
}
