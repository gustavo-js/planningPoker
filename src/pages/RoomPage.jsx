import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { joinRoom, setVote, setRevealed, newRound, subscribeToRoom, subscribeToThrows, throwEmoji, removeThrow, kickPlayer, transferOwnership } from '../firebase'
import { generateUserId, computeResults } from '../utils'
import NameOverlay from '../components/NameOverlay'
import Table from '../components/Table'
import PlayerCard from '../components/PlayerCard'
import CardDeck from '../components/CardDeck'
import ResultsBar from '../components/ResultsBar'
import Sparkles from '../components/Sparkles'
import EmojiTray from '../components/EmojiTray'
import EmojiThrowOverlay from '../components/EmojiThrowOverlay'
import styles from './RoomPage.module.css'

function getSession() {
  return {
    name: sessionStorage.getItem('name'),
    userId: sessionStorage.getItem('userId'),
  }
}

function setSession(name, userId) {
  sessionStorage.setItem('name', name)
  sessionStorage.setItem('userId', userId)
}

export default function RoomPage() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const [roomData, setRoomData] = useState(null)
  const [session, setSessionState] = useState(getSession)
  const [loading, setLoading] = useState(true)
  const playerRefs = useRef({})
  const [tray, setTray] = useState(null)
  const [flights, setFlights] = useState([])
  const hasJoined = useRef(false)

  const hasSession = Boolean(session.name && session.userId)

  useEffect(() => {
    if (!hasSession) return
    joinRoom(roomId, session.userId, session.name).then(() => {
      hasJoined.current = true
      setLoading(false)
    })
  }, [roomId, session.userId, session.name, hasSession])

  useEffect(() => {
    const unsubscribe = subscribeToRoom(roomId, data => {
      setRoomData(data)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [roomId])

  useEffect(() => {
    const unsub = subscribeToThrows(roomId, throwEvent => {
      setFlights(prev => [...prev, throwEvent])
    })
    return () => unsub()
  }, [roomId])

  // Redirect kicked player
  useEffect(() => {
    if (!hasJoined.current || !roomData) return
    const votes = roomData.votes || {}
    if (Object.keys(votes).length === 0) return
    if (!votes[session.userId]) {
      navigate('/?kicked=1')
    }
  }, [roomData, session.userId, navigate])

  // Auto-transfer ownership when owner leaves
  useEffect(() => {
    if (!roomData) return
    const votes = roomData.votes || {}
    const ownerId = roomData.ownerId
    if (!ownerId || votes[ownerId]) return
    const remaining = Object.keys(votes).sort()
    if (remaining.length === 0) return
    if (remaining[0] === session.userId) {
      transferOwnership(roomId, session.userId)
    }
  }, [roomData, roomId, session.userId])

  const handleJoin = useCallback((name) => {
    const userId = generateUserId()
    setSession(name, userId)
    setSessionState({ name, userId })
  }, [])

  if (!hasSession) {
    return <NameOverlay onJoin={handleJoin} />
  }

  if (loading || !roomData) {
    return <div className={styles.loading}>Connecting…</div>
  }

  const votes = roomData.votes || {}
  const revealed = roomData.revealed || false
  const myVote = votes[session.userId]?.card ?? null
  const results = computeResults(votes)
  const allMatch = revealed && results.length === 1
  const isOwner = session.userId === roomData.ownerId

  const players = Object.entries(votes).map(([id, data]) => ({
    id,
    name: data.name,
    card: data.card ?? null,
    isMe: id === session.userId,
    isOwner: id === roomData.ownerId,
  }))

  const base = Math.floor(players.length / 4)
  const rem = players.length % 4
  const topCount    = base + (rem > 0 ? 1 : 0)
  const bottomCount = base + (rem > 1 ? 1 : 0)
  const rightCount  = base + (rem > 2 ? 1 : 0)
  const topPlayers    = players.slice(0, topCount)
  const rightPlayers  = players.slice(topCount, topCount + rightCount)
  const bottomPlayers = players.slice(topCount + rightCount, topCount + rightCount + bottomCount)
  const leftPlayers   = players.slice(topCount + rightCount + bottomCount)

  function handleReveal() {
    setRevealed(roomId, true)
  }

  function handleNewRound() {
    newRound(roomId, votes)
  }

  function handleSelectCard(value) {
    setVote(roomId, session.userId, value)
  }

  function handlePlayerClick(playerId) {
    const el = playerRefs.current[playerId]
    if (!el) return
    setTray({ playerId, rect: el.getBoundingClientRect() })
  }

  function handleThrow(emoji) {
    if (!tray) return
    throwEmoji(roomId, session.userId, tray.playerId, emoji)
    setTray(null)
  }

  function handleKick() {
    if (!tray) return
    kickPlayer(roomId, tray.playerId)
    setTray(null)
  }

  function handleTransfer() {
    if (!tray) return
    transferOwnership(roomId, tray.playerId)
    setTray(null)
  }

  function handleFlightDone(throwId) {
    setFlights(prev => prev.filter(f => f.id !== throwId))
    removeThrow(roomId, throwId)
  }

  function playerCard(p, i) {
    return (
      <PlayerCard
        key={p.id}
        ref={el => { playerRefs.current[p.id] = el }}
        name={p.name}
        card={p.card}
        revealed={revealed}
        isMe={p.isMe}
        isOwner={p.isOwner}
        index={i}
        onClick={p.isMe ? undefined : () => handlePlayerClick(p.id)}
      />
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/" className={styles.logo}>Gus' Planning Poker</Link>
        <span className={styles.roomId}>Room: {roomId}</span>
      </header>

      <main className={styles.main}>
        <div className={styles.topRow}>
          {topPlayers.map((p, i) => playerCard(p, i))}
        </div>

        <div className={styles.middleRow}>
          <div className={styles.sideCol}>
            {leftPlayers.map((p, i) => playerCard(p, i))}
          </div>

          <div className={styles.center}>
            <Table revealed={revealed} onReveal={handleReveal} onNewRound={handleNewRound} />
          </div>

          <div className={styles.sideCol}>
            {rightPlayers.map((p, i) => playerCard(p, i))}
          </div>
        </div>

        <div className={styles.bottomRow}>
          {bottomPlayers.map((p, i) => playerCard(p, i))}
        </div>
      </main>

      {revealed && <ResultsBar results={results} />}
      <Sparkles active={allMatch} />

      <footer className={styles.footer}>
        <CardDeck selected={myVote} onSelect={handleSelectCard} />
      </footer>

      {tray && (
        <EmojiTray
          targetRect={tray.rect}
          onThrow={handleThrow}
          onClose={() => setTray(null)}
          isOwnerViewing={isOwner}
          onKick={handleKick}
          onTransfer={handleTransfer}
        />
      )}
      <EmojiThrowOverlay
        flights={flights}
        playerRefs={playerRefs}
        onFlightDone={handleFlightDone}
      />
    </div>
  )
}
