import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import EmojiThrowOverlay from './EmojiThrowOverlay'

function makeRefs(entries) {
  const map = {}
  entries.forEach(([id, rect]) => {
    map[id] = { getBoundingClientRect: () => rect }
  })
  return { current: map }
}

const rectA = { left: 50, top: 100, width: 48, height: 68 }
const rectB = { left: 400, top: 300, width: 48, height: 68 }

describe('EmojiThrowOverlay', () => {
  it('renders nothing when flights is empty', () => {
    const { container } = render(
      <EmojiThrowOverlay flights={[]} playerRefs={makeRefs([])} onFlightDone={vi.fn()} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders a flying emoji for each flight with known refs', () => {
    const flights = [{ id: 't1', fromId: 'a', toId: 'b', emoji: '🍅' }]
    const playerRefs = makeRefs([['a', rectA], ['b', rectB]])
    render(<EmojiThrowOverlay flights={flights} playerRefs={playerRefs} onFlightDone={vi.fn()} />)
    expect(screen.getAllByText('🍅')).toHaveLength(1)
  })

  it('skips flights where fromId ref is missing', () => {
    const flights = [{ id: 't1', fromId: 'unknown', toId: 'b', emoji: '🍅' }]
    const playerRefs = makeRefs([['b', rectB]])
    render(<EmojiThrowOverlay flights={flights} playerRefs={playerRefs} onFlightDone={vi.fn()} />)
    expect(screen.queryByText('🍅')).not.toBeInTheDocument()
  })

  it('skips flights where toId ref is missing', () => {
    const flights = [{ id: 't1', fromId: 'a', toId: 'unknown', emoji: '🍅' }]
    const playerRefs = makeRefs([['a', rectA]])
    render(<EmojiThrowOverlay flights={flights} playerRefs={playerRefs} onFlightDone={vi.fn()} />)
    expect(screen.queryByText('🍅')).not.toBeInTheDocument()
  })

  it('renders multiple flights independently', () => {
    const flights = [
      { id: 't1', fromId: 'a', toId: 'b', emoji: '🍅' },
      { id: 't2', fromId: 'b', toId: 'a', emoji: '💩' },
    ]
    const playerRefs = makeRefs([['a', rectA], ['b', rectB]])
    render(<EmojiThrowOverlay flights={flights} playerRefs={playerRefs} onFlightDone={vi.fn()} />)
    expect(screen.getByText('🍅')).toBeInTheDocument()
    expect(screen.getByText('💩')).toBeInTheDocument()
  })
})
