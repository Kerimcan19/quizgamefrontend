import { io } from "socket.io-client";

export const socket = io("http://localhost:5000", {
  transports: ["websocket"],
  forceNew: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
});

export const socketConnected = () => {
  return new Promise<void>((resolve) => {
    if (socket.connected) {
      resolve();
    } else {
      socket.once("connect", () => resolve());
    }
  });
};