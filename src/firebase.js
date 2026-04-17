import { initializeApp } from 'firebase/app'
import { getDatabase, ref, set, get, update, onValue } from 'firebase/database'

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

export async function joinRoom(roomId, userId, name) {
  const roomRef = ref(db, `rooms/${roomId}`)
  const snap = await get(roomRef)
  if (!snap.exists()) {
    await set(roomRef, { revealed: false, votes: {} })
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
