import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Table from './Table'

describe('Table', () => {
  it('shows Reveal button when not revealed', () => {
    render(<Table revealed={false} onReveal={vi.fn()} onNewRound={vi.fn()} />)
    expect(screen.getByRole('button', { name: /reveal/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /new round/i })).not.toBeInTheDocument()
  })

  it('shows New Round button when revealed', () => {
    render(<Table revealed={true} onReveal={vi.fn()} onNewRound={vi.fn()} />)
    expect(screen.getByRole('button', { name: /new round/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /reveal/i })).not.toBeInTheDocument()
  })

  it('calls onReveal when Reveal is clicked', () => {
    const onReveal = vi.fn()
    render(<Table revealed={false} onReveal={onReveal} onNewRound={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /reveal/i }))
    expect(onReveal).toHaveBeenCalled()
  })

  it('calls onNewRound when New Round is clicked', () => {
    const onNewRound = vi.fn()
    render(<Table revealed={true} onReveal={vi.fn()} onNewRound={onNewRound} />)
    fireEvent.click(screen.getByRole('button', { name: /new round/i }))
    expect(onNewRound).toHaveBeenCalled()
  })
})
