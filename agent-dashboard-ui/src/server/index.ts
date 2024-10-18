
import { readFile } from "fs";
import path from "path";
import express, {Express, Router} from "express";
import helmet from "helmet";
import {createServer} from "http";
import setupWebsockets from "@server/websockets";
import setupTelemetry from "@server/telemetry";
import setupEnvironment from "@server/routes/environment";
import setupAuth from "@server/auth";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const ENABLE_AUTH = process.env.ENABLE_AUTH === "true";
const ANN_WRAPPER_DASHBOARD = process.env.ANN_WRAPPER_DASHBOARD || 'http://localhost:3003'
setupTelemetry();

const app: Express = express();
const router = Router();
const server = createServer(app);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      "img-src": ["'self'", "https: data:"],
      "default-src": ["'self'"],
      "connect-src": ["'self'", "http://localhost:5173", "http://localhost", "https://*.watson.appdomain.cloud", `${ANN_WRAPPER_DASHBOARD}`],
      "frame-ancestors": ["'self'", "http://localhost:5173", "http://localhost", "https://*.watson.appdomain.cloud", `${ANN_WRAPPER_DASHBOARD}`],
      "script-src": ["'self'", "'unsafe-eval'", "'unsafe-inline'", "http://localhost:5173", "http://localhost", "https://*.watson.appdomain.cloud", `${ANN_WRAPPER_DASHBOARD}`],
      "style-src": ["'self'", "'unsafe-eval'", "'unsafe-inline'", "http://localhost:5173", "http://localhost", "https://*.watson.appdomain.cloud", `${ANN_WRAPPER_DASHBOARD}`],
    }
  }
}));

if (ENABLE_AUTH) {
  setupAuth(app);
}


app.use("/", express.static("./dist/client"));

setupWebsockets(app);
setupEnvironment(router);

app.use("/api", router);

server.listen(PORT, () =>
  console.log(`[server]: Server is running at http://localhost:${PORT}`)
);

/*
if (true) {
  const socketServer = createServer();
  const io = new Server(socketServer);

  io.on('connection', (socket) => {
    socket.on('join', function (room) {
      socket.join(room);
    });
  });

  socketServer.listen(8000, () =>
    console.log(`[server]: Socket.io server is running at http://localhost:8000`)
  );
}*/
