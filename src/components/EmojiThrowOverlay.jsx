import { useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './EmojiThrowOverlay.module.css'

function FlyingEmoji({ emoji, fromRect, toRect, onDone }) {
  const [landed, setLanded] = useState(false)

  const sx = fromRect.left + fromRect.width / 2
  const sy = fromRect.top + fromRect.height / 2
  const tx = toRect.left + toRect.width / 2
  const ty = toRect.top + toRect.height / 2

  if (landed) {
    return (
      <div
        className={styles.land}
        style={{ left: tx, top: ty }}
        onAnimationEnd={onDone}
      >
        {emoji}
      </div>
    )
  }

  return (
    <div
      className={styles.arc}
      style={{
        left: sx,
        top: sy,
        '--dx': `${tx - sx}px`,
        '--dy': `${ty - sy}px`,
      }}
      onAnimationEnd={() => setLanded(true)}
    >
      {emoji}
    </div>
  )
}

export default function EmojiThrowOverlay({ flights, playerRefs, onFlightDone }) {
  if (flights.length === 0) return null

  return createPortal(
    <div className={styles.overlay}>
      {flights.map(f => {
        const fromEl = playerRefs.current[f.fromId]
        const toEl = playerRefs.current[f.toId]
        if (!fromEl || !toEl) return null
        return (
          <FlyingEmoji
            key={f.id}
            emoji={f.emoji}
            fromRect={fromEl.getBoundingClientRect()}
            toRect={toEl.getBoundingClientRect()}
            onDone={() => onFlightDone(f.id)}
          />
        )
      })}
    </div>,
    document.body
  )
}
