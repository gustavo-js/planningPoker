import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockSet, mockGet, mockRemove, mockRef, mockUpdate } = vi.hoisted(() => ({
  mockSet: vi.fn(),
  mockGet: vi.fn(),
  mockRemove: vi.fn(),
  mockRef: vi.fn((_db, path) => ({ _path: path })),
  mockUpdate: vi.fn(),
}))

vi.mock('firebase/app', () => ({ initializeApp: vi.fn(() => ({})) }))

vi.mock('firebase/database', () => ({
  getDatabase: vi.fn(() => ({})),
  ref: mockRef,
  set: mockSet,
  get: mockGet,
  remove: mockRemove,
  update: mockUpdate,
  onValue: vi.fn(),
  push: vi.fn(),
  onChildAdded: vi.fn(),
}))

import { joinRoom, kickPlayer, transferOwnership } from './firebase'

beforeEach(() => {
  vi.clearAllMocks()
  mockRef.mockImplementation((_db, path) => ({ _path: path }))
  mockSet.mockResolvedValue({})
  mockRemove.mockResolvedValue({})
  mockUpdate.mockResolvedValue({})
})

describe('joinRoom — new room', () => {
  it('creates room with ownerId when room does not exist', async () => {
    mockGet.mockResolvedValue({ exists: () => false, val: () => null })
    await joinRoom('room1', 'user-abc', 'Alice')
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ _path: 'rooms/room1' }),
      expect.objectContaining({ ownerId: 'user-abc' })
    )
  })

  it('creates room with ownerId when room is expired', async () => {
    const oldTs = Date.now() - 25 * 60 * 60 * 1000
    mockGet.mockResolvedValue({
      exists: () => true,
      val: () => ({ createdAt: oldTs, revealed: false, votes: {} }),
    })
    await joinRoom('room1', 'user-abc', 'Alice')
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ _path: 'rooms/room1' }),
      expect.objectContaining({ ownerId: 'user-abc' })
    )
  })

  it('does NOT overwrite ownerId when room already exists', async () => {
    mockGet.mockResolvedValue({
      exists: () => true,
      val: () => ({ createdAt: Date.now(), ownerId: 'original-owner', revealed: false, votes: {} }),
    })
    await joinRoom('room1', 'late-joiner', 'Bob')
    const roomSetCall = mockSet.mock.calls.find(c => c[0]._path === 'rooms/room1')
    expect(roomSetCall).toBeUndefined()
  })
})

describe('kickPlayer', () => {
  it('removes the player vote entry', async () => {
    await kickPlayer('room1', 'user-abc')
    expect(mockRef).toHaveBeenCalledWith(expect.anything(), 'rooms/room1/votes/user-abc')
    expect(mockRemove).toHaveBeenCalledWith(
      expect.objectContaining({ _path: 'rooms/room1/votes/user-abc' })
    )
  })
})

describe('transferOwnership', () => {
  it('sets ownerId to the new user', async () => {
    await transferOwnership('room1', 'user-xyz')
    expect(mockRef).toHaveBeenCalledWith(expect.anything(), 'rooms/room1/ownerId')
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ _path: 'rooms/room1/ownerId' }),
      'user-xyz'
    )
  })
})
