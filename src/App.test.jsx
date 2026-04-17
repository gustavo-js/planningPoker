import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'

vi.mock('./pages/HomePage', () => ({ default: () => <div>HomePage</div> }))
vi.mock('./pages/RoomPage', () => ({ default: () => <div>RoomPage</div> }))

import App from './App'

describe('App routing', () => {
  it('renders HomePage on /', () => {
    render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>)
    expect(screen.getByText('HomePage')).toBeInTheDocument()
  })

  it('renders RoomPage on /room/:id', () => {
    render(<MemoryRouter initialEntries={['/room/abc123']}><App /></MemoryRouter>)
    expect(screen.getByText('RoomPage')).toBeInTheDocument()
  })
})
