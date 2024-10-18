import "./index.css";
// import React from "react";
import App from "./App.jsx";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AppContextProvider } from "./context/context.jsx";
import { ChakraProvider } from "@chakra-ui/react";
import { AgentIdProvider } from "./hooks/useAgentIdProvider.jsx";
import { IoProvider } from 'socket.io-react-hook'; // for socketio connectivity

ReactDOM.createRoot(document.getElementById("root")).render(
  // <React.StrictMode>
  <BrowserRouter>
    <ChakraProvider>
      <AppContextProvider>
        <AgentIdProvider >
          <IoProvider>
            <App />
          </IoProvider>
        </AgentIdProvider>
      </AppContextProvider>
    </ChakraProvider>
  </BrowserRouter>,
  // </React.StrictMode>
);
