/**
 * Content-addressed message ID using SHA-256.
 * Same type + content → same ID, enabling natural cross-peer deduplication.
 * Falls back to a djb2-based ID on non-HTTPS LAN (where crypto.subtle is unavailable).
 */
export async function generateMessageId(content, type) {
  const input = `${type}||${content.trim()}`;

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const buffer = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(input)
    );
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Fallback: djb2 + timestamp (LAN HTTP without HTTPS)
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h + input.charCodeAt(i)) & 0x7fffffff;
  }
  return `local-${Date.now().toString(36)}-${h.toString(36)}`;
}
