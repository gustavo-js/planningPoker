import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import NameOverlay from './NameOverlay'

describe('NameOverlay', () => {
  it('renders the join prompt', () => {
    render(<NameOverlay onJoin={vi.fn()} />)
    expect(screen.getByPlaceholderText('Your name')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /join/i })).toBeInTheDocument()
  })

  it('disables Join button when name is empty', () => {
    render(<NameOverlay onJoin={vi.fn()} />)
    expect(screen.getByRole('button', { name: /join/i })).toBeDisabled()
  })

  it('calls onJoin with trimmed name when submitted', () => {
    const onJoin = vi.fn()
    render(<NameOverlay onJoin={onJoin} />)
    fireEvent.change(screen.getByPlaceholderText('Your name'), { target: { value: '  Bob  ' } })
    fireEvent.click(screen.getByRole('button', { name: /join/i }))
    expect(onJoin).toHaveBeenCalledWith('Bob')
  })

  it('calls onJoin when Enter key is pressed', () => {
    const onJoin = vi.fn()
    render(<NameOverlay onJoin={onJoin} />)
    const input = screen.getByPlaceholderText('Your name')
    fireEvent.change(input, { target: { value: 'Carol' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onJoin).toHaveBeenCalledWith('Carol')
  })
})
