# Room Owner & Kick Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a room owner concept so the creator can kick players (soft) and transfer ownership, with a crown badge on the owner's card and owner actions in the existing EmojiTray overlay.

**Architecture:** `ownerId` is stored as a scalar in the Firebase room node, written once at room creation. All clients derive owner status from `roomData.ownerId`. The existing EmojiTray gets an owner-only action row (kick + transfer). RoomPage handles kicked-redirect and auto-transfer via `useEffect`.

**Tech Stack:** React 18, Firebase Realtime Database, Vitest + Testing Library, CSS Modules

---

### Task 1: Firebase — `ownerId` on creation, `kickPlayer`, `transferOwnership`

**Files:**
- Modify: `src/firebase.js`
- Create: `src/firebase.owner.test.js`

- [ ] **Step 1: Write the failing tests**

Create `src/firebase.owner.test.js`:

```js
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
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/firebase.owner.test.js
```

Expected: FAIL — `kickPlayer` and `transferOwnership` not exported, `ownerId` not in creation payload.

- [ ] **Step 3: Implement the changes in `src/firebase.js`**

In `joinRoom`, change the creation block from:
```js
await set(roomRef, { createdAt: Date.now(), revealed: false, votes: {} })
```
to:
```js
await set(roomRef, { createdAt: Date.now(), ownerId: userId, revealed: false, votes: {} })
```

Add the two new exported functions at the end of the file:
```js
export async function kickPlayer(roomId, userId) {
  await remove(ref(db, `rooms/${roomId}/votes/${userId}`))
}

export async function transferOwnership(roomId, newUserId) {
  await set(ref(db, `rooms/${roomId}/ownerId`), newUserId)
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/firebase.owner.test.js
```

Expected: all 5 tests PASS.

- [ ] **Step 5: Run the full test suite to check for regressions**

```bash
npx vitest run
```

Expected: all existing tests still PASS.

- [ ] **Step 6: Commit**

```bash
git add src/firebase.js src/firebase.owner.test.js
git commit -m "feat: add ownerId to room creation, kickPlayer, transferOwnership"
```

---

### Task 2: PlayerCard — crown badge

**Files:**
- Modify: `src/components/PlayerCard.jsx`
- Modify: `src/components/PlayerCard.module.css`
- Modify: `src/components/PlayerCard.test.jsx`

- [ ] **Step 1: Write the failing tests**

Add to `src/components/PlayerCard.test.jsx`:

```jsx
it('shows crown badge when isOwner is true', () => {
  render(<PlayerCard name="Alice" card={null} revealed={false} isMe={false} isOwner={true} />)
  expect(screen.getByTestId('crown-badge')).toBeInTheDocument()
})

it('does not show crown badge when isOwner is false', () => {
  render(<PlayerCard name="Alice" card={null} revealed={false} isMe={false} isOwner={false} />)
  expect(screen.queryByTestId('crown-badge')).not.toBeInTheDocument()
})

it('does not show crown badge when isOwner is omitted', () => {
  render(<PlayerCard name="Alice" card={null} revealed={false} isMe={false} />)
  expect(screen.queryByTestId('crown-badge')).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/components/PlayerCard.test.jsx
```

Expected: FAIL — `crown-badge` not found.

- [ ] **Step 3: Add `isOwner` prop and crown badge to `PlayerCard.jsx`**

Replace the component signature and add the crown badge inside the `cardWrapper` div:

```jsx
const PlayerCard = forwardRef(function PlayerCard(
  { name, card, revealed, isMe, isOwner, index = 0, onClick },
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
        {isOwner && (
          <span className={styles.crownBadge} data-testid="crown-badge">👑</span>
        )}
        <div className={styles.cardInner}>
          <div className={`${styles.cardFace} ${backClass}`} data-testid={hasVoted ? 'card-back' : 'card-pending'}>
            {isMe && hasVoted && !revealed && (
              <span className={styles.myBadge}>{card}</span>
            )}
          </div>
          <div className={`${styles.cardFace} ${styles.cardFront}`}>
            {revealed && (hasVoted ? card : '—')}
          </div>
        </div>
      </div>
      <span className={`${styles.name} ${isMe ? styles.nameMe : ''}`} title={name}>{name}</span>
    </div>
  )
})
```

- [ ] **Step 4: Add crown badge styles to `PlayerCard.module.css`**

