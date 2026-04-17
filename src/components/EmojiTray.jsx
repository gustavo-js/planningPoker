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

function GridIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor" aria-hidden>
      <rect x="0" y="0" width="6" height="6" rx="1.5" />
      <rect x="9" y="0" width="6" height="6" rx="1.5" />
      <rect x="0" y="9" width="6" height="6" rx="1.5" />
      <rect x="9" y="9" width="6" height="6" rx="1.5" />
    </svg>
  )
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

  const trayClass = [
    isTopHalf ? styles.tray : styles.trayAbove,
    expanded ? styles.trayExpanded : '',
  ].join(' ').trim()

  return createPortal(
    <>
      <div
        className={styles.backdrop}
        data-testid="emoji-backdrop"
        onClick={onClose}
      />
      <div style={anchorStyle}>
        <div className={trayClass}>
          {!expanded ? (
            <div className={styles.quickRow}>
              {QUICK_EMOJIS.map(e => (
                <button key={e} className={styles.emojiBtn} onClick={() => handleThrow(e)}>
                  {e}
                </button>
              ))}
              <button
                className={`${styles.emojiBtn} ${styles.recentBtn}`}
                onClick={() => handleThrow(lastPickerEmoji)}
                title="Recently used"
              >
                {lastPickerEmoji}
              </button>
              <button
                className={styles.moreBtn}
                onClick={() => setExpanded(true)}
                title="All emojis"
                data-testid="more-btn"
              >
                <GridIcon />
              </button>
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
