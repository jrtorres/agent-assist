

import {v4 as uuid} from "uuid";
import {useSocket as useSocketParent, useSocketEvent as useSocketEventParent} from "socket.io-react-hook";
import {createContext, useContext} from "react";

const queryParams = new URLSearchParams(window.location.search);
const agentId: any = queryParams.get('agent_id') || uuid();

const SocketContext = createContext({
  socket: undefined,
  setSocket: (socket: any) => {
  }
});

export const useSocket = () => {
  let {socket, setSocket} = useContext(SocketContext);

  if (socket === undefined) {
    const {socket} = useSocketParent();
    socket.on('connect', () => {
      console.log(agentId);
      socket.emit("joinRoom", agentId)
    });
    setSocket(socket);
  }

  return useSocketParent(socket);
};

export const useSocketEvent = (eventName: string) => {
  const {socket} = useSocket();
  return useSocketEventParent(socket, eventName);
}

export type SocketParameters = {
  title: string;
  value: string;
  text: string;
  action_id: number;
  session_id: string;
};

export type SocketPayload = {
  type: string;
  parameters: SocketParameters;
};