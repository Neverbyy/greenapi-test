import { useLayoutEffect, useRef } from 'react'
import { caretAfterDigits, formatPhoneDigits, phoneDigits } from '../utils/phone'

type Props = {
  /** только цифры номера */
  value: string
  onChange: (digits: string) => void
  className?: string
  placeholder?: string
  autoFocus?: boolean
}

function countDigits(text: string): number {
  return (text.match(/\d/g) ?? []).length
}

/**
 * Поле с маской номера: буквы и лишние символы отбрасываются,
 * длина ограничена форматом, каретка не убегает в конец при правке середины.
 */
export default function PhoneInput({
  value,
  onChange,
  className,
  placeholder,
  autoFocus,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const caretRef = useRef<number | null>(null)
  const formatted = formatPhoneDigits(value)

  useLayoutEffect(() => {
    const input = inputRef.current
    if (input && caretRef.current !== null) {
      input.setSelectionRange(caretRef.current, caretRef.current)
      caretRef.current = null
    }
  })

  return (
    <input
      ref={inputRef}
      className={className}
      value={formatted}
      inputMode="tel"
      autoComplete="tel"
      autoFocus={autoFocus}
      placeholder={placeholder}
      onChange={(event) => {
        const raw = event.target.value
        const caret = event.target.selectionStart ?? raw.length

        let digits = phoneDigits(raw)
        let digitsBefore = countDigits(raw.slice(0, caret))

        // Backspace по символу маски: цифры не изменились, поэтому удаляем
        // ближайшую цифру слева — иначе разделитель стереть невозможно.
        if (raw.length < formatted.length && digits === value && digitsBefore > 0) {
          digits = digits.slice(0, digitsBefore - 1) + digits.slice(digitsBefore)
          digitsBefore -= 1
        }

        const next = formatPhoneDigits(digits)
        const position =
          digitsBefore >= digits.length ? next.length : caretAfterDigits(next, digitsBefore)

        if (digits === value) {
          // Ввели букву или лишнюю цифру: React вернёт прежний текст сам,
          // перерисовки не будет — каретку возвращаем вручную.
          queueMicrotask(() => inputRef.current?.setSelectionRange(position, position))
          return
        }

        caretRef.current = position
        onChange(digits)
      }}
    />
  )
}
