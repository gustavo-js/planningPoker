import { useState } from 'react'
import { createPortal } from 'react-dom'
import Picker from '@emoji-mart/react'
import data from '@emoji-mart/data'
import styles from './EmojiTray.module.css'

const QUICK_EMOJIS = ['🍅', '💩', '👏']
const LAST_PICKER_KEY = 'lastPickerEmoji'

function getLastPickerEmoji() {
  return localStorage.getItem(LAST_PICKER_KEY) || '🔥'
}

export default function EmojiTray({ targetRect, onThrow, onClose }) {
  const [expanded, setExpanded] = useState(false)
  const [lastPickerEmoji, setLastPickerEmoji] = useState(getLastPickerEmoji)

  const isTopHalf = targetRect.top < window.innerHeight / 2
  const anchorStyle = {
    position: 'fixed',
    left: targetRect.left + targetRect.width / 2,
    top: isTopHalf ? targetRect.bottom + 8 : targetRect.top - 8,
    zIndex: 301,
  }

  function handleThrow(emoji) {
    onThrow(emoji)
    onClose()
  }

  function handlePickerSelect(emojiData) {
    const emoji = emojiData.native
    localStorage.setItem(LAST_PICKER_KEY, emoji)
    setLastPickerEmoji(emoji)
    handleThrow(emoji)
  }

  const quickRow = lastPickerEmoji
    ? [...QUICK_EMOJIS, lastPickerEmoji]
    : QUICK_EMOJIS

  return createPortal(
    <>
      <div
        className={styles.backdrop}
        data-testid="emoji-backdrop"
        onClick={onClose}
      />
      <div style={anchorStyle}>
      <div className={isTopHalf ? styles.tray : styles.trayAbove}>
        {!expanded ? (
          <div className={styles.quickRow}>
            {quickRow.map(e => (
              <button key={e} className={styles.emojiBtn} onClick={() => handleThrow(e)}>
                {e}
              </button>
            ))}
            <div className={styles.divider} />
            <button className={styles.plusBtn} onClick={() => setExpanded(true)}>+</button>
          </div>
        ) : (
          <div data-testid="emoji-grid">
            <Picker
              data={data}
              onEmojiSelect={handlePickerSelect}
              theme="dark"
              previewPosition="none"
              skinTonePosition="none"
              autoFocus
            />
          </div>
        )}
      </div>
      </div>
    </>,
    document.body
  )
}
