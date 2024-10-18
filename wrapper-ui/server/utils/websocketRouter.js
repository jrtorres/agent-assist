// routes/websocketRouter.js
const express = require("express");
const { configureWebSocket } = require("../websocket");

const websocketRouter = express.Router();

module.exports = (wss, handleWebSocketConnection) => {
  // WebSocket configuration
  wss.on("connection", handleWebSocketConnection);

  // Route for WebSocket client
  websocketRouter.get("/websocket-client", (req, res) => {
    res.sendFile(__dirname + "/web-socket.html");
  });

  return websocketRouter;
};
