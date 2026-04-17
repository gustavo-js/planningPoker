import { useState } from 'react'
import styles from './NameOverlay.module.css'

export default function NameOverlay({ onJoin }) {
  const [name, setName] = useState('')

  function handleSubmit() {
    if (name.trim()) onJoin(name.trim())
  }

  return (
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Gus' Planning Poker</h2>
        <p className={styles.subtitle}>Enter your name to join this room</p>
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          maxLength={30}
          autoFocus
        />
        <button
          className={styles.joinBtn}
          onClick={handleSubmit}
          disabled={!name.trim()}
        >
          Join
        </button>
      </div>
    </div>
  )
}
