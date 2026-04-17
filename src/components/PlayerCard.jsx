import styles from './PlayerCard.module.css'

export default function PlayerCard({ name, card, revealed, isMe }) {
  const hasVoted = card !== null

  function renderCardFace() {
    if (!hasVoted && !revealed) {
      return <div className={styles.cardPending} data-testid="card-pending" />
    }
    if (!revealed) {
      return <div className={styles.cardBack} data-testid="card-back" />
    }
    return (
      <div className={styles.cardFront}>
        {hasVoted ? card : '—'}
      </div>
    )
  }

  return (
    <div className={styles.seat} data-me={isMe || undefined}>
      {renderCardFace()}
      <span className={`${styles.name} ${isMe ? styles.nameMe : ''}`}>{name}</span>
    </div>
  )
}
