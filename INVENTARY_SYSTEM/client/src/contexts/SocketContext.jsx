import React, { createContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export const SocketContext = createContext();

const socketInstance = io(window.location.origin, {
  transports: ['websocket', 'polling'],
});

export const SocketProvider = ({ children }) => {
  return (
    <SocketContext.Provider value={socketInstance}>
      {children}
    </SocketContext.Provider>
  );
};
