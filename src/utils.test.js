import { describe, it, expect } from 'vitest'
import { generateRoomId, generateUserId, computeResults } from './utils'

describe('generateRoomId', () => {
  it('returns a 6-character alphanumeric string', () => {
    const id = generateRoomId()
    expect(id).toMatch(/^[a-z0-9]{6}$/)
  })

  it('returns a different value on each call', () => {
    expect(generateRoomId()).not.toBe(generateRoomId())
  })
})

describe('generateUserId', () => {
  it('returns a non-empty string', () => {
    expect(typeof generateUserId()).toBe('string')
    expect(generateUserId().length).toBeGreaterThan(8)
  })

  it('returns a different value on each call', () => {
    expect(generateUserId()).not.toBe(generateUserId())
  })
})

describe('computeResults', () => {
  it('returns empty array when no votes', () => {
    expect(computeResults({})).toEqual([])
  })

  it('returns empty array when all cards are null', () => {
    const votes = { u1: { name: 'Alice', card: null }, u2: { name: 'Bob', card: null } }
    expect(computeResults(votes)).toEqual([])
  })

  it('counts votes and computes percentages', () => {
    const votes = {
      u1: { name: 'Alice', card: '5' },
      u2: { name: 'Bob', card: '5' },
      u3: { name: 'Carol', card: '8' },
    }
    const results = computeResults(votes)
    expect(results).toEqual([
      { card: '5', count: 2, percentage: 67 },
      { card: '8', count: 1, percentage: 33 },
    ])
  })

  it('sorts numeric values before ?', () => {
    const votes = {
      u1: { name: 'Alice', card: '?' },
      u2: { name: 'Bob', card: '3' },
    }
    const results = computeResults(votes)
    expect(results[0].card).toBe('3')
    expect(results[1].card).toBe('?')
  })

  it('ignores players who have not voted', () => {
    const votes = {
      u1: { name: 'Alice', card: '5' },
      u2: { name: 'Bob', card: null },
    }
    const results = computeResults(votes)
    expect(results).toEqual([{ card: '5', count: 1, percentage: 100 }])
  })
})
