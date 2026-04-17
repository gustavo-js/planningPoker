import styles from './PlayerCard.module.css'

export default function PlayerCard({ name, card, revealed, isMe, index = 0 }) {
  const hasVoted = card !== null

  const backClass = hasVoted ? styles.cardBack : styles.cardPending

  return (
    <div className={styles.seat} data-me={isMe || undefined}>
      <div
        className={`${styles.cardWrapper} ${revealed ? styles.flipped : ''}`}
        style={{ '--flip-delay': `${index * 80}ms` }}
      >
        <div className={styles.cardInner}>
          <div className={`${styles.cardFace} ${backClass}`} data-testid={hasVoted ? 'card-back' : 'card-pending'}>
            {isMe && hasVoted && !revealed && (
              <span className={styles.myBadge}>{card}</span>
            )}
          </div>
          <div className={`${styles.cardFace} ${styles.cardFront}`}>
            {hasVoted ? card : '—'}
          </div>
        </div>
      </div>
      <span className={`${styles.name} ${isMe ? styles.nameMe : ''}`}>{name}</span>
    </div>
  )
}
