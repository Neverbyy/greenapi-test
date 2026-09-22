import type { Message } from '../store/chatStore'
import { cx } from '../utils/cx'
import { formatTime } from '../utils/time'
import styles from './ChatWindow.module.css'

type Props = {
  message: Message
}

export default function MessageBubble({ message }: Props) {
  return (
    <div className={message.outgoing ? styles.rowOut : styles.rowIn}>
      <div className={cx(styles.bubble, message.outgoing ? styles.bubbleOut : styles.bubbleIn)}>
        <span className={cx(styles.text, message.attachment && styles.attachment)}>
          {message.text}
        </span>
        <span className={styles.meta}>
          {message.status === 'pending' && <span className={styles.pending}>отправка…</span>}
          {message.status === 'error' && (
            <span className={styles.failed} title={message.error}>
              не отправлено
            </span>
          )}
          <span className={styles.time}>{formatTime(message.timestamp)}</span>
        </span>
      </div>
    </div>
  )
}
