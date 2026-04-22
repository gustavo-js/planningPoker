import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
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
})
