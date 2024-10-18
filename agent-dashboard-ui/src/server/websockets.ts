

import {Express} from "express";
import {createProxyMiddleware} from "http-proxy-middleware";

// AAN_SOCKETIO_SERVER has protocol and port inside
const ANN_SOCKETIO_SERVER = process.env.ANN_SOCKETIO_SERVER ? process.env.ANN_SOCKETIO_SERVER : "localhost";

export default function setupWebsockets(app: Express) {
  app.use(
    createProxyMiddleware({
      pathFilter: "/socket.io",
      target: `${ANN_SOCKETIO_SERVER}`,
      changeOrigin: true,
      ws: true
    })
  );
}
