import type { Credentials } from './types'

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function describeStatus(status: number, raw: string): string {
  switch (status) {
    case 400:
      return raw ? `Некорректный запрос: ${raw}` : 'Некорректный запрос к GREEN-API'
    case 401:
    case 403:
      return 'Неверные idInstance или apiTokenInstance'
    case 429:
      return 'Слишком много запросов к GREEN-API, попробуйте позже'
    case 466:
      return 'Превышена квота тарифа «Разработчик»'
    default:
      return `Ошибка GREEN-API (${status})`
  }
}

/** Собирает адрес метода: {apiUrl}/waInstance{id}/{method}/{token}{extraPath} */
export function buildUrl(creds: Credentials, method: string, extraPath = ''): string {
  const base = creds.apiUrl.replace(/\/+$/, '')
  return `${base}/waInstance${creds.idInstance}/${method}/${creds.apiTokenInstance}${extraPath}`
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'DELETE'
  extraPath?: string
  search?: Record<string, string>
  body?: unknown
  signal?: AbortSignal
}

/** Возвращает null, если сервер ответил пустым телом (например, receiveNotification по таймауту). */
export async function request<T>(
  creds: Credentials,
  method: string,
  options: RequestOptions = {},
): Promise<T | null> {
  const url = new URL(buildUrl(creds, method, options.extraPath))
  for (const [key, value] of Object.entries(options.search ?? {})) {
    url.searchParams.set(key, value)
  }

  let response: Response
  try {
    response = await fetch(url, {
      method: options.method ?? 'GET',
      headers: options.body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(0, 'Нет связи с GREEN-API')
  }

  const raw = (await response.text()).trim()

  if (!response.ok) {
    throw new ApiError(response.status, describeStatus(response.status, raw))
  }

  if (raw === '' || raw === 'null') return null

  try {
    return JSON.parse(raw) as T
  } catch {
    throw new ApiError(response.status, 'GREEN-API вернул неожиданный ответ')
  }
}
