import { cx } from '../utils/cx'
import styles from './Avatar.module.css'

type Props = {
  name: string
  src?: string
  size?: 'small' | 'medium'
}

export default function Avatar({ name, src, size = 'medium' }: Props) {
  const className = cx(styles.avatar, size === 'small' && styles.small)

  if (src) return <img className={className} src={src} alt={name} />

  const letter = name.replace(/[^\p{L}\p{N}]/gu, '').charAt(0)
  return <span className={className}>{letter.toUpperCase() || '#'}</span>
}
