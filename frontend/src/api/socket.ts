import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function connectSocket(token: string): Socket {
    if (socket) {
        return socket;  // already exists (connected or connecting), reuse
    }

    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
        auth: { token },
        autoConnect: true,
    });

    newSocket.on('connect', () => {
        console.log('[socket] connected:', newSocket.id);
    });
    newSocket.on('connect_error', (err) => {
        console.error('[socket] connect error:', err.message);
    });
    newSocket.on('disconnect', (reason) => {
        console.log('[socket] disconnected:', reason);
    });

    socket = newSocket;
    return socket;
}

export function disconnectSocket(): void {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}

export function getSocket(): Socket | null {
    return socket;
}