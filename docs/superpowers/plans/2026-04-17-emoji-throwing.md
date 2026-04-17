# Emoji Throwing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Players can click another player's card to throw an emoji at them — the emoji animates in a parabolic arc to the target, then falls and fades, visible to all room participants via Firebase.

**Architecture:** Firebase Realtime Database stores ephemeral throw events at `rooms/{roomId}/throws/{id}`. All clients subscribe via `onChildAdded`, compute source/target positions from live DOM rects, play a two-phase CSS keyframe animation (600ms arc flight + 400ms fall-fade), then remove the Firebase entry. A portaled backdrop handles tray dismissal. `PlayerCard` gains `forwardRef` so `RoomPage` can build a `userId → HTMLElement` map for position lookups.

**Tech Stack:** React (`forwardRef`, `createPortal`, `useState`), Firebase Realtime Database (`push`, `onChildAdded`, `remove`), CSS keyframe animations — no new libraries.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/firebase.js` | Add `throwEmoji`, `subscribeToThrows`, `removeThrow` |
| Create | `src/firebase.throws.test.js` | Unit tests for the three new Firebase functions |
| Modify | `src/components/PlayerCard.jsx` | Add `forwardRef` + `onClick` prop |
| Modify | `src/components/PlayerCard.test.jsx` | Test onClick behaviour |
| Create | `src/components/EmojiTray.jsx` | Quick-pick tray + expanded grid, portaled |
| Create | `src/components/EmojiTray.module.css` | Tray layout + backdrop |
| Create | `src/components/EmojiTray.test.jsx` | Tray interaction tests |
| Create | `src/components/EmojiThrowOverlay.jsx` | Fixed overlay + `FlyingEmoji` sub-component |
| Create | `src/components/EmojiThrowOverlay.module.css` | Arc + land keyframes |
| Create | `src/components/EmojiThrowOverlay.test.jsx` | Overlay render tests |
| Modify | `src/pages/RoomPage.jsx` | Wire refs, click handler, tray state, overlay, subscription |

---

## Task 1: Firebase — throwEmoji, subscribeToThrows, removeThrow

**Files:**
- Modify: `src/firebase.js`
- Create: `src/firebase.throws.test.js`

- [ ] **Step 1: Create the test file**

Create `src/firebase.throws.test.js`:

```javascript
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
    mockOnChildAdded.mockReturnValue(vi.fn())
    subscribeToThrows('room1', vi.fn())
    expect(mockRef).toHaveBeenCalledWith(expect.anything(), 'rooms/room1/throws')
    expect(mockOnChildAdded).toHaveBeenCalled()
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
    expect(mockRemove).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/firebase.throws.test.js
```

Expected: FAIL — `throwEmoji is not a function` (or similar)

- [ ] **Step 3: Add imports and implement the three functions in firebase.js**

Change the import line in `src/firebase.js` from:
```javascript
import { getDatabase, ref, set, get, update, onValue, remove } from 'firebase/database'
```
to:
```javascript
import { getDatabase, ref, set, get, update, onValue, remove, push, onChildAdded } from 'firebase/database'
```

Then append to the bottom of `src/firebase.js`:

```javascript
export async function throwEmoji(roomId, fromId, toId, emoji) {
  await push(ref(db, `rooms/${roomId}/throws`), { fromId, toId, emoji, timestamp: Date.now() })
}

export function subscribeToThrows(roomId, callback) {
  return onChildAdded(ref(db, `rooms/${roomId}/throws`), snapshot => {
    const data = snapshot.val()
    if (!data || Date.now() - data.timestamp > 10000) return
    callback({ id: snapshot.key, ...data })
  })
}

