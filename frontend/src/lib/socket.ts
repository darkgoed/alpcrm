import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('crm_token') : '';
    // Namespace /ws é passado diretamente na URL
    socket = io(`${process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3000'}/ws`, {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket'],
      autoConnect: false,
    });
  }
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
