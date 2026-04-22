# UI Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a full CSS design token system, a mobile-responsive layout, and accessibility/polish improvements to the planning poker UI.

**Architecture:** Three sequential layers — (1) tokens added to `src/index.css` so all subsequent tasks can use them, (2) responsive layout via a new mobile player rail and media queries in existing CSS Modules, (3) a11y and polish spread across components. No Firebase or game logic is touched.

**Tech Stack:** React 18, Vite, CSS Modules, Vitest + Testing Library

---

## File Map

| File | Action |
|------|--------|
| `src/index.css` | Add design tokens + global `:focus-visible` rule |
| `src/components/RoomSkeleton.jsx` | Create — skeleton loader component |
| `src/components/RoomSkeleton.module.css` | Create — pulse animation + layout |
| `src/pages/RoomPage.jsx` | Add `.playerRail`, swap in `RoomSkeleton` |
| `src/pages/RoomPage.module.css` | Mobile media query; `.playerRail` styles |
| `src/components/ResultsBar.jsx` | Add `role="status"` + `aria-live` |
| `src/components/ResultsBar.module.css` | Fix hardcoded `bottom` with token |
| `src/pages/HomePage.module.css` | Small-screen card padding |
| `src/components/CardDeck.jsx` | Add `aria-label` to card buttons |
| `src/components/EmojiTray.jsx` | Add `aria-label` + back button |
| `src/components/EmojiTray.module.css` | `.backBtn` style |
| `src/components/CardDeck.module.css` | Replace ad-hoc transitions with tokens |
| `src/components/Table.module.css` | Replace ad-hoc transitions with tokens |
| `src/components/PlayerCard.module.css` | Replace ad-hoc transitions with tokens |

---

## Task 1: Add Design Tokens to `src/index.css`

**Files:**
- Modify: `src/index.css`

> Note: The current `:root` block ends at line 19. Append new tokens after `--radius-lg: 16px;`. Also add `--footer-height` and the global `:focus-visible` rule. The existing `button { transition: background 0.2s, transform 0.1s; }` rule stays — it is replaced in later tasks per-component.

- [ ] **Step 1: Open `src/index.css` and update the `:root` block**

Replace the entire `:root` block (lines 7–19) with:

```css
:root {
  --bg: #1c1820;
  --surface: #28222e;
  --surface-alt: #3a2f42;
  --accent: #ecdfcc;
  --accent-hover: #d5c8b3;
  --text: #ecdfcc;
  --text-muted: #7a6585;
  --card-back: #3a2f42;
  --card-border: #ecdfcc;
  --radius: 8px;
  --radius-lg: 16px;

  /* spacing scale */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;

  /* shadow scale */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.3);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.4);
  --shadow-lg: 0 8px 24px rgba(0,0,0,0.5);
  --shadow-xl: 0 16px 40px rgba(0,0,0,0.6);

  /* transition scale */
  --duration-fast: 0.1s;
  --duration-normal: 0.2s;
  --ease-out: cubic-bezier(0.4, 0, 0.2, 1);

  /* semantic colors */
  --color-error: #f87171;
  --color-error-bg: rgba(248, 113, 113, 0.12);
  --color-error-border: rgba(248, 113, 113, 0.35);
  --color-overlay: rgba(0, 0, 0, 0.6);
  --color-surface-float: rgba(255, 255, 255, 0.06);

  /* z-index scale */
  --z-results: 50;
  --z-sparkles: 100;
  --z-overlay: 200;
  --z-tray: 300;
  --z-throws: 400;

  /* layout */
  --footer-height: 8rem;
}
```

- [ ] **Step 2: Add the global `:focus-visible` rule**

After the `input:focus { ... }` block at the bottom of `src/index.css`, append:

