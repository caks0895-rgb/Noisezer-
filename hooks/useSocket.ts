import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  if (!socket) {
    socket = io();
  }

  useEffect(() => {
    socketRef.current = socket;
  }, []);

  return socketRef.current || socket;
}
