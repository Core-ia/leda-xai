// core/memory.js
const store = {};
export function getMemory(userId) { return store[userId] || []; }
export function addMemory(userId, entry) {
  if (!store[userId]) store[userId] = [];
  store[userId].push({ ...entry, ts: Date.now() });
  if (store[userId].length > 200) store[userId].shift();
}
export function clearMemory(userId) { delete store[userId]; }