export async function removeThrow(roomId, throwId) {
  await remove(ref(db, `rooms/${roomId}/throws/${throwId}`))
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/firebase.throws.test.js
```

Expected: PASS — 6 passing

- [ ] **Step 5: Commit**

```bash
git add src/firebase.js src/firebase.throws.test.js
git commit -m "feat: add throwEmoji, subscribeToThrows, removeThrow"
```

---

## Task 2: PlayerCard — forwardRef + onClick

**Files:**
- Modify: `src/components/PlayerCard.jsx`
- Modify: `src/components/PlayerCard.test.jsx`

- [ ] **Step 1: Add failing tests**

Add these two tests to the existing `describe('PlayerCard', ...)` block in `src/components/PlayerCard.test.jsx`. Also add `fireEvent` and `vi` to the import:

```javascript
// Change existing import line to:
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
```

Append inside the `describe` block:

```javascript
  it('calls onClick when the seat is clicked', () => {
    const handleClick = vi.fn()
    render(<PlayerCard name="Bob" card={null} revealed={false} isMe={false} onClick={handleClick} />)
    fireEvent.click(screen.getByTestId('player-seat'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('shows pointer cursor when onClick is provided', () => {
    render(<PlayerCard name="Bob" card={null} revealed={false} isMe={false} onClick={vi.fn()} />)
    expect(screen.getByTestId('player-seat').style.cursor).toBe('pointer')
  })

  it('forwards ref to the seat element', () => {
    const ref = { current: null }
    render(<PlayerCard ref={ref} name="Bob" card={null} revealed={false} isMe={false} />)
    expect(ref.current).not.toBeNull()
    expect(ref.current.tagName).toBe('DIV')
  })
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/components/PlayerCard.test.jsx
```

Expected: FAIL — `getByTestId('player-seat')` not found, ref forwarding not supported

- [ ] **Step 3: Rewrite PlayerCard to use forwardRef**

Replace the entire contents of `src/components/PlayerCard.jsx`:

```javascript
import { forwardRef } from 'react'
import styles from './PlayerCard.module.css'

const PlayerCard = forwardRef(function PlayerCard(
  { name, card, revealed, isMe, index = 0, onClick },
  ref
) {
  const hasVoted = card !== null
  const backClass = hasVoted ? styles.cardBack : styles.cardPending

  return (
    <div
      ref={ref}
      className={styles.seat}
      data-me={isMe || undefined}
      data-testid="player-seat"
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      <div
        className={`${styles.cardWrapper} ${revealed ? styles.flipped : ''}`}
        style={{ '--flip-delay': `${index * 80}ms` }}
      >
        <div className={styles.cardInner}>
          <div className={`${styles.cardFace} ${backClass}`} data-testid={hasVoted ? 'card-back' : 'card-pending'}>
            {isMe && hasVoted && !revealed && (
              <span className={styles.myBadge}>{card}</span>
            )}
          </div>
          <div className={`${styles.cardFace} ${styles.cardFront}`}>
            {hasVoted ? card : '—'}
          </div>
        </div>
      </div>
      <span className={`${styles.name} ${isMe ? styles.nameMe : ''}`}>{name}</span>
    </div>
  )
})

export default PlayerCard
```

- [ ] **Step 4: Run all PlayerCard tests**

```bash
npx vitest run src/components/PlayerCard.test.jsx
```

Expected: PASS — 9 passing

- [ ] **Step 5: Commit**

```bash
git add src/components/PlayerCard.jsx src/components/PlayerCard.test.jsx
git commit -m "feat: add forwardRef and onClick to PlayerCard"
```

---

## Task 3: EmojiTray component

**Files:**
- Create: `src/components/EmojiTray.jsx`
- Create: `src/components/EmojiTray.module.css`
- Create: `src/components/EmojiTray.test.jsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/EmojiTray.test.jsx`:

```javascript
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/components/EmojiTray.test.jsx
```

Expected: FAIL — module not found

- [ ] **Step 3: Create EmojiTray.jsx**

Create `src/components/EmojiTray.jsx`:

```javascript
import { useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './EmojiTray.module.css'

const QUICK_EMOJIS = ['🍅', '💩', '👏', '🔥']

const EXPANDED_EMOJIS = [
  '👍', '👎', '❤️', '😂', '😮', '😢', '😡', '🤩',
  '🎉', '🎊', '🔥', '💯', '✨', '🌟', '⭐', '🏆',
  '🍅', '🍕', '🍺', '🎂', '🍪', '🍔', '🌮',
  '💩', '💀', '🤖', '👑', '🎯', '💎', '🚀',
  '🐛', '🦆', '🐸', '🐧', '🦊', '🐱', '🐶',
  '👋', '👏', '🤝', '🙏', '✌️', '💪',
]

export default function EmojiTray({ targetRect, onThrow, onClose }) {
  const [expanded, setExpanded] = useState(false)

  const isTopHalf = targetRect.top < window.innerHeight / 2
  const trayStyle = {
    position: 'fixed',
    left: targetRect.left + targetRect.width / 2,
    top: isTopHalf ? targetRect.bottom + 8 : targetRect.top - 8,
    transform: isTopHalf ? 'translateX(-50%)' : 'translateX(-50%) translateY(-100%)',
    zIndex: 301,
  }

  function handleThrow(emoji) {
    onThrow(emoji)
    onClose()
  }

  return createPortal(
    <>
      <div
        className={styles.backdrop}
        data-testid="emoji-backdrop"
        onClick={onClose}
      />
      <div className={styles.tray} style={trayStyle}>
        {!expanded ? (
          <div className={styles.quickRow}>
            {QUICK_EMOJIS.map(e => (
              <button key={e} className={styles.emojiBtn} onClick={() => handleThrow(e)}>
                {e}
              </button>
            ))}
            <button className={styles.plusBtn} onClick={() => setExpanded(true)}>+</button>
          </div>
        ) : (
          <div className={styles.grid} data-testid="emoji-grid">
            {EXPANDED_EMOJIS.map(e => (
              <button key={e} className={styles.emojiBtn} onClick={() => handleThrow(e)}>
                {e}
              </button>
            ))}
          </div>
        )}
      </div>
    </>,
    document.body
  )
}
```

- [ ] **Step 4: Create EmojiTray.module.css**

Create `src/components/EmojiTray.module.css`:

```css
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 300;
  background: transparent;
}

.tray {
  background: var(--surface);
  border: 1px solid var(--surface-alt);
  border-radius: var(--radius, 8px);
  padding: 0.4rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

.quickRow {
  display: flex;
  gap: 0.25rem;
  align-items: center;
}

.emojiBtn {
  background: none;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  padding: 0.25rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.1s;
}

.emojiBtn:hover {
  background: var(--surface-alt);
}

.plusBtn {
  background: none;
  border: 1px solid var(--text-muted);
  color: var(--text-muted);
  font-size: 1rem;
  font-weight: 700;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.1s, color 0.1s;
}

.plusBtn:hover {
  background: var(--surface-alt);
  color: var(--text);
}

.grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.1rem;
  max-height: 180px;
  overflow-y: auto;
  width: 220px;
}
```

- [ ] **Step 5: Run tests**

```bash
npx vitest run src/components/EmojiTray.test.jsx
```

Expected: PASS — 6 passing

- [ ] **Step 6: Commit**

```bash
git add src/components/EmojiTray.jsx src/components/EmojiTray.module.css src/components/EmojiTray.test.jsx
git commit -m "feat: add EmojiTray component with quick-picks and expanded grid"
```

---

## Task 4: EmojiThrowOverlay component

**Files:**
- Create: `src/components/EmojiThrowOverlay.jsx`
- Create: `src/components/EmojiThrowOverlay.module.css`
- Create: `src/components/EmojiThrowOverlay.test.jsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/EmojiThrowOverlay.test.jsx`:

```javascript
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import EmojiThrowOverlay from './EmojiThrowOverlay'

function makeRefs(entries) {
  const map = {}
  entries.forEach(([id, rect]) => {
    map[id] = { getBoundingClientRect: () => rect }
  })
  return { current: map }
}

const rectA = { left: 50, top: 100, width: 48, height: 68 }
const rectB = { left: 400, top: 300, width: 48, height: 68 }

describe('EmojiThrowOverlay', () => {
  it('renders nothing when flights is empty', () => {
    const { container } = render(
      <EmojiThrowOverlay flights={[]} playerRefs={makeRefs([])} onFlightDone={vi.fn()} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders a flying emoji for each flight with known refs', () => {
    const flights = [{ id: 't1', fromId: 'a', toId: 'b', emoji: '🍅' }]
    const playerRefs = makeRefs([['a', rectA], ['b', rectB]])
    render(<EmojiThrowOverlay flights={flights} playerRefs={playerRefs} onFlightDone={vi.fn()} />)
    expect(screen.getAllByText('🍅')).toHaveLength(1)
  })

  it('skips flights where fromId ref is missing', () => {
    const flights = [{ id: 't1', fromId: 'unknown', toId: 'b', emoji: '🍅' }]
    const playerRefs = makeRefs([['b', rectB]])
    render(<EmojiThrowOverlay flights={flights} playerRefs={playerRefs} onFlightDone={vi.fn()} />)
    expect(screen.queryByText('🍅')).not.toBeInTheDocument()
  })

  it('skips flights where toId ref is missing', () => {
    const flights = [{ id: 't1', fromId: 'a', toId: 'unknown', emoji: '🍅' }]
    const playerRefs = makeRefs([['a', rectA]])
    render(<EmojiThrowOverlay flights={flights} playerRefs={playerRefs} onFlightDone={vi.fn()} />)
    expect(screen.queryByText('🍅')).not.toBeInTheDocument()
  })

  it('renders multiple flights independently', () => {
    const flights = [
      { id: 't1', fromId: 'a', toId: 'b', emoji: '🍅' },
      { id: 't2', fromId: 'b', toId: 'a', emoji: '💩' },
    ]
    const playerRefs = makeRefs([['a', rectA], ['b', rectB]])
    render(<EmojiThrowOverlay flights={flights} playerRefs={playerRefs} onFlightDone={vi.fn()} />)
    expect(screen.getByText('🍅')).toBeInTheDocument()
    expect(screen.getByText('💩')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/components/EmojiThrowOverlay.test.jsx
```

Expected: FAIL — module not found

- [ ] **Step 3: Create EmojiThrowOverlay.jsx**

Create `src/components/EmojiThrowOverlay.jsx`:

```javascript
import { useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './EmojiThrowOverlay.module.css'

function FlyingEmoji({ emoji, fromRect, toRect, onDone }) {
  const [landed, setLanded] = useState(false)

  const sx = fromRect.left + fromRect.width / 2
  const sy = fromRect.top + fromRect.height / 2
  const tx = toRect.left + toRect.width / 2
  const ty = toRect.top + toRect.height / 2

  if (landed) {
    return (
      <div
        className={styles.land}
        style={{ left: tx, top: ty }}
        onAnimationEnd={onDone}
      >
        {emoji}
      </div>
    )
  }

  return (
    <div
      className={styles.arc}
      style={{
        left: sx,
        top: sy,
        '--dx': `${tx - sx}px`,
        '--dy': `${ty - sy}px`,
      }}
      onAnimationEnd={() => setLanded(true)}
    >
      {emoji}
    </div>
  )
}

export default function EmojiThrowOverlay({ flights, playerRefs, onFlightDone }) {
  if (flights.length === 0) return null

  return createPortal(
    <div className={styles.overlay}>
      {flights.map(f => {
        const fromEl = playerRefs.current[f.fromId]
        const toEl = playerRefs.current[f.toId]
        if (!fromEl || !toEl) return null
        return (
          <FlyingEmoji
            key={f.id}
            emoji={f.emoji}
            fromRect={fromEl.getBoundingClientRect()}
            toRect={toEl.getBoundingClientRect()}
            onDone={() => onFlightDone(f.id)}
          />
        )
      })}
    </div>,
    document.body
  )
}
```

- [ ] **Step 4: Create EmojiThrowOverlay.module.css**

Create `src/components/EmojiThrowOverlay.module.css`:

```css
.overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 400;
}

.arc {
  position: absolute;
  font-size: 2rem;
  line-height: 1;
  pointer-events: none;
  transform: translate(-50%, -50%);
  animation: emojiArc 600ms ease-out forwards;
}

.land {
  position: absolute;
  font-size: 2rem;
  line-height: 1;
  pointer-events: none;
  animation: emojiLand 400ms ease-out forwards;
}

@keyframes emojiArc {
  0% {
    transform: translate(-50%, -50%) translate(0px, 0px) scale(1.2);
  }
  40% {
    transform: translate(-50%, -50%) translate(calc(var(--dx) * 0.4), calc(var(--dy) * 0.4 - 80px)) scale(1.3);
  }
  100% {
    transform: translate(-50%, -50%) translate(var(--dx), var(--dy)) scale(1);
  }
}

@keyframes emojiLand {
  0% {
    transform: translate(-50%, -50%);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, calc(-50% + 30px));
    opacity: 0;
  }
}
```

- [ ] **Step 5: Run tests**

```bash
npx vitest run src/components/EmojiThrowOverlay.test.jsx
```

Expected: PASS — 5 passing

- [ ] **Step 6: Commit**

```bash
git add src/components/EmojiThrowOverlay.jsx src/components/EmojiThrowOverlay.module.css src/components/EmojiThrowOverlay.test.jsx
git commit -m "feat: add EmojiThrowOverlay with arc and land animations"
```

---

## Task 5: Wire up RoomPage

**Files:**
- Modify: `src/pages/RoomPage.jsx`

No new tests for RoomPage (it's already integration-tested via Firebase mocks at the unit level and the component tests cover the pieces). The full flow is validated manually.

- [ ] **Step 1: Add imports at the top of RoomPage.jsx**

Add to the existing import block in `src/pages/RoomPage.jsx`:

```javascript
import { joinRoom, setVote, setRevealed, newRound, subscribeToRoom, subscribeToThrows, throwEmoji, removeThrow } from '../firebase'
import EmojiTray from '../components/EmojiTray'
import EmojiThrowOverlay from '../components/EmojiThrowOverlay'
```

- [ ] **Step 2: Add state and refs inside the RoomPage component**

Add these lines directly after the existing `useState` declarations (after the `const [loading, setLoading] = useState(true)` line):

```javascript
const playerRefs = useRef({})
const [tray, setTray] = useState(null)   // { playerId, rect } | null
const [flights, setFlights] = useState([]) // [{ id, fromId, toId, emoji }]
```

Also add `useRef` to the existing React import at the top of the file:
```javascript
import { useEffect, useState, useCallback, useRef } from 'react'
```

- [ ] **Step 3: Add the subscribeToThrows effect**

Add this effect inside the `RoomPage` component, alongside the existing `useEffect` blocks:

```javascript
useEffect(() => {
  const unsub = subscribeToThrows(roomId, throwEvent => {
    setFlights(prev => [...prev, throwEvent])
  })
  return () => unsub()
}, [roomId])
```

- [ ] **Step 4: Add the click and throw handlers**

Add these two functions inside the `RoomPage` component, alongside the existing handlers:

```javascript
function handlePlayerClick(playerId) {
  const el = playerRefs.current[playerId]
  if (!el) return
  setTray({ playerId, rect: el.getBoundingClientRect() })
}

function handleThrow(emoji) {
  if (!tray) return
  throwEmoji(roomId, session.userId, tray.playerId, emoji)
  setTray(null)
}

function handleFlightDone(throwId) {
  setFlights(prev => prev.filter(f => f.id !== throwId))
  removeThrow(roomId, throwId)
}
```

- [ ] **Step 5: Add callback refs to all four PlayerCard groups**

In the JSX, each `PlayerCard` needs a `ref` callback and an `onClick` (only for non-self players). Update all four `players.map(...)` calls. The pattern is identical for `topPlayers`, `rightPlayers`, `bottomPlayers`, and `leftPlayers`:

Replace each occurrence of:
```jsx
<PlayerCard key={p.id} name={p.name} card={p.card} revealed={revealed} isMe={p.isMe} index={i} />
```
with:
```jsx
<PlayerCard
  key={p.id}
  ref={el => { playerRefs.current[p.id] = el }}
  name={p.name}
  card={p.card}
  revealed={revealed}
  isMe={p.isMe}
  index={i}
  onClick={p.isMe ? undefined : () => handlePlayerClick(p.id)}
/>
```

- [ ] **Step 6: Mount EmojiTray and EmojiThrowOverlay in the JSX**

Add these two elements at the end of the returned JSX, just before the closing `</div>` of the page wrapper (after the `<footer>` element):

```jsx
{tray && (
  <EmojiTray
    targetRect={tray.rect}
    onThrow={handleThrow}
    onClose={() => setTray(null)}
  />
)}
<EmojiThrowOverlay
  flights={flights}
  playerRefs={playerRefs}
  onFlightDone={handleFlightDone}
/>
```

- [ ] **Step 7: Run full test suite to verify nothing broke**

```bash
npx vitest run
```

Expected: all existing tests pass plus the new ones (no regressions)

- [ ] **Step 8: Commit**

```bash
git add src/pages/RoomPage.jsx
git commit -m "feat: wire emoji throwing into RoomPage"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Covered by |
|---|---|
| Click another player → emoji tray opens | Task 5 Step 4–5 (handlePlayerClick, onClick prop) |
| 4 quick-pick emojis: 🍅 💩 👏 🔥 | Task 3 (EmojiTray QUICK_EMOJIS) |
| + button → expanded emoji grid | Task 3 (expanded state) |
| Clicking emoji fires throw + closes tray | Task 3 (handleThrow + onClose) |
| Throw written to Firebase | Task 1 (throwEmoji with push) |
| All clients receive throw via subscription | Task 1 (subscribeToThrows with onChildAdded) |
| Stale throws (>10s) ignored | Task 1 subscribeToThrows handler |
| Parabolic arc animation (600ms) | Task 4 (.arc keyframe with 40% midpoint) |
| Landing fall + fade animation (400ms) | Task 4 (.land keyframe) |
| Firebase entry removed after animation | Task 5 (handleFlightDone → removeThrow) |
| Tray portaled to avoid overflow clipping | Task 3 (createPortal) |
| Overlay portaled, pointer-events none | Task 4 (.overlay CSS) |
| PlayerCard exposes ref | Task 2 (forwardRef) |

**Placeholder scan:** None found.

**Type consistency:** `throwId` (string) used consistently across `flights`, `onFlightDone`, `handleFlightDone`, `removeThrow`. `playerRefs.current` is `{ [userId]: HTMLElement | null }` accessed consistently in Task 4 and Task 5.
