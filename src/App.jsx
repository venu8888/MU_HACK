import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import AppLayout    from './components/layout/AppLayout';
import Dashboard    from './pages/Dashboard';
import CreateAlert  from './pages/CreateAlert';
import NearbySync   from './pages/NearbySync';
import QRExchange   from './pages/QRExchange';
import DropView     from './pages/DropView';
import Privacy      from './pages/Privacy';
import Settings     from './pages/Settings';
import { useAppStore } from './store/useAppStore';

export default function App() {
  const { cleanExpired, syncMessages, forceBroadcast, sessionId, connectToBridge } = useAppStore();

  useEffect(() => {
    connectToBridge();
  }, [connectToBridge]);

  // ── Cross-tab sync via localStorage storage event ──────────────
  useEffect(() => {
    const handleStorage = async (e) => {
      if (e.key !== 'pulsemesh_sync_channel' || !e.newValue) return;
      try {
        const payload = JSON.parse(e.newValue);
        // Ignore our own broadcasts (prevent echo loop)
        if (payload.origin === sessionId) return;
        if (Array.isArray(payload.messages) && payload.messages.length > 0) {
          await syncMessages(payload.messages, 'relayed');
        }
      } catch (err) {
        console.error('[PulseMesh] Sync parse error:', err);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [syncMessages, sessionId]);

  // ── Periodic cleanup + heartbeat broadcast ─────────────────────
  useEffect(() => {
    // Expire old messages every 10 seconds
    const cleanupInterval = setInterval(() => cleanExpired(), 10_000);

    // Broadcast heartbeat every 5 seconds so newly opened tabs sync quickly
    const syncInterval = setInterval(() => forceBroadcast(), 5_000);

    // Kick off an immediate broadcast on mount
    forceBroadcast();

    return () => {
      clearInterval(cleanupInterval);
      clearInterval(syncInterval);
    };
  }, [cleanExpired, forceBroadcast]);

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/"       element={<Dashboard />} />
        <Route path="/create" element={<CreateAlert />} />
        <Route path="/sync"   element={<NearbySync />} />
        <Route path="/qr"     element={<QRExchange />} />
        <Route path="/drop"   element={<DropView />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
