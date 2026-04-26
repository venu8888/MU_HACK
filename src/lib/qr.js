// QR Compression and Multipart Engine

const MAX_CHUNK_SIZE = 500; // Keep it safe for QR density
const QR_PREFIX = 'PMX|';

// Map verbose keys to short keys to save space
const KEY_MAP = {
  id: 'i',
  type: 't',
  content: 'c',
  timestamp: 'ts',
  ttl: 'tl',
  hop_count: 'h'
};

const REVERSE_KEY_MAP = Object.fromEntries(
  Object.entries(KEY_MAP).map(([k, v]) => [v, k])
);

/**
 * Compress an array of messages into a tiny JSON string
 */
export function compressPackets(messages) {
  const compressed = messages.map(m => {
    const obj = {};
    for (const [key, val] of Object.entries(m)) {
      if (KEY_MAP[key] && val !== undefined && val !== null) {
        obj[KEY_MAP[key]] = val;
      }
    }
    return obj;
  });

  const bundle = {
    v: 3, // version 3 MVP format
    ts: Date.now(),
    p: compressed
  };

  return JSON.stringify(bundle);
}

/**
 * Decompress a tiny JSON string back into full messages
 */
export function decompressPackets(payloadStr) {
  try {
    const bundle = JSON.parse(payloadStr);
    if (!bundle.p || !Array.isArray(bundle.p)) throw new Error('Invalid bundle format');

    const messages = bundle.p.map(cm => {
      const obj = {};
      for (const [key, val] of Object.entries(cm)) {
        if (REVERSE_KEY_MAP[key]) {
          obj[REVERSE_KEY_MAP[key]] = val;
        }
      }
      // Set source as QR imported
      obj.source = 'qr';
      // Safety defaults if missing
      if (obj.hop_count === undefined) obj.hop_count = 1;
      return obj;
    });

    return messages;
  } catch (error) {
    throw new Error('Failed to parse QR bundle data');
  }
}

/**
 * Split a large payload string into numbered chunks
 * Format: PMX|1/3|payload...
 */
export function splitPayload(payload) {
  if (payload.length <= MAX_CHUNK_SIZE) {
    return [`${QR_PREFIX}1/1|${payload}`];
  }

  const chunks = [];
  const totalChunks = Math.ceil(payload.length / MAX_CHUNK_SIZE);
  
  for (let i = 0; i < totalChunks; i++) {
    const start = i * MAX_CHUNK_SIZE;
    const chunkData = payload.slice(start, start + MAX_CHUNK_SIZE);
    chunks.push(`${QR_PREFIX}${i + 1}/${totalChunks}|${chunkData}`);
  }
  
  return chunks;
}

/**
 * Parses a single scanned QR string.
 * Returns { isPulseMesh, current, total, data, isComplete }
 */
export function parseScannedChunk(scannedText, existingChunks = []) {
  if (!scannedText.startsWith(QR_PREFIX)) {
    return { isPulseMesh: false, error: 'Not a PulseMesh QR code' };
  }

  // Parse header: PMX|1/3|data
  const parts = scannedText.split('|');
  if (parts.length < 3) {
    return { isPulseMesh: true, error: 'Malformed PulseMesh QR' };
  }

  const fraction = parts[1]; // e.g. "1/3"
  const payloadData = parts.slice(2).join('|'); // The rest of the string
  
  const [currentStr, totalStr] = fraction.split('/');
  const current = parseInt(currentStr, 10);
  const total = parseInt(totalStr, 10);

  if (isNaN(current) || isNaN(total) || current < 1 || current > total) {
    return { isPulseMesh: true, error: 'Invalid chunk indexing' };
  }

  // Add to existing chunks buffer
  const newChunks = [...existingChunks];
  // Ensure array is large enough
  while (newChunks.length < total) newChunks.push(null);
  
  // Store the data at the correct index (0-indexed)
  newChunks[current - 1] = payloadData;

  // Check if complete
  const isComplete = newChunks.filter(c => c !== null).length === total;
  
  let fullPayload = null;
  if (isComplete) {
    fullPayload = newChunks.join('');
  }

  return {
    isPulseMesh: true,
    current,
    total,
    chunks: newChunks,
    isComplete,
    fullPayload
  };
}
