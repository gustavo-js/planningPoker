import styles from './Table.module.css'

export default function Table({ revealed, onReveal, onNewRound }) {
  return (
    <div className={styles.table}>
      {revealed ? (
        <button className={styles.newRoundBtn} onClick={onNewRound}>
          New Round
        </button>
      ) : (
        <button className={styles.revealBtn} onClick={onReveal}>
          Reveal
        </button>
      )}
    </div>
  )
}
