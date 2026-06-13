import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

let socket: Socket | null = null;

/**
 * Get or create the Socket.io connection.
 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

/**
 * Connect to the socket and join a restaurant channel.
 */
export function connectToRestaurant(restaurantId: number): Socket {
  const s = getSocket();

  if (!s.connected) {
    s.connect();
  }

  s.emit('join:restaurant', restaurantId);
  console.log(`🔌 Joining restaurant:${restaurantId}`);

  return s;
}

/**
 * Disconnect the socket.
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
