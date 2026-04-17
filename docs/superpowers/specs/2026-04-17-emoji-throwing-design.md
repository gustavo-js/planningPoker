# Emoji Throwing Feature — Design Spec

**Date:** 2026-04-17  
**Status:** Approved

## Overview

Players can click on another player's card to "throw" an emoji at them. The emoji animates in a parabolic arc across the screen, lands on the target, then falls and fades out. The throw is synced via Firebase so all players in the room see it.

## Data Model

New Firebase node: `rooms/{roomId}/throws/{throwId}`

```json
{
  "fromId": "user-abc",
  "toId": "user-xyz",
  "emoji": "🍅",
  "timestamp": 1713300000000
}
```

- Events are ephemeral: the first client to finish the animation calls `remove()` on the throw ref after ~3s
- Throws older than 10s are ignored on receipt (prevents late-joining clients from replaying stale animations)

### New Firebase functions (`firebase.js`)

- `throwEmoji(roomId, fromId, toId, emoji)` — pushes a new throw entry using `push()`
- `subscribeToThrows(roomId, callback)` — `onChildAdded` listener on the throws node; returns unsubscribe fn

## UI Interaction

- Clicking any **other** player's `PlayerCard` opens an emoji tray anchored near that card
- Clicking the same player again, or clicking outside, closes the tray without throwing
- The tray is rendered in a React portal at document root (avoids overflow clipping from layout containers)

### Emoji tray contents

4 quick-pick emojis: 🍅 💩 👏 🔥

Plus a `+` button that opens the browser native emoji picker via `inputElement.showPicker()` (no library — supported in Chrome/Edge/Safari 16+).

Selecting any emoji fires the throw immediately and closes the tray.

## Animation

A full-screen fixed overlay (`EmojiThrowOverlay`) lives in `RoomPage`, pointer-events none, highest z-index. It subscribes to `subscribeToThrows` and maintains a list of in-flight emoji objects.

### Positioning

Source and target positions are computed via `getBoundingClientRect()` on each `PlayerCard`'s DOM node at the moment the throw event is received. Since all clients share the same deterministic layout, positions are consistent across browsers.

`PlayerCard` exposes a `ref` so `RoomPage` can build a `Map<userId, DOMRect>` for lookup.

### Two-phase CSS keyframe animation

**Phase 1 — Arc flight (~600ms):**  
Two nested divs, each animated independently:
- Outer div: translates on the X axis with `linear` easing
- Inner div: translates on the Y axis with `ease-in` easing (simulates gravity drop)
- Combined effect produces a natural parabolic arc

**Phase 2 — Landing & fall (~400ms):**  
After arrival at target, the emoji drops ~30px downward while `opacity` fades to 0 via `ease-out`.

Total duration: ~1s. The throw ref is removed from Firebase at ~3s (well after animation ends).

Each in-flight emoji is a self-contained component that removes itself from the overlay list via a callback when its `animationend` event fires.

## New Files

- `src/components/EmojiThrowOverlay.jsx` — overlay + in-flight emoji management
- `src/components/EmojiThrowOverlay.module.css` — keyframe animations
- `src/components/EmojiTray.jsx` — quick-pick tray + native picker trigger
- `src/components/EmojiTray.module.css` — tray styles

## Modified Files

- `src/firebase.js` — add `throwEmoji`, `subscribeToThrows`
- `src/pages/RoomPage.jsx` — mount overlay, pass click handlers and refs to `PlayerCard`
- `src/components/PlayerCard.jsx` — accept `onClick` prop and forward `ref`
