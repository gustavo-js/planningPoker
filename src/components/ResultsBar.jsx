import styles from './ResultsBar.module.css'

export default function ResultsBar({ results }) {
  if (!results.length) return null

  return (
    <div className={styles.bar} role="status" aria-live="polite" aria-label="Vote results">
      {results.map(({ card, count, percentage }) => (
        <div key={card} className={styles.row}>
          <span className={styles.cardLabel}>{card}</span>
          <div className={styles.track}>
            <div className={styles.fill} style={{ width: `${percentage}%` }} />
          </div>
          <span className={styles.label}>
            {count} {count === 1 ? 'vote' : 'votes'} ({percentage}%)
          </span>
        </div>
      ))}
    </div>
  )
}
