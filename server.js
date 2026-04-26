import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import networkInterfaces from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" }
});

// Serve the production build
app.use(express.static(join(__dirname, 'dist')));

// SPA Catch-all: Redirect all non-file requests to index.html
app.use((req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

// --- Peer Discovery & Signaling ---
const peers = new Map(); // id -> socketId

io.on('connection', (socket) => {
  console.log(`[Mesh Server] Device connected: ${socket.id}`);

  socket.on('join', (peerId) => {
    socket.peerId = peerId;
    peers.set(peerId, socket.id);
    
    // Detect the real IP of the connecting device
    const realIp = socket.handshake.address.replace('::ffff:', '');
    const bridgeIp = getLocalIP();
    
    socket.emit('assigned_ip', realIp);
    socket.emit('bridge_ip', bridgeIp);
    
    console.log(`[Mesh Server] Peer joined: ${peerId} (Client IP: ${realIp}, Bridge IP: ${bridgeIp})`);
    
    // Notify everyone about the new peer
    io.emit('peers_update', Array.from(peers.keys()));
  });

  socket.on('signal', ({ to, from, signal }) => {
    const targetSocketId = peers.get(to);
    if (targetSocketId) {
      console.log(`[Mesh Server] Signaling: ${from} -> ${to}`);
      io.to(targetSocketId).emit('signal', { from, signal });
    }
  });

  socket.on('disconnect', () => {
    if (socket.peerId) {
      peers.delete(socket.peerId);
      io.emit('peers_update', Array.from(peers.keys()));
      console.log(`[Mesh Server] Peer left: ${socket.peerId}`);
    }
  });
});

// --- Find Local IP ---
function getLocalIP() {
  const nets = networkInterfaces.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return 'localhost';
}

const PORT = 3000;
httpServer.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIP();
  console.log(`\n🚀 PulseMesh Bridge Server is live!`);
  console.log(`------------------------------------------`);
  console.log(`Local:   http://localhost:${PORT}`);
  console.log(`Network: http://${ip}:${PORT}`);
  console.log(`------------------------------------------\n`);
  console.log(`Open the Network link on your phone to start automatic syncing.\n`);
});
