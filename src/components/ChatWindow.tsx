import { useChatHistory } from '../hooks/useChatHistory'
import { useContactInfo } from '../hooks/useContactInfo'
import { useSendMessage } from '../hooks/useSendMessage'
import type { Chat } from '../store/chatStore'
import { EMPTY_MESSAGES, useChatStore } from '../store/chatStore'
import { formatPhoneDigits } from '../utils/phone'
import Avatar from './Avatar'
import Composer from './Composer'
import MessageList from './MessageList'
import styles from './ChatWindow.module.css'

type Props = {
  chat: Chat
}

export default function ChatWindow({ chat }: Props) {
  const messages = useChatStore((state) => state.messages[chat.id]) ?? EMPTY_MESSAGES
  const contactInfo = useContactInfo(chat)
  const history = useChatHistory(chat)
  const send = useSendMessage()

  // Пока не известен числовой id MAX, запрос истории ещё не стартовал.
  const historyPending = contactInfo.isFetching || history.isFetching

  return (
    <section className={styles.window}>
      <header className={styles.header}>
        <Avatar name={chat.name} src={chat.avatarUrl} size="small" />
        <div className={styles.headerText}>
          <span className={styles.name}>{chat.name}</span>
          <span className={styles.subtitle}>
            {chat.phone ? formatPhoneDigits(chat.phone) : chat.id}
          </span>
        </div>
      </header>

      <MessageList messages={messages} historyPending={historyPending} />

      <Composer onSend={(text) => send.mutate({ chatId: chat.id, text })} />
    </section>
  )
}
