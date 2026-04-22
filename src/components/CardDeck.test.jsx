import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import CardDeck from './CardDeck'

describe('CardDeck', () => {
  it('renders a button for each card value', () => {
    render(<CardDeck selected={null} onSelect={() => {}} />)
    expect(screen.getAllByRole('button')).toHaveLength(8)
  })

  it('each button has an aria-label', () => {
    render(<CardDeck selected={null} onSelect={() => {}} />)
    expect(screen.getByRole('button', { name: 'Select 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Select 5' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Select ?' })).toBeInTheDocument()
  })

  it('selected card has aria-pressed=true', () => {
    render(<CardDeck selected="5" onSelect={() => {}} />)
    expect(screen.getByRole('button', { name: 'Select 5' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Select 1' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls onSelect with the card value when clicked', () => {
    const onSelect = vi.fn()
    render(<CardDeck selected={null} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('button', { name: 'Select 5' }))
    expect(onSelect).toHaveBeenCalledWith('5')
  })

  it('calls onSelect with null when the selected card is clicked again', () => {
    const onSelect = vi.fn()
    render(<CardDeck selected="5" onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('button', { name: 'Select 5' }))
    expect(onSelect).toHaveBeenCalledWith(null)
  })
})
