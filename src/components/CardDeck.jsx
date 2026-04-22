import styles from './CardDeck.module.css'

const CARDS = ['1', '2', '3', '5', '8', '13', '21', '?']

export default function CardDeck({ selected, onSelect }) {
  return (
    <div className={styles.deck}>
      {CARDS.map(value => (
        <button
          key={value}
          className={`${styles.card} ${selected === value ? styles.selected : ''}`}
          onClick={() => onSelect(selected === value ? null : value)}
          aria-pressed={selected === value ? 'true' : 'false'}
          aria-label={`Select ${value}`}
        >
          {value}
        </button>
      ))}
    </div>
  )
}
