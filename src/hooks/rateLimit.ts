import { ApiError } from '../api/client'

/** Справочные методы жёстко лимитированы: два запроса подряд уже дают 429. */
function retryOnRateLimit(failureCount: number, error: Error): boolean {
  return error instanceof ApiError && error.status === 429 && failureCount < 5
}

function rateLimitDelay(attempt: number): number {
  return Math.min(2000 * 2 ** attempt, 30000)
}

/**
 * Опции для справочных запросов: результат не меняется в рамках сессии,
 * а повторы делаются только на превышение лимита запросов.
 */
export const rateLimitedQueryOptions = {
  staleTime: Infinity,
  retry: retryOnRateLimit,
  retryDelay: rateLimitDelay,
} as const
