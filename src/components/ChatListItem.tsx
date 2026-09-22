import type { MouseEvent } from 'react'
import { useContactInfo } from '../hooks/useContactInfo'
import type { Chat, Message } from '../store/chatStore'
import { cx } from '../utils/cx'
import { formatTime } from '../utils/time'
import Avatar from './Avatar'
import styles from './Sidebar.module.css'

type Props = {
  chat: Chat
  lastMessage: Message | null
  active: boolean
  onSelect: () => void
  onContextMenu: (event: MouseEvent) => void
}

export default function ChatListItem({
  chat,
  lastMessage,
  active,
  onSelect,
  onContextMenu,
}: Props) {
  useContactInfo(chat)

  return (
    <button
      className={cx(styles.item, active && styles.itemActive)}
      type="button"
      onClick={onSelect}
      onContextMenu={onContextMenu}
    >
      <Avatar name={chat.name} src={chat.avatarUrl} />
      <span className={styles.itemBody}>
        <span className={styles.itemTop}>
          <span className={styles.itemName}>{chat.name}</span>
          {lastMessage && (
            <span className={styles.itemTime}>{formatTime(lastMessage.timestamp)}</span>
          )}
        </span>
        <span className={styles.itemPreview}>
          {lastMessage
            ? `${lastMessage.outgoing ? 'Вы: ' : ''}${lastMessage.text}`
            : 'Нет сообщений'}
        </span>
      </span>
    </button>
  )
}
