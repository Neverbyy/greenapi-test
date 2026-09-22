import { useNotificationPoller } from '../hooks/useNotificationPoller'
import { useChatStore } from '../store/chatStore'
import ChatWindow from './ChatWindow'
import EmptyState from './EmptyState'
import Sidebar from './Sidebar'
import styles from './ChatLayout.module.css'

export default function ChatLayout() {
  const poller = useNotificationPoller()
  const chats = useChatStore((state) => state.chats)
  const activeChatId = useChatStore((state) => state.activeChatId)
  const activeChat = chats.find((chat) => chat.id === activeChatId) ?? null

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        {poller.failureCount > 1 && (
          <div className={styles.banner}>
            {poller.failureReason?.message ?? 'Нет связи с GREEN-API'} · переподключение…
          </div>
        )}
        {activeChat ? <ChatWindow chat={activeChat} /> : <EmptyState />}
      </main>
    </div>
  )
}
