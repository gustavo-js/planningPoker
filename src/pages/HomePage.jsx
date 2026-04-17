import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateRoomId, generateUserId } from '../utils'
import styles from './HomePage.module.css'

export default function HomePage() {
  const [name, setName] = useState('')
  const navigate = useNavigate()

  function handleCreate() {
    const userId = generateUserId()
    const roomId = generateRoomId()
    sessionStorage.setItem('name', name.trim())
    sessionStorage.setItem('userId', userId)
    navigate(`/room/${roomId}`)
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Gus' Planning Poker</h1>
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
