import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import PlayerCard from './PlayerCard'

describe('PlayerCard', () => {
  it('renders the player name', () => {
    render(<PlayerCard name="Alice" card={null} revealed={false} isMe={false} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('shows face-down card when not revealed and player has voted', () => {
    render(<PlayerCard name="Alice" card="5" revealed={false} isMe={false} />)
    expect(screen.getByTestId('card-back')).toBeInTheDocument()
    expect(screen.queryByText('5')).not.toBeInTheDocument()
  })

  it('shows card value when revealed', () => {
    render(<PlayerCard name="Alice" card="5" revealed={true} isMe={false} />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('shows pending state when player has not voted', () => {
    render(<PlayerCard name="Alice" card={null} revealed={false} isMe={false} />)
    expect(screen.getByTestId('card-pending')).toBeInTheDocument()
  })

  it('shows — when revealed but player did not vote', () => {
    render(<PlayerCard name="Alice" card={null} revealed={true} isMe={false} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('adds isMe style when isMe is true', () => {
    render(<PlayerCard name="Me" card={null} revealed={false} isMe={true} />)
    expect(screen.getByText('Me').closest('[data-me]')).toBeInTheDocument()
  })
})