Add `position: relative` to `.cardWrapper` and a new `.crownBadge` rule:

```css
.cardWrapper {
  width: 48px;
  height: 68px;
  perspective: 600px;
  position: relative;
}
```

```css
.crownBadge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.8rem;
  line-height: 1;
  pointer-events: none;
  z-index: 1;
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.7));
}
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
npx vitest run src/components/PlayerCard.test.jsx
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/PlayerCard.jsx src/components/PlayerCard.module.css src/components/PlayerCard.test.jsx
git commit -m "feat: add crown badge to PlayerCard for room owner"
```

---

### Task 3: EmojiTray — owner actions row

**Files:**
- Modify: `src/components/EmojiTray.jsx`
- Modify: `src/components/EmojiTray.module.css`
- Modify: `src/components/EmojiTray.test.jsx`

- [ ] **Step 1: Write the failing tests**

Add to `src/components/EmojiTray.test.jsx`:

```jsx
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
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/components/EmojiTray.test.jsx
```

Expected: FAIL — `kick-btn` and `transfer-btn` not found.

- [ ] **Step 3: Update `EmojiTray.jsx` to accept and render owner props**

Replace the component signature and add the owner row below the quick row. The full updated component:

```jsx
import { useState } from 'react'
import { createPortal } from 'react-dom'
import Picker from '@emoji-mart/react'
import data from '@emoji-mart/data'
import styles from './EmojiTray.module.css'

const QUICK_EMOJIS = ['🍅', '💩', '👏']
const LAST_PICKER_KEY = 'lastPickerEmoji'

function getLastPickerEmoji() {
  return localStorage.getItem(LAST_PICKER_KEY) || '🔥'
}

function GridIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor" aria-hidden>
      <rect x="0" y="0" width="6" height="6" rx="1.5" />
      <rect x="9" y="0" width="6" height="6" rx="1.5" />
      <rect x="0" y="9" width="6" height="6" rx="1.5" />
      <rect x="9" y="9" width="6" height="6" rx="1.5" />
    </svg>
  )
}

export default function EmojiTray({ targetRect, onThrow, onClose, isOwnerViewing, onKick, onTransfer }) {
  const [expanded, setExpanded] = useState(false)
  const [lastPickerEmoji, setLastPickerEmoji] = useState(getLastPickerEmoji)

  const isTopHalf = targetRect.top < window.innerHeight / 2
  const anchorStyle = {
    position: 'fixed',
    left: targetRect.left + targetRect.width / 2,
    top: isTopHalf ? targetRect.bottom + 8 : targetRect.top - 8,
    zIndex: 301,
  }

  function handleThrow(emoji) {
    onThrow(emoji)
    onClose()
  }

  function handlePickerSelect(emojiData) {
    const emoji = emojiData.native
    localStorage.setItem(LAST_PICKER_KEY, emoji)
    setLastPickerEmoji(emoji)
    handleThrow(emoji)
  }

  const showOwnerRow = isOwnerViewing && !expanded

  const trayClass = [
    isTopHalf ? styles.tray : styles.trayAbove,
    expanded ? styles.trayExpanded : '',
    showOwnerRow ? styles.trayOwner : '',
  ].filter(Boolean).join(' ')

  return createPortal(
    <>
      <div
        className={styles.backdrop}
        data-testid="emoji-backdrop"
        onClick={onClose}
      />
      <div style={anchorStyle}>
        <div className={trayClass}>
          {!expanded ? (
            <>
              <div className={styles.quickRow}>
                {QUICK_EMOJIS.map(e => (
                  <button key={e} className={styles.emojiBtn} onClick={() => handleThrow(e)}>
                    {e}
                  </button>
                ))}
                <button
                  className={`${styles.emojiBtn} ${styles.recentBtn}`}
                  onClick={() => handleThrow(lastPickerEmoji)}
                  title="Recently used"
                >
                  {lastPickerEmoji}
                </button>
                <button
                  className={styles.moreBtn}
                  onClick={() => setExpanded(true)}
                  title="All emojis"
                  data-testid="more-btn"
                >
                  <GridIcon />
                </button>
              </div>
              {showOwnerRow && (
                <>
                  <div className={styles.ownerDivider} />
                  <div className={styles.ownerRow}>
                    <button
                      className={styles.ownerBtn}
                      onClick={() => { onKick(); onClose() }}
                      data-testid="kick-btn"
                    >
                      👟 Kick
                    </button>
                    <button
                      className={styles.ownerBtn}
                      onClick={() => { onTransfer(); onClose() }}
                      data-testid="transfer-btn"
                    >
                      👑 Make owner
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <div data-testid="emoji-grid">
              <Picker
                data={data}
                onEmojiSelect={handlePickerSelect}
                theme="dark"
                previewPosition="none"
                skinTonePosition="none"
                autoFocus
              />
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  )
}
```

