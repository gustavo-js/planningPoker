import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import EmojiTray from './EmojiTray'

const targetRect = { top: 300, bottom: 368, left: 100, width: 48, height: 68 }

describe('EmojiTray', () => {
  it('renders 4 quick-pick emoji buttons', () => {
    render(<EmojiTray targetRect={targetRect} onThrow={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText('🍅')).toBeInTheDocument()
    expect(screen.getByText('💩')).toBeInTheDocument()
    expect(screen.getByText('👏')).toBeInTheDocument()
    expect(screen.getByText('🔥')).toBeInTheDocument()
  })

  it('renders a + button', () => {
    render(<EmojiTray targetRect={targetRect} onThrow={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText('+')).toBeInTheDocument()
  })

  it('calls onThrow with the emoji when a quick-pick is clicked', () => {
    const onThrow = vi.fn()
    render(<EmojiTray targetRect={targetRect} onThrow={onThrow} onClose={vi.fn()} />)
    fireEvent.click(screen.getByText('🍅'))
    expect(onThrow).toHaveBeenCalledWith('🍅')
  })

  it('calls onClose after throwing', () => {
    const onClose = vi.fn()
    render(<EmojiTray targetRect={targetRect} onThrow={vi.fn()} onClose={onClose} />)
    fireEvent.click(screen.getByText('🍅'))
    expect(onClose).toHaveBeenCalled()
  })

  it('shows expanded grid when + is clicked', () => {
    render(<EmojiTray targetRect={targetRect} onThrow={vi.fn()} onClose={vi.fn()} />)
    fireEvent.click(screen.getByText('+'))
    expect(screen.getByTestId('emoji-grid')).toBeInTheDocument()
  })

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn()
    render(<EmojiTray targetRect={targetRect} onThrow={vi.fn()} onClose={onClose} />)
    fireEvent.click(screen.getByTestId('emoji-backdrop'))
    expect(onClose).toHaveBeenCalled()
  })
})
