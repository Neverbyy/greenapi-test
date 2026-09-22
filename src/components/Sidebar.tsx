import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useChatStore } from '../store/chatStore'
import type { Chat } from '../store/chatStore'
import ChatContextMenu from './ChatContextMenu'
import ChatListItem from './ChatListItem'
import NewChatForm from './NewChatForm'
import styles from './Sidebar.module.css'

type ContextMenuState = {
  chatId: string
  x: number
  y: number
  openedAt: number
}

export default function Sidebar() {
  const chats = useChatStore((state) => state.chats)
  const messages = useChatStore((state) => state.messages)
  const activeChatId = useChatStore((state) => state.activeChatId)
  const selectChat = useChatStore((state) => state.selectChat)
  const deleteChat = useChatStore((state) => state.deleteChat)
  const logout = useAuthStore((state) => state.logout)

  const [isCreating, setIsCreating] = useState(false)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)

  const lastMessageOf = (chat: Chat) => messages[chat.id]?.at(-1) ?? null
  const lastActivity = (chat: Chat) => lastMessageOf(chat)?.timestamp ?? chat.createdAt
  const ordered = [...chats].sort((a, b) => lastActivity(b) - lastActivity(a))

  return (
    <aside className={styles.sidebar}>
      <header className={styles.header}>
        <h1 className={styles.title}>Чаты</h1>
        <button
          className={styles.add}
          type="button"
          title="Новый чат"
          onClick={() => setIsCreating((value) => !value)}
        >
          +
        </button>
      </header>

      {isCreating && <NewChatForm onCreated={() => setIsCreating(false)} />}

      <div className={styles.list}>
        {ordered.length === 0 && <p className={styles.placeholder}>Чатов пока нет</p>}
        {ordered.map((chat) => (
          <ChatListItem
            key={chat.id}
            chat={chat}
            lastMessage={lastMessageOf(chat)}
            active={chat.id === activeChatId}
            onSelect={() => selectChat(chat.id)}
            onContextMenu={(event) => {
              event.preventDefault()
              setContextMenu({
                chatId: chat.id,
                x: event.clientX,
                y: event.clientY,
                openedAt: event.timeStamp,
              })
            }}
          />
        ))}
      </div>

      <button className={styles.logout} type="button" onClick={logout}>
        Выйти
      </button>

      {contextMenu && (
        <ChatContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          openedAt={contextMenu.openedAt}
          onDelete={() => {
            deleteChat(contextMenu.chatId)
            setContextMenu(null)
          }}
          onClose={() => setContextMenu(null)}
        />
      )}
    </aside>
  )
}