- [ ] **Step 4: Add owner row styles to `EmojiTray.module.css`**

Add after the `.moreBtn:active` rule:

```css
/* owner actions — shown below emoji row when viewer is room owner */
.trayOwner {
  border-radius: 16px;
  padding: 0.3rem 0.4rem 0.5rem;
}

.ownerDivider {
  height: 1px;
  background: rgba(236, 223, 204, 0.14);
  margin: 0.3rem 0.1rem 0.25rem;
}

.ownerRow {
  display: flex;
  gap: 0.4rem;
  justify-content: center;
}

.ownerBtn {
  flex: 1;
  padding: 0.3rem 0.5rem;
  background: rgba(236, 223, 204, 0.07);
  border: 1.5px solid rgba(236, 223, 204, 0.16);
  border-radius: 8px;
  color: rgba(236, 223, 204, 0.75);
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.13s, border-color 0.13s, color 0.13s;
  white-space: nowrap;
}

.ownerBtn:hover {
  background: rgba(236, 223, 204, 0.14);
  border-color: rgba(236, 223, 204, 0.35);
  color: rgba(236, 223, 204, 0.95);
}

.ownerBtn:active {
  background: rgba(236, 223, 204, 0.2);
  transition-duration: 0.06s;
}
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
npx vitest run src/components/EmojiTray.test.jsx
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/EmojiTray.jsx src/components/EmojiTray.module.css src/components/EmojiTray.test.jsx
git commit -m "feat: add owner kick/transfer actions to EmojiTray"
```

---

### Task 4: HomePage — kicked message

**Files:**
- Modify: `src/pages/HomePage.jsx`
- Modify: `src/pages/HomePage.test.jsx`

- [ ] **Step 1: Write the failing tests**

The existing mock for `react-router-dom` in `HomePage.test.jsx` will need `useSearchParams` added. Replace the entire file content:

```jsx
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

const renderHome = (search = '') =>
  render(<MemoryRouter initialEntries={[`/${search}`]}><HomePage /></MemoryRouter>)

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

  it('shows kicked message when ?kicked=1 is in the URL', () => {
    renderHome('?kicked=1')
    expect(screen.getByTestId('kicked-message')).toBeInTheDocument()
    expect(screen.getByText(/removed from the room/i)).toBeInTheDocument()
  })

  it('does not show kicked message without ?kicked=1', () => {
    renderHome()
    expect(screen.queryByTestId('kicked-message')).not.toBeInTheDocument()
  })

  it('dismisses kicked message when close button is clicked', () => {
    renderHome('?kicked=1')
    fireEvent.click(screen.getByTestId('kicked-dismiss'))
    expect(screen.queryByTestId('kicked-message')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/pages/HomePage.test.jsx
```

Expected: FAIL — `kicked-message` not found.

- [ ] **Step 3: Update `HomePage.jsx` to show kicked message**

```jsx
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { generateRoomId, generateUserId } from '../utils'
import styles from './HomePage.module.css'

export default function HomePage() {
  const [name, setName] = useState('')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [showKicked, setShowKicked] = useState(searchParams.get('kicked') === '1')

  function handleCreate() {
    const userId = generateUserId()
    const roomId = generateRoomId()
    sessionStorage.setItem('name', name.trim())
    sessionStorage.setItem('userId', userId)
    navigate(`/room/${roomId}`)
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Gus' Planning Poker</h1>
      {showKicked && (
        <div className={styles.kickedMessage} data-testid="kicked-message">
          <span>You were removed from the room.</span>
          <button
            className={styles.kickedDismiss}
            onClick={() => setShowKicked(false)}
            data-testid="kicked-dismiss"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}
      <div className={styles.card}>
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && name.trim() && handleCreate()}
          maxLength={30}
        />
        <button
          className={styles.createBtn}
          onClick={handleCreate}
          disabled={!name.trim()}
        >
          Create Room
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Add kicked message styles to `HomePage.module.css`**

Read the file first, then append:

```css
.kickedMessage {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(220, 80, 80, 0.15);
  border: 1px solid rgba(220, 80, 80, 0.35);
  border-radius: 8px;
  padding: 0.6rem 1rem;
  color: rgba(236, 223, 204, 0.85);
  font-size: 0.9rem;
  margin-bottom: 1rem;
  max-width: 360px;
  width: 100%;
}

