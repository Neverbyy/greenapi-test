import { useState } from 'react'
import { useChatStore } from '../store/chatStore'
import { isValidPhone } from '../utils/phone'
import PhoneInput from './PhoneInput'
import styles from './Sidebar.module.css'

type Props = {
  onCreated: () => void
}

export default function NewChatForm({ onCreated }: Props) {
  const createChat = useChatStore((state) => state.createChat)
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')

  return (
    <form
      className={styles.newChat}
      onSubmit={(event) => {
        event.preventDefault()
        if (!isValidPhone(phone)) {
          setError('Введите номер полностью: 11 цифр, например +7 (999) 123-45-67')
          return
        }
        if (!createChat(phone)) {
          setError('Не удалось создать чат с этим номером')
          return
        }

        setPhone('')
        setError('')
        onCreated()
      }}
    >
      <PhoneInput
        className={styles.input}
        value={phone}
        onChange={(digits) => {
          setPhone(digits)
          setError('')
        }}
        placeholder="+7 (999) 123-45-67"
        autoFocus
      />
      {error && <p className={styles.error}>{error}</p>}
      <button className={styles.create} type="submit" disabled={!isValidPhone(phone)}>
        Создать чат
      </button>
    </form>
  )
}
