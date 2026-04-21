# Room Owner & Kick Feature — Design Spec

**Date:** 2026-04-21  
**Status:** Approved

---

## Overview

Add a room owner concept to Planning Poker. The owner gets two extra powers over other players: kick a player (soft — they can rejoin) and transfer ownership. A crown badge on the owner's card makes ownership visible to all.

---

## Data & Firebase

### Schema change

The Firebase room node gains one field:

```
rooms/{roomId}/
  createdAt:  number
  ownerId:    string   ← new
  revealed:   boolean
  votes:      { [userId]: { name, card } }
  throws:     { [throwId]: { fromId, toId, emoji, timestamp } }
```

### How ownership is established

`HomePage.handleCreate()` already sets the initial room object. It will include `ownerId: userId` in that initial write. `joinRoom` in `firebase.js` skips the `set` call for existing rooms, so late joiners never overwrite `ownerId`.

### New Firebase functions

```js
kickPlayer(roomId, userId)
// remove(ref(db, `rooms/${roomId}/votes/${userId}`))

transferOwnership(roomId, newUserId)
// set(ref(db, `rooms/${roomId}/ownerId`), newUserId)
```

---

## UI & Components

### PlayerCard — crown badge

- New `isOwner` boolean prop.
- When true, renders a `👑` badge overlay (top-center of the card, similar to the existing `myBadge` pattern).
- Visible to all players, not just the owner.

### EmojiTray — owner actions

- New props: `isOwnerViewing: boolean`, `onKick: () => void`, `onTransfer: () => void`.
- When `isOwnerViewing` is true, a divider and two buttons appear below the emoji grid:

```
┌─────────────────────────────┐
│  😂  ❤️  👍  💀  🔥  ✨     │  ← existing emoji grid
├─────────────────────────────┤  ← divider
│  👟 Kick    👑 Make owner   │  ← owner-only row
└─────────────────────────────┘
```

- Clicking either action fires the callback and closes the tray (same close behavior as emoji throw).

### RoomPage — wiring

- Derive `isOwner = session.userId === roomData.ownerId`.
- Pass `isOwner` as `isOwner` prop to the owner's `PlayerCard` (and `false` to all others).
- Pass `isOwnerViewing={isOwner}`, `onKick` and `onTransfer` to `EmojiTray`.
- `onKick`: calls `kickPlayer(roomId, tray.playerId)`, closes tray.
- `onTransfer`: calls `transferOwnership(roomId, tray.playerId)`, closes tray.
- Add a `useEffect` that watches `roomData.votes`: if `session.userId` is no longer a key in `votes`, redirect to `/?kicked=1`.

### HomePage — kicked message

- Read `?kicked=1` query param on mount and display a brief dismissible message: _"You were removed from the room."_

---

## Auto-transfer on owner departure

Detected client-side: when `ownerId` is not present as a key in `votes` (owner left or was somehow removed).

**Rule:** the remaining player whose `userId` is lexicographically first calls `transferOwnership(roomId, theirUserId)`. All clients agree on the same winner, so concurrent writes resolve to the same value — no conflict.

If the room is empty after the owner leaves, no transfer occurs. The next person to create or join an expired room becomes the new owner.

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| Owner tries to kick themselves | Not possible — `EmojiTray` only opens for other players (`isMe` guard already exists) |
| Owner kicks then rejoins | Rejoining calls `joinRoom`, re-adds them to `votes` as a normal player |
| Kicked player rejoin | Same as above — soft kick, no block |
| Transfer mid-round | New owner immediately has powers; old owner loses them |
| Owner closes tab | Auto-transfer triggers on remaining clients via `votes` watch |
| Room empty when owner leaves | No transfer; next creator gets `ownerId` |
| Two clients race on auto-transfer | Both write same value (lex-first userId) — idempotent |

---

## Out of Scope

- Persistent block / ban list
- Multiple owners / moderators
- Server-side enforcement (Firebase Security Rules update not included)
