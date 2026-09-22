/** Максимум цифр в международном номере (E.164). */
const MAX_DIGITS = 15
/** Российский номер: 7 плюс десять цифр. */
const RU_DIGITS = 11

/** Оставляет только цифры и приводит российские номера к формату 7XXXXXXXXXX. */
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '')
  if (digits.length === RU_DIGITS && digits.startsWith('8')) return `7${digits.slice(1)}`
  if (digits.length === 10) return `7${digits}`
  return digits
}

/**
 * Цифры номера в том виде, в каком их хранит поле ввода:
 * 8 в начале заменяется на 7, длина ограничена форматом номера.
 */
export function phoneDigits(raw: string): string {
  let digits = raw.replace(/\D/g, '')
  if (digits.startsWith('8')) digits = `7${digits.slice(1)}`
  return digits.slice(0, digits.startsWith('7') ? RU_DIGITS : MAX_DIGITS)
}

/** Российский номер показываем маской +7 (999) 123-45-67, остальные — группами по три цифры. */
export function formatPhoneDigits(digits: string): string {
  if (digits === '') return ''
  if (!digits.startsWith('7')) return `+${digits.replace(/(\d{3})(?=\d)/g, '$1 ')}`

  const rest = digits.slice(1)
  let result = '+7'
  if (rest.length > 0) result += ` (${rest.slice(0, 3)}`
  if (rest.length >= 3) result += ')'
  if (rest.length > 3) result += ` ${rest.slice(3, 6)}`
  if (rest.length > 6) result += `-${rest.slice(6, 8)}`
  if (rest.length > 8) result += `-${rest.slice(8, 10)}`
  return result
}

/** Позиция каретки сразу после count-й цифры отформатированной строки. */
export function caretAfterDigits(formatted: string, count: number): number {
  if (count <= 0) return 0

  let seen = 0
  for (let index = 0; index < formatted.length; index += 1) {
    if (formatted[index] >= '0' && formatted[index] <= '9') {
      seen += 1
      if (seen === count) return index + 1
    }
  }
  return formatted.length
}

/** Российский номер должен быть полным, иностранный — правдоподобной длины. */
export function isValidPhone(digits: string): boolean {
  if (digits.startsWith('7')) return digits.length === RU_DIGITS
  return digits.length >= 10 && digits.length <= MAX_DIGITS
}

/** chatId личного чата в MAX: номер телефона с суффиксом @c.us. */
export function toChatId(phone: string): string {
  return `${phone}@c.us`
}

/** Достаёт номер из chatId вида 79991234567@c.us (для числовых id MAX вернёт пустую строку). */
export function phoneFromChatId(chatId: string): string {
  const [local] = chatId.split('@')
  return chatId.includes('@') && /^\d+$/.test(local) ? local : ''
}
