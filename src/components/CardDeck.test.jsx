import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import CardDeck from './CardDeck'

describe('CardDeck', () => {
  it('renders all 8 card values', () => {
    render(<CardDeck selected={null} onSelect={vi.fn()} />)
    for (const val of ['1', '2', '3', '5', '8', '13', '21', '?']) {
      expect(screen.getByText(val)).toBeInTheDocument()
    }
  })

  it('calls onSelect with the clicked value', () => {
    const onSelect = vi.fn()
    render(<CardDeck selected={null} onSelect={onSelect} />)
    fireEvent.click(screen.getByText('8'))
    expect(onSelect).toHaveBeenCalledWith('8')
  })

  it('marks the selected card with aria-pressed true', () => {
    render(<CardDeck selected="5" onSelect={vi.fn()} />)
    expect(screen.getByText('5').closest('button')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('8').closest('button')).toHaveAttribute('aria-pressed', 'false')
  })

  it('deselects a card when clicking it again', () => {
    const onSelect = vi.fn()
    render(<CardDeck selected="5" onSelect={onSelect} />)
    fireEvent.click(screen.getByText('5'))
    expect(onSelect).toHaveBeenCalledWith(null)
  })
})
