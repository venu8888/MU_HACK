import Dexie from 'dexie';

/**
 * PulseMesh IndexedDB schema via Dexie.
 *
 * messages store:
 *   &id          — unique SHA-256 hash (primary key, enforces dedup at DB level)
 *   type         — indexed for filtering by message type
 *   timestamp    — indexed for time-sorting
 *   expiry       — indexed for efficient TTL cleanup queries
 */
export const db = new Dexie('PulseMeshDB');

db.version(1).stores({
  messages: '&id, type, timestamp, expiry',
});

// ── Constants ────────────────────────────────────────────────────
const MAX_MESSAGES = 200;
export const PRIORITY = { alert: 4, safe_route: 3, medical: 2, news: 1 };

// ── Write ─────────────────────────────────────────────────────────

/**
 * Insert or update a message. The & on id means Dexie will throw
 * a ConstraintError on exact-duplicate IDs — we catch that to
 * treat it as a seen_count increment instead.
 * Returns 'new' | 'updated' | 'duplicate'.
 */
export async function upsertMessage(message) {
  const existing = await db.messages.get(message.id);

  if (!existing) {
    // Brand new message — store with computed expiry index
    await db.messages.put({
      ...message,
      expiry: message.timestamp + message.ttl,
    });
    await enforceLimit();
    return 'new';
  }

  // Already known — bump seen_count; update content if incoming is newer
  const update = { seen_count: (existing.seen_count || 1) + 1 };
  if (message.timestamp > existing.timestamp) {
    update.content   = message.content;
    update.timestamp = message.timestamp;
    update.ttl       = message.ttl;
    update.expiry    = message.timestamp + message.ttl;
  }
  await db.messages.update(message.id, update);
  return existing.timestamp !== message.timestamp ? 'updated' : 'duplicate';
}

/**
 * Bulk upsert for QR / sync imports.
 * Returns { imported, duplicates, updated }.
 */
export async function bulkUpsert(messages) {
  let imported = 0, duplicates = 0, updated = 0;
  for (const m of messages) {
    const result = await upsertMessage(m);
    if (result === 'new')       imported++;
    else if (result === 'updated') updated++;
    else                          duplicates++;
  }
  return { imported, duplicates, updated };
}

// ── Read ──────────────────────────────────────────────────────────

/** All non-expired messages, priority-sorted. */
export async function getActiveMessages() {
  const now = Date.now();
  const all = await db.messages
    .where('expiry').above(now)
    .toArray();

  return all.sort((a, b) => {
    const pa = PRIORITY[a.type] || 0;
    const pb = PRIORITY[b.type] || 0;
    if (pa !== pb) return pb - pa;
    return b.timestamp - a.timestamp;
  });
}

/** All message IDs (for building bloom filter on startup). */
export async function getAllIds() {
  return db.messages.toCollection().primaryKeys();
}

/** Count of all stored messages. */
export async function getCount() {
  return db.messages.count();
}

// ── Delete ────────────────────────────────────────────────────────

/** Remove all messages past their expiry. Returns count deleted. */
export async function deleteExpired() {
  const now = Date.now();
  return db.messages.where('expiry').belowOrEqual(now).delete();
}

/**
 * Trim to MAX_MESSAGES by evicting lowest-priority, oldest messages.
 * Called automatically after every insert.
 */
export async function enforceLimit() {
  const count = await db.messages.count();
  if (count <= MAX_MESSAGES) return;

  const all = await db.messages.toArray();
  // Sort ascending: lowest priority and oldest first = candidates to evict
  all.sort((a, b) => {
    const pa = PRIORITY[a.type] || 0;
    const pb = PRIORITY[b.type] || 0;
    if (pa !== pb) return pa - pb;
    return a.timestamp - b.timestamp;
  });

  const evict = all.slice(0, count - MAX_MESSAGES).map(m => m.id);
  await db.messages.bulkDelete(evict);
}

/** Wipe the entire messages store. */
export async function clearMessages() {
  return db.messages.clear();
}
