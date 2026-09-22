import { useState } from 'react'
import styles from './ChatWindow.module.css'

type Props = {
  onSend: (text: string) => void
}

export default function Composer({ onSend }: Props) {
  const [text, setText] = useState('')

  const submit = () => {
    const value = text.trim()
    if (!value) return
    onSend(value)
    setText('')
  }

  return (
    <form
      className={styles.composer}
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <textarea
        className={styles.textarea}
        value={text}
        rows={1}
        placeholder="Напишите сообщение"
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            submit()
          }
        }}
      />
      <button className={styles.send} type="submit" disabled={text.trim() === ''} title="Отправить">
        ➤
      </button>
    </form>
  )
}