```css
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

- [ ] **Step 3: Run the test suite**

```bash
npm test
```

Expected: all existing tests pass (no component changes yet).

- [ ] **Step 4: Commit**

```bash
git add src/index.css
git commit -m "feat: add design tokens and focus-visible rule to index.css"
```

---

## Task 2: Skeleton Loader Component

**Files:**
- Create: `src/components/RoomSkeleton.jsx`
- Create: `src/components/RoomSkeleton.module.css`
- Modify: `src/pages/RoomPage.jsx` (swap loading state)
- Modify: `src/pages/RoomPage.module.css` (remove now-unused `.loading`)

> This task replaces the plain "Connecting…" text with a pulsing skeleton that mirrors the desktop layout structure, preventing a jarring flash on load.

- [ ] **Step 1: Write the failing test**

Create `src/components/RoomSkeleton.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import RoomSkeleton from './RoomSkeleton'

describe('RoomSkeleton', () => {
  it('renders skeleton cards', () => {
    render(<RoomSkeleton />)
    expect(screen.getByTestId('room-skeleton')).toBeInTheDocument()
  })

  it('has aria-label for screen readers', () => {
    render(<RoomSkeleton />)
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading room…')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- RoomSkeleton
```

Expected: FAIL with "Cannot find module './RoomSkeleton'"

- [ ] **Step 3: Create `src/components/RoomSkeleton.jsx`**

```jsx
import styles from './RoomSkeleton.module.css'

function SkeletonCard() {
  return <div className={styles.card} />
}

export default function RoomSkeleton() {
  return (
    <div
      className={styles.page}
      data-testid="room-skeleton"
      role="status"
      aria-label="Loading room…"
    >
      <div className={styles.topRow}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className={styles.middle}>
        <div className={styles.table} />
      </div>
      <div className={styles.bottomRow}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create `src/components/RoomSkeleton.module.css`**

```css
@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50%       { opacity: 0.8; }
}

.page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-5);
  height: 100vh;
}

.topRow,
.bottomRow {
  display: flex;
  gap: var(--space-5);
  justify-content: center;
}

.middle {
  display: flex;
  align-items: center;
  justify-content: center;
}

.card {
  width: 48px;
  height: 68px;
  border-radius: var(--radius);
  background: var(--surface-alt);
  animation: pulse 1.5s ease-in-out infinite;
}

.table {
  width: 220px;
  height: 110px;
  border-radius: 60px;
  background: var(--surface-alt);
  animation: pulse 1.5s ease-in-out infinite;
  animation-delay: 0.25s;
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npm test -- RoomSkeleton
```

Expected: 2 tests pass.

- [ ] **Step 6: Update `src/pages/RoomPage.jsx` to use `RoomSkeleton`**

Add the import at the top of `RoomPage.jsx` (after the existing component imports):

```jsx
import RoomSkeleton from '../components/RoomSkeleton'
```

Find the loading guard (around line 96–98):

```jsx
  if (loading || !roomData) {
    return <div className={styles.loading}>Connecting…</div>
  }
```

Replace it with:

```jsx
  if (loading || !roomData) {
    return <RoomSkeleton />
  }
```

- [ ] **Step 7: Remove the unused `.loading` rule from `src/pages/RoomPage.module.css`**

Delete lines 79–87:

```css
.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  color: var(--text-muted);
  font-size: 1.1rem;
}
```

- [ ] **Step 8: Run all tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 9: Commit**

```bash
git add src/components/RoomSkeleton.jsx src/components/RoomSkeleton.module.css src/components/RoomSkeleton.test.jsx src/pages/RoomPage.jsx src/pages/RoomPage.module.css
git commit -m "feat: replace loading text with skeleton loader"
```

---

## Task 3: Mobile Player Rail

**Files:**
- Modify: `src/pages/RoomPage.jsx` (add `.playerRail` JSX)
- Modify: `src/pages/RoomPage.module.css` (rail styles + mobile media query)

> On screens ≤768px, all players are shown in one horizontal scrollable row above the table. The existing top/left/right/bottom rows are hidden. On desktop (>768px), the rail is hidden and the existing layout is unchanged.

- [ ] **Step 1: Add `.playerRail` to `src/pages/RoomPage.jsx`**

At the top of the return statement in `RoomPage.jsx`, inside `<main className={styles.main}>`, add the rail **before** the existing `.topRow` div:

```jsx
      <main className={styles.main}>
        <div className={styles.playerRail}>
          {players.map((p, i) => playerCard(p, i))}
        </div>

        <div className={styles.topRow}>
```

The full `<main>` opening now looks like:

```jsx
      <main className={styles.main}>
        <div className={styles.playerRail}>
          {players.map((p, i) => playerCard(p, i))}
        </div>

        <div className={styles.topRow}>
          {topPlayers.map((p, i) => playerCard(p, i))}
        </div>

        <div className={styles.middleRow}>
          ...
        </div>

        <div className={styles.bottomRow}>
          {bottomPlayers.map((p, i) => playerCard(p, i))}
        </div>
      </main>
```

- [ ] **Step 2: Add `.playerRail` styles and mobile media query to `src/pages/RoomPage.module.css`**

Append to the end of `src/pages/RoomPage.module.css`:

```css
/* Mobile player rail — hidden on desktop */
.playerRail {
  display: none;
}

@media (max-width: 768px) {
  /* Show rail, hide desktop grid rows */
  .playerRail {
    display: flex;
    flex-direction: row;
    gap: var(--space-3);
    overflow-x: auto;
    padding: var(--space-2) var(--space-4);
    width: 100%;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }

  .playerRail::-webkit-scrollbar {
    display: none;
  }

  .topRow,
  .bottomRow {
    display: none;
  }

  .sideCol {
    display: none;
  }

  .middleRow {
    flex-direction: column;
    gap: var(--space-4);
  }

  .main {
    padding: var(--space-3);
    gap: var(--space-4);
  }
}
```

- [ ] **Step 3: Run all tests**

```bash
npm test
```

Expected: all tests pass (layout is visual-only, no logic change).

- [ ] **Step 4: Commit**

```bash
git add src/pages/RoomPage.jsx src/pages/RoomPage.module.css
git commit -m "feat: add mobile horizontal player rail with responsive layout"
```

---

## Task 4: ResultsBar Token Fix + Aria

**Files:**
- Modify: `src/components/ResultsBar.jsx`
- Modify: `src/components/ResultsBar.module.css`

- [ ] **Step 1: Write the failing test**

Add to `src/components/ResultsBar.test.jsx` (create if it doesn't exist):

```jsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ResultsBar from './ResultsBar'

const results = [
  { card: '5', count: 2, percentage: 67 },
  { card: '8', count: 1, percentage: 33 },
]

describe('ResultsBar', () => {
  it('renders nothing when results is empty', () => {
    const { container } = render(<ResultsBar results={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('has role=status and aria-live for screen readers', () => {
    render(<ResultsBar results={results} />)
    const bar = screen.getByRole('status')
    expect(bar).toBeInTheDocument()
    expect(bar).toHaveAttribute('aria-live', 'polite')
  })

  it('renders each result card label', () => {
    render(<ResultsBar results={results} />)
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify the aria test fails**

```bash
npm test -- ResultsBar
```

Expected: "has role=status" test FAILs (element not found).

- [ ] **Step 3: Update `src/components/ResultsBar.jsx`**

Replace the `<div className={styles.bar}>` opening tag with:

```jsx
    <div className={styles.bar} role="status" aria-live="polite">
```

Full updated component:

```jsx
import styles from './ResultsBar.module.css'

export default function ResultsBar({ results }) {
  if (!results.length) return null

  return (
    <div className={styles.bar} role="status" aria-live="polite">
      {results.map(({ card, count, percentage }) => (
        <div key={card} className={styles.row}>
          <span className={styles.cardLabel}>{card}</span>
          <div className={styles.track}>
            <div className={styles.fill} style={{ width: `${percentage}%` }} />
          </div>
          <span className={styles.label}>
            {count} {count === 1 ? 'vote' : 'votes'} ({percentage}%)
          </span>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Fix the hardcoded `bottom` in `src/components/ResultsBar.module.css`**

In `.bar`, replace:

```css
  bottom: 8.5rem;
```

with:

```css
  bottom: calc(var(--footer-height) + var(--space-2));
```

Also replace `z-index: 50;` with `z-index: var(--z-results);`.

The full `.bar` rule becomes:

```css
.bar {
  position: fixed;
  bottom: calc(var(--footer-height) + var(--space-2));
  left: 50%;
  transform: translateX(-50%);
  z-index: var(--z-results);
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0.9rem 1.4rem;
  background: var(--surface);
  border: 1px solid var(--surface-alt);
  border-radius: var(--radius-lg);
  min-width: 260px;
  max-width: 420px;
  animation: slideUp 0.3s ease both;
}
```

- [ ] **Step 5: Run test to verify all pass**

```bash
npm test -- ResultsBar
```

Expected: all 3 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/ResultsBar.jsx src/components/ResultsBar.module.css src/components/ResultsBar.test.jsx
git commit -m "feat: add aria-live to ResultsBar, fix bottom positioning with token"
```

---

## Task 5: HomePage Small-Screen Padding

**Files:**
- Modify: `src/pages/HomePage.module.css`

- [ ] **Step 1: Add small-screen padding to `src/pages/HomePage.module.css`**

Append at the end of the file:

```css
@media (max-width: 400px) {
  .card {
    padding: var(--space-4);
    margin: 0 var(--space-2);
  }
}
```

- [ ] **Step 2: Run all tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/pages/HomePage.module.css
git commit -m "feat: prevent homepage card from clipping on very small screens"
```

---

## Task 6: CardDeck Aria-Labels and Transition Tokens

**Files:**
- Modify: `src/components/CardDeck.jsx`
- Modify: `src/components/CardDeck.module.css`

- [ ] **Step 1: Write the failing test**

Create `src/components/CardDeck.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import CardDeck from './CardDeck'

describe('CardDeck', () => {
  it('renders a button for each card value', () => {
    render(<CardDeck selected={null} onSelect={() => {}} />)
    expect(screen.getAllByRole('button')).toHaveLength(8)
  })

  it('each button has an aria-label', () => {
    render(<CardDeck selected={null} onSelect={() => {}} />)
    expect(screen.getByRole('button', { name: 'Select 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Select 5' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Select ?' })).toBeInTheDocument()
  })

  it('selected card has aria-pressed=true', () => {
    render(<CardDeck selected="5" onSelect={() => {}} />)
    expect(screen.getByRole('button', { name: 'Select 5' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Select 1' })).toHaveAttribute('aria-pressed', 'false')
  })
})
```

- [ ] **Step 2: Run test to verify aria-label test fails**

```bash
npm test -- CardDeck
```

Expected: "each button has an aria-label" FAILs (buttons currently have no aria-label).

- [ ] **Step 3: Update `src/components/CardDeck.jsx`**

```jsx
import styles from './CardDeck.module.css'

const CARDS = ['1', '2', '3', '5', '8', '13', '21', '?']

export default function CardDeck({ selected, onSelect }) {
  return (
    <div className={styles.deck}>
      {CARDS.map(value => (
        <button
          key={value}
          className={`${styles.card} ${selected === value ? styles.selected : ''}`}
          onClick={() => onSelect(selected === value ? null : value)}
          aria-pressed={selected === value ? 'true' : 'false'}
          aria-label={`Select ${value}`}
        >
          {value}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Replace ad-hoc transitions in `src/components/CardDeck.module.css`**

In `.card`, replace:

```css
  transition: border-color 0.15s, transform 0.15s, background 0.15s;
```

with:

```css
  transition: border-color var(--duration-normal) var(--ease-out),
              transform var(--duration-normal) var(--ease-out),
              background var(--duration-normal) var(--ease-out);
```

- [ ] **Step 5: Run test to verify all pass**

```bash
npm test -- CardDeck
```

Expected: all 3 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/CardDeck.jsx src/components/CardDeck.module.css src/components/CardDeck.test.jsx
git commit -m "feat: add aria-labels to card deck buttons, use transition tokens"
```

---

## Task 7: EmojiTray Aria-Labels and Back Button

**Files:**
- Modify: `src/components/EmojiTray.jsx`
- Modify: `src/components/EmojiTray.module.css`

> The back button (`✕`) appears inside the expanded emoji picker (top-right corner) so mobile users have a tappable target to collapse back to the compact row. It is positioned `absolute` within the expanded tray container.

- [ ] **Step 1: Update `src/components/EmojiTray.jsx`**

Make three changes:

**a) Add `aria-label` to quick emoji buttons** — in the `.map` over `QUICK_EMOJIS`:

```jsx
                {QUICK_EMOJIS.map(e => (
                  <button
                    key={e}
                    className={styles.emojiBtn}
                    onClick={() => handleThrow(e)}
                    aria-label={`Throw ${e}`}
                  >
                    {e}
                  </button>
                ))}
```

**b) Add `aria-label` to the `lastPickerEmoji` recent button**:

```jsx
                <button
                  className={`${styles.emojiBtn} ${styles.recentBtn}`}
                  onClick={() => handleThrow(lastPickerEmoji)}
                  title="Recently used"
                  aria-label={`Throw ${lastPickerEmoji}`}
                >
                  {lastPickerEmoji}
                </button>
```

**c) Add the back button inside the expanded grid** — replace the `{expanded && ...}` branch:

```jsx
          ) : (
            <div className={styles.expandedWrapper} data-testid="emoji-grid">
              <button
                className={styles.backBtn}
                onClick={() => setExpanded(false)}
                aria-label="Close emoji picker"
              >
                ✕
              </button>
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
```

The full updated `EmojiTray.jsx`:

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
                  <button
                    key={e}
                    className={styles.emojiBtn}
                    onClick={() => handleThrow(e)}
                    aria-label={`Throw ${e}`}
                  >
                    {e}
                  </button>
                ))}
                <button
                  className={`${styles.emojiBtn} ${styles.recentBtn}`}
                  onClick={() => handleThrow(lastPickerEmoji)}
                  title="Recently used"
                  aria-label={`Throw ${lastPickerEmoji}`}
                >
                  {lastPickerEmoji}
                </button>
                <button
                  className={styles.moreBtn}
                  onClick={() => setExpanded(true)}
                  title="All emojis"
                  data-testid="more-btn"
                  aria-label="Open emoji picker"
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
                      aria-label="Kick player"
                    >
                      👟 Kick
                    </button>
                    <button
                      className={styles.ownerBtn}
                      onClick={() => { onTransfer(); onClose() }}
                      data-testid="transfer-btn"
                      aria-label="Transfer ownership"
                    >
                      👑 Make owner
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className={styles.expandedWrapper} data-testid="emoji-grid">
              <button
                className={styles.backBtn}
                onClick={() => setExpanded(false)}
                aria-label="Close emoji picker"
              >
                ✕
              </button>
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

- [ ] **Step 2: Add `.expandedWrapper` and `.backBtn` to `src/components/EmojiTray.module.css`**

Append at the end of the file:

```css
/* expanded picker wrapper — needed for back button positioning */
.expandedWrapper {
  position: relative;
}

/* back button inside expanded picker */
.backBtn {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  z-index: 1;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface-float);
  border: 1px solid rgba(236, 223, 204, 0.2);
  border-radius: 50%;
  color: var(--text-muted);
  font-size: 0.65rem;
  line-height: 1;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.backBtn:hover {
  background: rgba(236, 223, 204, 0.14);
  color: var(--text);
}
```

- [ ] **Step 3: Run all tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/EmojiTray.jsx src/components/EmojiTray.module.css
git commit -m "feat: add aria-labels to emoji buttons, add back button to expanded picker"
```

---

## Task 8: Transition Token Cleanup

**Files:**
- Modify: `src/components/Table.module.css`
- Modify: `src/components/PlayerCard.module.css`
- Modify: `src/components/EmojiTray.module.css`

> Replace ad-hoc numeric transition values with `var(--duration-normal) var(--ease-out)` tokens. The card flip animation in `PlayerCard.module.css` is intentionally kept as `0.5s cubic-bezier(...)` — it's slower by design.

- [ ] **Step 1: Update `src/components/Table.module.css`**

The existing file has no explicit `transition` rules. Add transitions to the hover states:

In `.revealBtn`, add after existing rules:
```css
.revealBtn {
  background: var(--accent);
  color: var(--bg);
  transition: background var(--duration-normal) var(--ease-out);
}

.newRoundBtn {
  background: transparent;
  color: var(--text);
  border: 2px solid var(--text-muted) !important;
  transition: border-color var(--duration-normal) var(--ease-out);
}
```

Replace the existing `.revealBtn` and `.newRoundBtn` blocks entirely with:

```css
.revealBtn {
  background: var(--accent);
  color: var(--bg);
  transition: background var(--duration-normal) var(--ease-out);
}

.revealBtn:hover {
  background: var(--accent-hover);
}

.newRoundBtn {
  background: transparent;
  color: var(--text);
  border: 2px solid var(--text-muted) !important;
  transition: border-color var(--duration-normal) var(--ease-out);
}

.newRoundBtn:hover {
  border-color: var(--text) !important;
}
```

- [ ] **Step 2: Verify `src/components/PlayerCard.module.css` needs no changes**

Open the file. The only `transition` rule is `transition: transform 0.5s cubic-bezier(0.45, 0.05, 0.55, 0.95)` on `.cardInner` — this is intentionally slower than the token values (card flip UX) and must not be changed. No other transitions exist in this file.

- [ ] **Step 3: Update `src/components/EmojiTray.module.css`**

Replace the three occurrences of `transition: background 0.13s, border-color 0.13s, transform 0.13s;` and similar in `.emojiBtn`, `.moreBtn`, `.ownerBtn`:

In `.emojiBtn`:
```css
  transition: background var(--duration-fast) var(--ease-out),
              border-color var(--duration-fast) var(--ease-out),
              transform var(--duration-fast) var(--ease-out);
```

In `.emojiBtn:active`:
```css
  transition-duration: var(--duration-fast);
```

In `.moreBtn`:
```css
  transition: background var(--duration-fast) var(--ease-out),
              border-color var(--duration-fast) var(--ease-out),
              color var(--duration-fast) var(--ease-out),
              transform var(--duration-fast) var(--ease-out);
```

In `.moreBtn:active`:
```css
  transition-duration: var(--duration-fast);
```

In `.ownerBtn`:
```css
  transition: background var(--duration-fast) var(--ease-out),
              border-color var(--duration-fast) var(--ease-out),
              color var(--duration-fast) var(--ease-out);
```

- [ ] **Step 4: Run all tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/Table.module.css src/components/EmojiTray.module.css
git commit -m "style: replace ad-hoc transition values with duration tokens"
```

---

## Task 9: Fix `outline: none` on `input` for Keyboard Navigation

**Files:**
- Modify: `src/index.css`

> The global `input` rule currently sets `outline: none` unconditionally, which hides the `:focus-visible` ring we added in Task 1. The fix: use `outline: none` only on `:focus` (suppresses mouse ring) while letting `:focus-visible` show the ring for keyboard users.

- [ ] **Step 1: Update the `input` rule in `src/index.css`**

Find the current `input` block:

```css
input {
  font-family: inherit;
  border-radius: var(--radius);
  border: 1px solid var(--surface-alt);
  background: var(--surface);
  color: var(--text);
  padding: 0.6rem 1rem;
  font-size: 1rem;
  outline: none;
}
```

Remove `outline: none` from the rule body and add an explicit suppression only for mouse focus:

```css
input {
  font-family: inherit;
  border-radius: var(--radius);
  border: 1px solid var(--surface-alt);
  background: var(--surface);
  color: var(--text);
  padding: 0.6rem 1rem;
  font-size: 1rem;
}

input:focus:not(:focus-visible) {
  outline: none;
}
```

- [ ] **Step 2: Run all tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "fix: preserve focus-visible ring on input for keyboard navigation"
```

---

## Running the Full Test Suite

After all tasks are complete:

```bash
npm test
```

Expected: all tests pass with no failures.
