import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Credentials } from '../api/types'
import { useChatStore } from './chatStore'

export const DEFAULT_API_URL = 'https://api.green-api.com'

type AuthState = {
  credentials: Credentials | null
  login: (credentials: Credentials) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      credentials: null,
      login: (credentials) => {
        // Сохранённые чаты принадлежат конкретному инстансу: при смене аккаунта чистим.
        const current = get().credentials
        if (current && current.idInstance !== credentials.idInstance) {
          useChatStore.getState().reset()
        }
        set({ credentials })
      },
      logout: () => {
        useChatStore.getState().reset()
        set({ credentials: null })
      },
    }),
    { name: 'greenapi-credentials' },
  ),
)

/**
 * Учётные данные внутри авторизованной части приложения.
 * Вызывается только под гейтом в App, где credentials заведомо не null.
 */
export function useCredentials(): Credentials {
  const credentials = useAuthStore((state) => state.credentials)
  if (!credentials) throw new Error('useCredentials вызван вне авторизованного дерева')
  return credentials
}
