import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { generateRoomId, generateUserId } from '../utils'
import styles from './HomePage.module.css'

export default function HomePage() {
  const [name, setName] = useState('')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [showKicked, setShowKicked] = useState(searchParams.get('kicked') === '1')

  function handleCreate() {
    const userId = generateUserId()
    const roomId = generateRoomId()
    localStorage.setItem('name', name.trim())
    localStorage.setItem('userId', userId)
    navigate(`/room/${roomId}`)
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Gus' Planning Poker</h1>
      {showKicked && (
        <div className={styles.kickedMessage} data-testid="kicked-message">
          <span>You were removed from the room.</span>
          <button
            className={styles.kickedDismiss}
            onClick={() => setShowKicked(false)}
            data-testid="kicked-dismiss"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}
      <div className={styles.card}>
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && name.trim() && handleCreate()}
          maxLength={30}
        />
        <button
          className={styles.createBtn}
          onClick={handleCreate}
          disabled={!name.trim()}
        >
          Create Room
        </button>
      </div>
    </div>
  )
}
