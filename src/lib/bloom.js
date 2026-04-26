/**
 * Bloom Filter — probabilistic set membership for efficient sync.
 *
 * Parameters:
 *   4096-bit array (512 bytes), 7 hash functions
 *   → ~1% false-positive rate at 200 messages
 *   → ~0.3% at 100 messages
 *
 * Uses the Kirsch-Mitzenmacher technique:
 *   g_i(x) = (h1(x) + i * h2(x)) mod m
 * giving K independent positions from just 2 base hashes.
 */

const BIT_SIZE  = 4096;  // total bits
const BYTE_SIZE = 512;   // BIT_SIZE / 8
const K         = 7;     // number of hash functions

// ── Base hash 1: FNV-1a 32-bit ───────────────────────────────────
function fnv32(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// ── Base hash 2: DJB2 ────────────────────────────────────────────
function djb2(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(h, 33) ^ str.charCodeAt(i)) >>> 0;
  }
  return h;
}

// ── K bit positions for a given item ────────────────────────────
function positions(item) {
  const h1 = fnv32(item);
  const h2 = djb2(item) | 1; // ensure h2 is odd to avoid cycles
  const pos = new Array(K);
  for (let i = 0; i < K; i++) {
    pos[i] = ((h1 + Math.imul(i, h2)) >>> 0) % BIT_SIZE;
  }
  return pos;
}

export class BloomFilter {
  constructor(bits) {
    this.bits = bits instanceof Uint8Array ? bits : new Uint8Array(BYTE_SIZE);
  }

  /** Add a message ID to the filter. Returns this for chaining. */
  add(id) {
    for (const pos of positions(String(id))) {
      this.bits[pos >>> 3] |= 1 << (pos & 7);
    }
    return this;
  }

  /** Test if a message ID is possibly in the set (false positives possible). */
  has(id) {
    for (const pos of positions(String(id))) {
      if ((this.bits[pos >>> 3] & (1 << (pos & 7))) === 0) return false;
    }
    return true;
  }

  /** Merge another filter into this one (union). */
  merge(other) {
    for (let i = 0; i < BYTE_SIZE; i++) {
      this.bits[i] |= other.bits[i];
    }
    return this;
  }

  /** Serialize to base64 for localStorage / QR transmission. */
  toBase64() {
    return btoa(String.fromCharCode(...this.bits));
  }

  /** Deserialize from base64. */
  static fromBase64(str) {
    try {
      const raw = atob(str);
      const bits = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) bits[i] = raw.charCodeAt(i);
      return new BloomFilter(bits);
    } catch {
      return BloomFilter.empty();
    }
  }

  /** Create an empty filter. */
  static empty() {
    return new BloomFilter(new Uint8Array(BYTE_SIZE));
  }

  /** Build a filter from an iterable of ID strings. */
  static fromIds(ids) {
    const f = BloomFilter.empty();
    for (const id of ids) f.add(id);
    return f;
  }
}
