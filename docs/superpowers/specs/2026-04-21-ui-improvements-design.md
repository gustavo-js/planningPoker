# UI Improvements — Design Spec

**Date:** 2026-04-21
**Stack:** React + Vite + CSS Modules

---

## Overview

Three layered improvements to the planning poker UI: a full design token system, a responsive mobile layout, and accessibility/polish pass. Each layer builds on the previous.

---

## Section 1: Design Token System

All new tokens are added to `src/index.css` as CSS custom properties on `:root`.

### Spacing scale

```css
--space-1: 0.25rem;
--space-2: 0.5rem;
--space-3: 0.75rem;
--space-4: 1rem;
--space-5: 1.25rem;
--space-6: 1.5rem;
--space-8: 2rem;
--space-10: 2.5rem;
--space-12: 3rem;
```

### Shadow scale

```css
--shadow-sm: 0 1px 3px rgba(0,0,0,0.3);
--shadow-md: 0 4px 12px rgba(0,0,0,0.4);
--shadow-lg: 0 8px 24px rgba(0,0,0,0.5);
--shadow-xl: 0 16px 40px rgba(0,0,0,0.6);
```

### Transition scale

```css
--duration-fast: 0.1s;
--duration-normal: 0.2s;
--ease-out: cubic-bezier(0.4, 0, 0.2, 1);
```

### Semantic colors

```css
--color-error: #f87171;
--color-error-bg: rgba(248, 113, 113, 0.12);
--color-error-border: rgba(248, 113, 113, 0.35);
--color-overlay: rgba(0, 0, 0, 0.6);
--color-surface-float: rgba(255, 255, 255, 0.06);
```

### Z-index scale

```css
--z-results: 50;
--z-sparkles: 100;
--z-overlay: 200;
--z-tray: 300;
--z-throws: 400;
```

**Usage:** Consume these tokens throughout new and existing CSS Modules. Existing hardcoded values are replaced in subsequent tasks. No component logic changes in this section.

---

## Section 2: Responsive Layout

### RoomPage mobile reflow (≤768px)

At or below 768px viewport width, the four-sided player grid (top/left/right/bottom rows) collapses into a single **horizontal scrollable row** at the top of the page. The table stays centered below it, and the card deck stays fixed at the bottom.

Implementation in `src/pages/RoomPage.module.css`:

```css
@media (max-width: 768px) {
  .topRow,
  .bottomRow {
    display: none;
  }

  .middleRow {
    flex-direction: column;
  }

  .sideCol {
    /* hidden side columns repurposed as mobile player rail */
  }
}
```

The actual approach: add a new `.playerRail` element in `RoomPage.jsx` that renders all players in one `overflow-x: auto` scrollable row, visible only on mobile. The existing top/left/right/bottom rows are hidden on mobile via the media query. No changes to the desktop layout.

Player cards in the rail are 48px wide (same as desktop) with `flex-shrink: 0` and `gap: var(--space-3)` between them.

### ResultsBar positioning fix

`src/components/ResultsBar.module.css`: replace the hardcoded `bottom: 8.5rem` with:

```css
bottom: calc(var(--footer-height, 8.5rem) + var(--space-2));
```

`--footer-height: 8rem` is set on `:root` in `index.css`. The calc result (`8rem + 0.5rem = 8.5rem`) matches the current hardcoded value exactly, so there is no visual change at launch — but the bar will track the footer correctly if the deck height ever changes.

### Small-screen card/modal padding

`src/pages/HomePage.module.css` and any modal wrappers: add a media query at ≤400px:

```css
@media (max-width: 400px) {
  .card {
    padding: var(--space-4);
    margin: 0 var(--space-2);
  }
}
```

This prevents the homepage card from bleeding off the edge on very small phones.

---

## Section 3: Accessibility & Polish

### Focus states

Add a consistent `:focus-visible` ring to all interactive elements. New global rule in `src/index.css`:

```css
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

Any component that previously suppressed `outline` via `outline: none` is updated to use `outline: none` only on `:focus` (mouse), preserving the ring for keyboard navigation (`:focus-visible`).

### Aria-labels audit

- **CardDeck buttons**: each card button gets `aria-label={`Select ${value}`}` (e.g. "Select 5", "Select ?")
- **EmojiTray emoji buttons**: each gets `aria-label={`Throw ${emoji}`}`
- **ResultsBar**: wrapping element gets `role="status"` and `aria-live="polite"`
- **EmojiTray kick/transfer buttons**: already have `aria-label` from the owner feature — verify they remain present

### Skeleton loader

Replace the `<div className={styles.loading}>Connecting…</div>` in `RoomPage.jsx` with a skeleton screen component `src/components/RoomSkeleton.jsx`.

The skeleton renders:
- 3 placeholder cards in a row (top position), using a `@keyframes pulse` animation (opacity 0.4 → 0.8 → 0.4, 1.5s infinite)
- A rectangular table placeholder in the center
- 3 placeholder cards in the bottom row

All placeholders use `background: var(--surface-alt)` with the pulse animation. No layout shift when real content loads because the skeleton mirrors the desktop grid structure.

### Transition consistency

Replace ad-hoc `transition` values across CSS Modules with token-based values:

- `transition: all var(--duration-normal) var(--ease-out)` for hover/color transitions
- `transition: transform var(--duration-normal) var(--ease-out)` for movement
- Card flip in `PlayerCard.module.css` keeps its existing `0.5s cubic-bezier(...)` — intentionally slower, not replaced

Files to audit: `EmojiTray.module.css`, `Table.module.css`, `CardDeck.module.css`, `PlayerCard.module.css`, `HomePage.module.css`.

### EmojiTray back button (expanded state)

When the emoji picker is in its expanded grid state, add a small `✕` button in the top-right corner of the pill. This gives mobile users a tappable target to collapse back to the compact row without having to tap outside.

In `EmojiTray.jsx`:

```jsx
{expanded && (
  <button
    className={styles.backBtn}
    onClick={() => setExpanded(false)}
    aria-label="Close emoji picker"
  >
    ✕
  </button>
)}
```

`styles.backBtn` in `EmojiTray.module.css`: positioned `absolute; top: var(--space-2); right: var(--space-2)`, small (20×20px), circular, using `--color-surface-float` background with `--text-muted` color.

---

## Files Changed

| File | Change |
|------|--------|
| `src/index.css` | Add all new tokens (spacing, shadow, transition, semantic colors, z-index, `--footer-height`); add global `:focus-visible` rule |
| `src/pages/RoomPage.jsx` | Add `.playerRail` element for mobile; use `RoomSkeleton` instead of plain loading text |
| `src/pages/RoomPage.module.css` | Mobile media query, hide desktop rows, show rail |
| `src/components/ResultsBar.module.css` | Fix `bottom` with token |
| `src/pages/HomePage.module.css` | Small-screen card padding |
| `src/components/CardDeck.jsx` | Add `aria-label` to card buttons |
| `src/components/EmojiTray.jsx` | Add `aria-label` to emoji buttons, add back button |
| `src/components/EmojiTray.module.css` | `.backBtn` style |
| `src/components/ResultsBar.jsx` | Add `role="status"` + `aria-live` |
| `src/components/RoomSkeleton.jsx` | New skeleton component |
| `src/components/RoomSkeleton.module.css` | Skeleton + pulse animation styles |
| Multiple `*.module.css` files | Replace ad-hoc transitions with token values |

---

## Out of Scope

- Dark/light theme toggle (theme is already dark-only)
- Animation overhaul beyond transition token cleanup
- Any Firebase or game logic changes
- Test coverage for pure CSS changes (visual regression is manual)
