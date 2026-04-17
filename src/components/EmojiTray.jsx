import { useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './EmojiTray.module.css'

const QUICK_EMOJIS = ['🍅', '💩', '👏', '🔥']

const EXPANDED_EMOJIS = [
  '👍', '👎', '❤️', '😂', '😮', '😢', '😡', '🤩',
  '🎉', '🎊', '🔥', '💯', '✨', '🌟', '⭐', '🏆',
  '🍅', '🍕', '🍺', '🎂', '🍪', '🍔', '🌮',
  '💩', '💀', '🤖', '👑', '🎯', '💎', '🚀',
  '🐛', '🦆', '🐸', '🐧', '🦊', '🐱', '🐶',
  '👋', '👏', '🤝', '🙏', '✌️', '💪',
]

export default function EmojiTray({ targetRect, onThrow, onClose }) {
  const [expanded, setExpanded] = useState(false)

  const isTopHalf = targetRect.top < window.innerHeight / 2
  const trayStyle = {
    position: 'fixed',
    left: targetRect.left + targetRect.width / 2,
    top: isTopHalf ? targetRect.bottom + 8 : targetRect.top - 8,
    transform: isTopHalf ? 'translateX(-50%)' : 'translateX(-50%) translateY(-100%)',
    zIndex: 301,
  }

  function handleThrow(emoji) {
    onThrow(emoji)
    onClose()
  }

  return createPortal(
    <>
      <div
        className={styles.backdrop}
        data-testid="emoji-backdrop"
        onClick={onClose}
      />
      <div className={styles.tray} style={trayStyle}>
        {!expanded ? (
          <div className={styles.quickRow}>
            {QUICK_EMOJIS.map(e => (
              <button key={e} className={styles.emojiBtn} onClick={() => handleThrow(e)}>
                {e}
              </button>
            ))}
            <button className={styles.plusBtn} onClick={() => setExpanded(true)}>+</button>
          </div>
        ) : (
          <div className={styles.grid} data-testid="emoji-grid">
            {EXPANDED_EMOJIS.map(e => (
              <button key={e} className={styles.emojiBtn} onClick={() => handleThrow(e)}>
                {e}
              </button>
            ))}
          </div>
        )}
      </div>
    </>,
    document.body
  )
}
