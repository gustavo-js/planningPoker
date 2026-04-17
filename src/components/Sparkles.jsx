import { useMemo } from 'react'
import styles from './Sparkles.module.css'

const COUNT = 40

export default function Sparkles({ active }) {
  const particles = useMemo(() =>
    Array.from({ length: COUNT }, (_, i) => {
      const angle = (Math.PI * 2 / COUNT) * i + (Math.random() - 0.5) * 0.4
      const distance = 90 + Math.random() * 160
      return {
        id: i,
        tx: Math.round(Math.sin(angle) * distance),
        ty: Math.round(-Math.cos(angle) * distance),
        size: 5 + Math.random() * 7,
        delay: Math.random() * 0.5,
        duration: 0.7 + Math.random() * 0.6,
        warm: Math.random() > 0.4,
      }
    }), [])

  if (!active) return null

  return (
    <div className={styles.container}>
      {particles.map(p => (
        <div
          key={p.id}
          className={`${styles.particle} ${p.warm ? styles.warm : styles.muted}`}
          style={{
            '--tx': `${p.tx}px`,
            '--ty': `${p.ty}px`,
            '--size': `${p.size}px`,
            '--delay': `${p.delay}s`,
            '--dur': `${p.duration}s`,
          }}
        />
      ))}
    </div>
  )
}
