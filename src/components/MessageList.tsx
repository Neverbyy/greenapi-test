import { useEffect, useRef } from 'react'
import type { Message } from '../store/chatStore'
import MessageBubble from './MessageBubble'
import styles from './ChatWindow.module.css'

type Props = {
  messages: Message[]
  historyPending: boolean
}

export default function MessageList({ messages, historyPending }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (container) container.scrollTop = container.scrollHeight
  }, [messages])

  return (
    <div className={styles.list} ref={containerRef}>
      {historyPending && <p className={styles.listNote}>Загружаем историю переписки…</p>}
      {!historyPending && messages.length === 0 && (
        <p className={`${styles.listNote} ${styles.listEmpty}`}>
          Сообщений пока нет — напишите первое
        </p>
      )}
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </div>
  )
}
