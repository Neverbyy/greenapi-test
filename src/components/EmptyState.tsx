import styles from './EmptyState.module.css'

export default function EmptyState() {
  return (
    <div className={styles.empty}>
      <p className={styles.pill}>Выберите чат или создайте новый по номеру телефона</p>
    </div>
  )
}
