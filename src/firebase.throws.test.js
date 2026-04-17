import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockPush, mockRemove, mockRef, mockOnChildAdded } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockRemove: vi.fn(),
  mockRef: vi.fn((_db, path) => ({ _path: path })),
  mockOnChildAdded: vi.fn(),
}))

vi.mock('firebase/app', () => ({ initializeApp: vi.fn(() => ({})) }))

vi.mock('firebase/database', () => ({
  getDatabase: vi.fn(() => ({})),
  ref: mockRef,
  push: mockPush,
  remove: mockRemove,
  onChildAdded: mockOnChildAdded,
  set: vi.fn(),
  get: vi.fn(),
  update: vi.fn(),
  onValue: vi.fn(),
}))

import { throwEmoji, subscribeToThrows, removeThrow } from './firebase'

beforeEach(() => {
  vi.clearAllMocks()
  mockRef.mockImplementation((_db, path) => ({ _path: path }))
  mockPush.mockResolvedValue({})
  mockRemove.mockResolvedValue({})
  mockOnChildAdded.mockReturnValue(vi.fn())
})

describe('throwEmoji', () => {
  it('pushes throw data to rooms/{roomId}/throws', async () => {
    await throwEmoji('room1', 'user-a', 'user-b', '🍅')
    expect(mockRef).toHaveBeenCalledWith(expect.anything(), 'rooms/room1/throws')
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({ _path: 'rooms/room1/throws' }),
      expect.objectContaining({ fromId: 'user-a', toId: 'user-b', emoji: '🍅' })
    )
  })

  it('includes a timestamp close to Date.now()', async () => {
    const before = Date.now()
    await throwEmoji('room1', 'user-a', 'user-b', '🍅')
    const after = Date.now()
    const payload = mockPush.mock.calls[0][1]
    expect(payload.timestamp).toBeGreaterThanOrEqual(before)
    expect(payload.timestamp).toBeLessThanOrEqual(after)
  })
})

describe('subscribeToThrows', () => {
  it('subscribes to rooms/{roomId}/throws with onChildAdded', () => {
    subscribeToThrows('room1', vi.fn())
    expect(mockRef).toHaveBeenCalledWith(expect.anything(), 'rooms/room1/throws')
    expect(mockOnChildAdded).toHaveBeenCalledWith(
      expect.objectContaining({ _path: 'rooms/room1/throws' }),
      expect.any(Function)
    )
  })

  it('calls callback with normalised throw data for fresh events', () => {
    const cb = vi.fn()
    let handler
    mockOnChildAdded.mockImplementation((_ref, h) => { handler = h; return vi.fn() })
    subscribeToThrows('room1', cb)
    handler({
      key: 'throw1',
      val: () => ({ fromId: 'a', toId: 'b', emoji: '🍅', timestamp: Date.now() }),
    })
    expect(cb).toHaveBeenCalledWith({
      id: 'throw1', fromId: 'a', toId: 'b', emoji: '🍅', timestamp: expect.any(Number),
    })
  })

  it('ignores events older than 10 seconds', () => {
    const cb = vi.fn()
    let handler
    mockOnChildAdded.mockImplementation((_ref, h) => { handler = h; return vi.fn() })
    subscribeToThrows('room1', cb)
    handler({
      key: 'throw1',
      val: () => ({ fromId: 'a', toId: 'b', emoji: '🍅', timestamp: Date.now() - 11000 }),
    })
    expect(cb).not.toHaveBeenCalled()
  })

  it('ignores events at exactly 10 seconds old', () => {
    const cb = vi.fn()
    let handler
    mockOnChildAdded.mockImplementation((_ref, h) => { handler = h; return vi.fn() })
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:10.000Z'))
    subscribeToThrows('room1', cb)
    handler({
      key: 'throw1',
      val: () => ({ fromId: 'a', toId: 'b', emoji: '🍅', timestamp: new Date('2026-01-01T00:00:00.000Z').getTime() }),
    })
    vi.useRealTimers()
    expect(cb).not.toHaveBeenCalled()
  })

  it('returns the unsubscribe function from onChildAdded', () => {
    const unsub = vi.fn()
    mockOnChildAdded.mockReturnValue(unsub)
    const result = subscribeToThrows('room1', vi.fn())
    expect(result).toBe(unsub)
  })
})

describe('removeThrow', () => {
  it('removes the entry at rooms/{roomId}/throws/{throwId}', async () => {
    await removeThrow('room1', 'throw1')
    expect(mockRef).toHaveBeenCalledWith(expect.anything(), 'rooms/room1/throws/throw1')
    expect(mockRemove).toHaveBeenCalledWith(expect.objectContaining({ _path: 'rooms/room1/throws/throw1' }))
  })
})
