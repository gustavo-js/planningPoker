export function generateRoomId() {
  return Math.random().toString(36).slice(2, 8)
}

export function generateUserId() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
}

export function computeResults(votes) {
  const cards = Object.values(votes || {})
    .map(v => v.card)
    .filter(Boolean)

  if (cards.length === 0) return []

  const total = cards.length
  const counts = cards.reduce((acc, card) => {
    acc[card] = (acc[card] || 0) + 1
    return acc
  }, {})

  return Object.entries(counts)
    .sort(([a], [b]) => {
      const numA = parseInt(a)
      const numB = parseInt(b)
      if (isNaN(numA) && isNaN(numB)) return 0
      if (isNaN(numA)) return 1
      if (isNaN(numB)) return -1
      return numA - numB
    })
    .map(([card, count]) => ({
      card,
      count,
      percentage: Math.round((count / total) * 100),
    }))
}
