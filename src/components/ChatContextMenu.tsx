import { useEffect, useRef } from 'react'
import { cx } from '../utils/cx'
import styles from './ChatContextMenu.module.css'

const MENU_WIDTH = 200
const MENU_HEIGHT = 48

type Props = {
  x: number
  y: number
  /** timeStamp правого клика, открывшего меню */
  openedAt: number
  onDelete: () => void
  onClose: () => void
}

export default function ChatContextMenu({ x, y, openedAt, onDelete, onClose }: Props) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const isInsideMenu = (target: EventTarget | null) =>
      target instanceof Node && menuRef.current?.contains(target)

    const onClick = (event: MouseEvent) => {
      // Правая кнопка в некоторых браузерах порождает click на отпускании —
      // им меню закрывать нельзя, оно этим же жестом и открылось.
      if (event.button !== 0) return
      if (isInsideMenu(event.target)) return
      onClose()
    }

    const onContextMenu = (event: MouseEvent) => {
      // Тот самый клик, который открыл меню, может долететь до window уже
      // после отрисовки: событие с меньшим или равным timeStamp игнорируем.
      if (event.timeStamp <= openedAt) return
      onClose()
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('click', onClick)
    window.addEventListener('contextmenu', onContextMenu)
    window.addEventListener('resize', onClose)
    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('click', onClick)
      window.removeEventListener('contextmenu', onContextMenu)
      window.removeEventListener('resize', onClose)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [openedAt, onClose])

  // Не даём меню уехать за край окна
  const left = Math.min(x, window.innerWidth - MENU_WIDTH - 8)
  const top = Math.min(y, window.innerHeight - MENU_HEIGHT - 8)

  return (
    <div className={styles.menu} style={{ left, top }} role="menu" ref={menuRef}>
      <button
        className={cx(styles.menuItem, styles.menuDanger)}
        type="button"
        role="menuitem"
        onClick={onDelete}
      >
        Удалить чат
      </button>
    </div>
  )
}