.kickedDismiss {
  margin-left: auto;
  background: none;
  border: none;
  color: rgba(236, 223, 204, 0.5);
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0;
  line-height: 1;
  flex-shrink: 0;
}

.kickedDismiss:hover {
  color: rgba(236, 223, 204, 0.9);
}
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
npx vitest run src/pages/HomePage.test.jsx
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/pages/HomePage.jsx src/pages/HomePage.module.css src/pages/HomePage.test.jsx
git commit -m "feat: show kicked message on HomePage when redirected from room"
```

---

### Task 5: RoomPage — wire owner logic

**Files:**
- Modify: `src/pages/RoomPage.jsx`
- Create: `src/pages/RoomPage.test.jsx`

- [ ] **Step 1: Write the failing tests**

Create `src/pages/RoomPage.test.jsx`:

```jsx
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
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/pages/RoomPage.test.jsx
```

Expected: FAIL — `kickPlayer`, `transferOwnership` not imported, no redirect logic.

- [ ] **Step 3: Update `RoomPage.jsx` with owner wiring**

Replace the full file:

```jsx
import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { joinRoom, setVote, setRevealed, newRound, subscribeToRoom, subscribeToThrows, throwEmoji, removeThrow, kickPlayer, transferOwnership } from '../firebase'
import { generateUserId, computeResults } from '../utils'
import NameOverlay from '../components/NameOverlay'
import Table from '../components/Table'
import PlayerCard from '../components/PlayerCard'
import CardDeck from '../components/CardDeck'
import ResultsBar from '../components/ResultsBar'
import Sparkles from '../components/Sparkles'
import EmojiTray from '../components/EmojiTray'
import EmojiThrowOverlay from '../components/EmojiThrowOverlay'
import styles from './RoomPage.module.css'

function getSession() {
  return {
    name: sessionStorage.getItem('name'),
    userId: sessionStorage.getItem('userId'),
  }
}

function setSession(name, userId) {
  sessionStorage.setItem('name', name)
  sessionStorage.setItem('userId', userId)
}

