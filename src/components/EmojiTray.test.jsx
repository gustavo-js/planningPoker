import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import EmojiTray from './EmojiTray'

const targetRect = { top: 300, bottom: 368, left: 100, width: 48, height: 68 }

describe('EmojiTray', () => {
  it('renders 3 fixed quick-pick emoji buttons', () => {
    render(<EmojiTray targetRect={targetRect} onThrow={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText('🍅')).toBeInTheDocument()
    expect(screen.getByText('💩')).toBeInTheDocument()
    expect(screen.getByText('👏')).toBeInTheDocument()
  })

  it('renders the default recent emoji (🔥) when localStorage is empty', () => {
    render(<EmojiTray targetRect={targetRect} onThrow={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText('🔥')).toBeInTheDocument()
  })

  it('shows last picker emoji in quick row when set in localStorage', () => {
    localStorage.setItem('lastPickerEmoji', '😂')
    render(<EmojiTray targetRect={targetRect} onThrow={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText('😂')).toBeInTheDocument()
    localStorage.removeItem('lastPickerEmoji')
  })

  it('renders the more button', () => {
    render(<EmojiTray targetRect={targetRect} onThrow={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByTestId('more-btn')).toBeInTheDocument()
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

  it('shows expanded picker when more button is clicked', () => {
    render(<EmojiTray targetRect={targetRect} onThrow={vi.fn()} onClose={vi.fn()} />)
    fireEvent.click(screen.getByTestId('more-btn'))
    expect(screen.getByTestId('emoji-grid')).toBeInTheDocument()
  })

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn()
    render(<EmojiTray targetRect={targetRect} onThrow={vi.fn()} onClose={onClose} />)
    fireEvent.click(screen.getByTestId('emoji-backdrop'))
    expect(onClose).toHaveBeenCalled()
  })
})

describe('owner actions', () => {
  it('does not show kick or transfer buttons for non-owners', () => {
    render(<EmojiTray targetRect={targetRect} onThrow={vi.fn()} onClose={vi.fn()} isOwnerViewing={false} onKick={vi.fn()} onTransfer={vi.fn()} />)
    expect(screen.queryByTestId('kick-btn')).not.toBeInTheDocument()
    expect(screen.queryByTestId('transfer-btn')).not.toBeInTheDocument()
  })

  it('shows kick and transfer buttons when isOwnerViewing is true', () => {
    render(<EmojiTray targetRect={targetRect} onThrow={vi.fn()} onClose={vi.fn()} isOwnerViewing={true} onKick={vi.fn()} onTransfer={vi.fn()} />)
    expect(screen.getByTestId('kick-btn')).toBeInTheDocument()
    expect(screen.getByTestId('transfer-btn')).toBeInTheDocument()
  })

  it('calls onKick and onClose when kick button is clicked', () => {
    const onKick = vi.fn()
    const onClose = vi.fn()
    render(<EmojiTray targetRect={targetRect} onThrow={vi.fn()} onClose={onClose} isOwnerViewing={true} onKick={onKick} onTransfer={vi.fn()} />)
    fireEvent.click(screen.getByTestId('kick-btn'))
    expect(onKick).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onTransfer and onClose when transfer button is clicked', () => {
    const onTransfer = vi.fn()
    const onClose = vi.fn()
    render(<EmojiTray targetRect={targetRect} onThrow={vi.fn()} onClose={onClose} isOwnerViewing={true} onKick={vi.fn()} onTransfer={onTransfer} />)
    fireEvent.click(screen.getByTestId('transfer-btn'))
    expect(onTransfer).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('hides owner actions when expanded picker is open', () => {
    render(<EmojiTray targetRect={targetRect} onThrow={vi.fn()} onClose={vi.fn()} isOwnerViewing={true} onKick={vi.fn()} onTransfer={vi.fn()} />)
    fireEvent.click(screen.getByTestId('more-btn'))
    expect(screen.queryByTestId('kick-btn')).not.toBeInTheDocument()
    expect(screen.queryByTestId('transfer-btn')).not.toBeInTheDocument()
  })
})
