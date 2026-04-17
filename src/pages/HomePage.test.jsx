import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../utils', () => ({
  generateRoomId: () => 'test01',
  generateUserId: () => 'user-abc',
}))

import HomePage from './HomePage'

const renderHome = () =>
  render(<MemoryRouter><HomePage /></MemoryRouter>)

describe('HomePage', () => {
  it('renders the title', () => {
    renderHome()
    expect(screen.getByText("Gus' Planning Poker")).toBeInTheDocument()
  })

  it('renders a name input', () => {
    renderHome()
    expect(screen.getByPlaceholderText('Your name')).toBeInTheDocument()
  })

  it('disables Create Room button when name is empty', () => {
    renderHome()
    expect(screen.getByRole('button', { name: /create room/i })).toBeDisabled()
  })

  it('enables Create Room button when name is entered', () => {
    renderHome()
    fireEvent.change(screen.getByPlaceholderText('Your name'), { target: { value: 'Alice' } })
    expect(screen.getByRole('button', { name: /create room/i })).not.toBeDisabled()
  })

  it('stores name and userId in sessionStorage and navigates to room on submit', () => {
    renderHome()
    fireEvent.change(screen.getByPlaceholderText('Your name'), { target: { value: 'Alice' } })
    fireEvent.click(screen.getByRole('button', { name: /create room/i }))
    expect(sessionStorage.getItem('name')).toBe('Alice')
    expect(sessionStorage.getItem('userId')).toBe('user-abc')
    expect(mockNavigate).toHaveBeenCalledWith('/room/test01')
  })
})
