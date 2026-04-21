import { render, screen, act, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

let roomCallback = null
const mockJoinRoom = vi.fn().mockResolvedValue({})
const mockKickPlayer = vi.fn().mockResolvedValue({})
const mockTransferOwnership = vi.fn().mockResolvedValue({})
const mockSubscribeToRoom = vi.fn((_, cb) => { roomCallback = cb; return vi.fn() })
const mockSubscribeToThrows = vi.fn(() => vi.fn())

vi.mock('../firebase', () => ({
  joinRoom: (...args) => mockJoinRoom(...args),
  setVote: vi.fn(),
  setRevealed: vi.fn(),
  newRound: vi.fn(),
  subscribeToRoom: (...args) => mockSubscribeToRoom(...args),
  subscribeToThrows: (...args) => mockSubscribeToThrows(...args),
  throwEmoji: vi.fn(),
  removeThrow: vi.fn(),
  kickPlayer: (...args) => mockKickPlayer(...args),
  transferOwnership: (...args) => mockTransferOwnership(...args),
}))

vi.mock('../utils', () => ({
  generateUserId: () => 'user-abc',
  computeResults: () => [],
}))

import RoomPage from './RoomPage'

function renderRoom(userId = 'user-abc') {
  sessionStorage.setItem('name', 'Alice')
  sessionStorage.setItem('userId', userId)
  return render(
    <MemoryRouter initialEntries={['/room/room1']}>
      <Routes>
        <Route path="/room/:roomId" element={<RoomPage />} />
      </Routes>
    </MemoryRouter>
  )
}

function fireRoomData(data) {
  act(() => { roomCallback(data) })
}

beforeEach(() => {
  vi.clearAllMocks()
  roomCallback = null
  sessionStorage.clear()
  mockJoinRoom.mockResolvedValue({})
})

describe('RoomPage — kicked detection', () => {
  it('redirects to /?kicked=1 when current user is removed from votes', async () => {
    renderRoom('user-abc')
    await act(async () => {})
    fireRoomData({ ownerId: 'other', revealed: false, votes: { 'other': { name: 'Bob', card: null } } })
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/?kicked=1')
    })
  })

  it('does not redirect when votes is empty (newRound transition)', async () => {
    renderRoom('user-abc')
    await act(async () => {})
    fireRoomData({ ownerId: 'user-abc', revealed: false, votes: {} })
    expect(mockNavigate).not.toHaveBeenCalledWith('/?kicked=1')
  })

  it('does not redirect when current user is still in votes', async () => {
    renderRoom('user-abc')
    await act(async () => {})
    fireRoomData({ ownerId: 'other', revealed: false, votes: { 'user-abc': { name: 'Alice', card: null }, 'other': { name: 'Bob', card: null } } })
    expect(mockNavigate).not.toHaveBeenCalledWith('/?kicked=1')
  })
})

describe('RoomPage — auto-transfer', () => {
  it('calls transferOwnership when owner leaves and current user is lex-first', async () => {
    renderRoom('aaa-first')
    await act(async () => {})
    fireRoomData({
      ownerId: 'zzz-owner',
      revealed: false,
      votes: {
        'aaa-first': { name: 'Alice', card: null },
        'bbb-second': { name: 'Bob', card: null },
      },
    })
    await waitFor(() => {
      expect(mockTransferOwnership).toHaveBeenCalledWith('room1', 'aaa-first')
    })
  })

  it('does not call transferOwnership when current user is not lex-first', async () => {
    renderRoom('bbb-second')
    await act(async () => {})
    fireRoomData({
      ownerId: 'zzz-owner',
      revealed: false,
      votes: {
        'aaa-first': { name: 'Alice', card: null },
        'bbb-second': { name: 'Bob', card: null },
      },
    })
    expect(mockTransferOwnership).not.toHaveBeenCalled()
  })

  it('does not call transferOwnership when owner is still in votes', async () => {
    renderRoom('user-abc')
    await act(async () => {})
    fireRoomData({
      ownerId: 'owner-xyz',
      revealed: false,
      votes: {
        'owner-xyz': { name: 'Owner', card: null },
        'user-abc': { name: 'Alice', card: null },
      },
    })
    expect(mockTransferOwnership).not.toHaveBeenCalled()
  })
})
