import { useState, useEffect } from 'react';
import { liveQuery } from 'dexie';
import { db, PRIORITY } from '../lib/db';

/**
 * Reactive hook — returns all non-expired messages sorted by priority then time.
 * Uses standard React hooks + Dexie liveQuery to avoid React 19 library conflicts.
 */
export function useMessages() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const observable = liveQuery(async () => {
      const now = Date.now();
      const all = await db.messages.where('expiry').above(now).toArray();
      return all.sort((a, b) => {
        const pa = PRIORITY[a.type] || 0;
        const pb = PRIORITY[b.type] || 0;
        if (pa !== pb) return pb - pa;
        return b.timestamp - a.timestamp;
      });
    });

    const subscription = observable.subscribe({
      next: (result) => setMessages(result),
      error: (error) => console.error('[useMessages] Error:', error)
    });

    return () => subscription.unsubscribe();
  }, []);

  return messages;
}

/** Reactive count of all stored messages. */
export function useMessageCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const observable = liveQuery(() => db.messages.count());
    
    const subscription = observable.subscribe({
      next: (result) => setCount(result),
      error: (error) => console.error('[useMessageCount] Error:', error)
    });

    return () => subscription.unsubscribe();
  }, []);

  return count;
}
