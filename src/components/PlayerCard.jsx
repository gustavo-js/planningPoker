import { forwardRef } from 'react'
import styles from './PlayerCard.module.css'

const PlayerCard = forwardRef(function PlayerCard(
  { name, card, revealed, isMe, isOwner, index = 0, onClick },
  ref
) {
  const hasVoted = card !== null
  const backClass = hasVoted ? styles.cardBack : styles.cardPending

  return (
    <div
      ref={ref}
      className={styles.seat}
      data-me={isMe || undefined}
      data-testid="player-seat"
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      <div
        className={`${styles.cardWrapper} ${revealed ? styles.flipped : ''}`}
        style={{ '--flip-delay': `${index * 80}ms` }}
      >
        {isOwner && (
          <span className={styles.crownBadge} data-testid="crown-badge">👑</span>
        )}
        <div className={styles.cardInner}>
          <div className={`${styles.cardFace} ${backClass}`} data-testid={hasVoted ? 'card-back' : 'card-pending'}>
            {isMe && hasVoted && !revealed && (
              <span className={styles.myBadge}>{card}</span>
            )}
          </div>
          <div className={`${styles.cardFace} ${styles.cardFront}`}>
            {revealed && (hasVoted ? card : '—')}
          </div>
        </div>
      </div>
      <span className={`${styles.name} ${isMe ? styles.nameMe : ''}`} title={name}>{name}</span>
    </div>
  )
})

export default PlayerCard
