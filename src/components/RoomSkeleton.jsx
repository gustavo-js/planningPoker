import styles from './RoomSkeleton.module.css'

function SkeletonCard() {
  return <div className={styles.card} />
}

export default function RoomSkeleton() {
  return (
    <div
      className={styles.page}
      data-testid="room-skeleton"
      role="status"
      aria-label="Loading room…"
    >
      <div className={styles.topRow}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className={styles.middle}>
        <div className={styles.table} />
      </div>
      <div className={styles.bottomRow}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  )
}