export default function RoomPage() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const [roomData, setRoomData] = useState(null)
  const [session, setSessionState] = useState(getSession)
  const [loading, setLoading] = useState(true)
  const playerRefs = useRef({})
  const [tray, setTray] = useState(null)
  const [flights, setFlights] = useState([])
  const hasJoined = useRef(false)

  const hasSession = Boolean(session.name && session.userId)

  useEffect(() => {
    if (!hasSession) return
    joinRoom(roomId, session.userId, session.name).then(() => {
      hasJoined.current = true
      setLoading(false)
    })
  }, [roomId, session.userId, session.name, hasSession])

  useEffect(() => {
    const unsubscribe = subscribeToRoom(roomId, data => {
      setRoomData(data)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [roomId])

  useEffect(() => {
    const unsub = subscribeToThrows(roomId, throwEvent => {
      setFlights(prev => [...prev, throwEvent])
    })
    return () => unsub()
  }, [roomId])

  // Redirect kicked player
  useEffect(() => {
    if (!hasJoined.current || !roomData) return
    const votes = roomData.votes || {}
    if (!votes[session.userId]) {
      navigate('/?kicked=1')
    }
  }, [roomData, session.userId, navigate])

  // Auto-transfer ownership when owner leaves
  useEffect(() => {
    if (!roomData) return
    const votes = roomData.votes || {}
    const ownerId = roomData.ownerId
    if (!ownerId || votes[ownerId]) return
    const remaining = Object.keys(votes).sort()
    if (remaining.length === 0) return
    if (remaining[0] === session.userId) {
      transferOwnership(roomId, session.userId)
    }
  }, [roomData, roomId, session.userId])

  const handleJoin = useCallback((name) => {
    const userId = generateUserId()
    setSession(name, userId)
    setSessionState({ name, userId })
  }, [])

  if (!hasSession) {
    return <NameOverlay onJoin={handleJoin} />
  }

  if (loading || !roomData) {
    return <div className={styles.loading}>Connecting…</div>
  }

  const votes = roomData.votes || {}
  const revealed = roomData.revealed || false
  const myVote = votes[session.userId]?.card ?? null
  const results = computeResults(votes)
  const allMatch = revealed && results.length === 1
  const isOwner = session.userId === roomData.ownerId

  const players = Object.entries(votes).map(([id, data]) => ({
    id,
    name: data.name,
    card: data.card ?? null,
    isMe: id === session.userId,
    isOwner: id === roomData.ownerId,
  }))

  const base = Math.floor(players.length / 4)
  const rem = players.length % 4
  const topCount    = base + (rem > 0 ? 1 : 0)
  const bottomCount = base + (rem > 1 ? 1 : 0)
  const rightCount  = base + (rem > 2 ? 1 : 0)
  const topPlayers    = players.slice(0, topCount)
  const rightPlayers  = players.slice(topCount, topCount + rightCount)
  const bottomPlayers = players.slice(topCount + rightCount, topCount + rightCount + bottomCount)
  const leftPlayers   = players.slice(topCount + rightCount + bottomCount)

  function handleReveal() {
    setRevealed(roomId, true)
  }

  function handleNewRound() {
    newRound(roomId, votes)
  }

  function handleSelectCard(value) {
    setVote(roomId, session.userId, value)
  }

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

  function handleKick() {
    if (!tray) return
    kickPlayer(roomId, tray.playerId)
    setTray(null)
  }

  function handleTransfer() {
    if (!tray) return
    transferOwnership(roomId, tray.playerId)
    setTray(null)
  }

  function handleFlightDone(throwId) {
    setFlights(prev => prev.filter(f => f.id !== throwId))
    removeThrow(roomId, throwId)
  }

  function playerCard(p, i) {
    return (
      <PlayerCard
        key={p.id}
        ref={el => { playerRefs.current[p.id] = el }}
        name={p.name}
        card={p.card}
        revealed={revealed}
        isMe={p.isMe}
        isOwner={p.isOwner}
        index={i}
        onClick={p.isMe ? undefined : () => handlePlayerClick(p.id)}
      />
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/" className={styles.logo}>Gus' Planning Poker</Link>
        <span className={styles.roomId}>Room: {roomId}</span>
      </header>

      <main className={styles.main}>
        <div className={styles.topRow}>
          {topPlayers.map((p, i) => playerCard(p, i))}
        </div>

        <div className={styles.middleRow}>
          <div className={styles.sideCol}>
            {leftPlayers.map((p, i) => playerCard(p, i))}
          </div>

          <div className={styles.center}>
            <Table revealed={revealed} onReveal={handleReveal} onNewRound={handleNewRound} />
          </div>

          <div className={styles.sideCol}>
            {rightPlayers.map((p, i) => playerCard(p, i))}
          </div>
        </div>

        <div className={styles.bottomRow}>
          {bottomPlayers.map((p, i) => playerCard(p, i))}
        </div>
      </main>

      {revealed && <ResultsBar results={results} />}
      <Sparkles active={allMatch} />

      <footer className={styles.footer}>
        <CardDeck selected={myVote} onSelect={handleSelectCard} />
      </footer>

      {tray && (
        <EmojiTray
          targetRect={tray.rect}
          onThrow={handleThrow}
          onClose={() => setTray(null)}
          isOwnerViewing={isOwner}
          onKick={handleKick}
          onTransfer={handleTransfer}
        />
      )}
      <EmojiThrowOverlay
        flights={flights}
        playerRefs={playerRefs}
        onFlightDone={handleFlightDone}
      />
    </div>
  )
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/pages/RoomPage.test.jsx
```

Expected: all tests PASS.

- [ ] **Step 5: Run the full test suite**

```bash
npx vitest run
```

Expected: all tests PASS with no regressions.

- [ ] **Step 6: Commit**

```bash
git add src/pages/RoomPage.jsx src/pages/RoomPage.test.jsx
git commit -m "feat: wire room owner — crown, kick, transfer, auto-transfer, kicked redirect"
```
