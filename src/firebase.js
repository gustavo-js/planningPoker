import { initializeApp } from 'firebase/app'
import { getDatabase, ref, set, get, update, onValue, remove, push, onChildAdded } from 'firebase/database'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getDatabase(app)

const ROOM_TTL_MS = 24 * 60 * 60 * 1000

export async function joinRoom(roomId, userId, name) {
  const roomRef = ref(db, `rooms/${roomId}`)
  const snap = await get(roomRef)
  const data = snap.val()
  const isExpired = data?.createdAt && Date.now() - data.createdAt > ROOM_TTL_MS
  if (!snap.exists() || isExpired) {
    if (isExpired) await remove(roomRef)
    await set(roomRef, { createdAt: Date.now(), ownerId: userId, revealed: false, votes: {} })
  }
  await set(ref(db, `rooms/${roomId}/votes/${userId}`), { name, card: null })
}

export async function setVote(roomId, userId, card) {
  await set(ref(db, `rooms/${roomId}/votes/${userId}/card`), card)
}

export async function setRevealed(roomId, revealed) {
  await set(ref(db, `rooms/${roomId}/revealed`), revealed)
}

export async function newRound(roomId, votes) {
  const updates = { [`rooms/${roomId}/revealed`]: false }
  Object.keys(votes).forEach(userId => {
    updates[`rooms/${roomId}/votes/${userId}/card`] = null
  })
  await update(ref(db), updates)
}

export function subscribeToRoom(roomId, callback) {
  const roomRef = ref(db, `rooms/${roomId}`)
  return onValue(roomRef, snapshot => callback(snapshot.val()))
}

export async function throwEmoji(roomId, fromId, toId, emoji) {
  await push(ref(db, `rooms/${roomId}/throws`), { fromId, toId, emoji, timestamp: Date.now() })
}

export function subscribeToThrows(roomId, callback) {
  return onChildAdded(ref(db, `rooms/${roomId}/throws`), snapshot => {
    const data = snapshot.val()
    if (!data || Date.now() - data.timestamp >= 10000) return
    callback({ id: snapshot.key, ...data })
  })
}

export async function removeThrow(roomId, throwId) {
  await remove(ref(db, `rooms/${roomId}/throws/${throwId}`))
}

export async function kickPlayer(roomId, userId) {
  await remove(ref(db, `rooms/${roomId}/votes/${userId}`))
}

export async function transferOwnership(roomId, newUserId) {
  await set(ref(db, `rooms/${roomId}/ownerId`), newUserId)
}
