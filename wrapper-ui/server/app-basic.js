const express = require("express");
const fs = require("fs")
const path = require("path");
const app = express();
const { createProxyMiddleware } = require('http-proxy-middleware')
let port;

if (process.env.NODE_ENV === undefined) {
  port = 3003;
} else {
  port = 8080;
}

app.use(express.json());
const apiServerProxy = createProxyMiddleware({
  target: `${process.env.ANN_SOCKETIO_SERVER}/socket.io/'`,
  changeOrigin: true,
  ws: true, // we turn this off so that the default upgrade function doesn't get called, we call our own later server.on('upgrade)
}
)

app.use('/socket.io', apiServerProxy)


console.log(`agent dashboard ${process.env.ANN_AGENT_DASHBOARD}`)
console.log(`${process.env.ANN_AGENT_DASHBOARD}`)
const agentDashboardProxy = createProxyMiddleware({
  target: `${process.env.ANN_AGENT_DASHBOARD}`,
  changeOrigin: true,
}
)

app.use('/agent', agentDashboardProxy)

// Middleware to inject proxyPath into the HTML file
app.get('/', (req, res, next) => {
  const indexPath = path.resolve(__dirname, '../dist/index.html');
  
  fs.readFile(indexPath, 'utf-8', (err, html) => {
    if (err) {
      return next(err);
    }

    // Inject the proxy path into the HTML (via a global JS variable)
    const modifiedHtml = html.replace(
      '</head>',
      `<script>window.__APP_CONFIG__ = { proxyPath: '${process.env.ANN_AGENT_DASHBOARD}' };</script></head>`
    );

    res.send(modifiedHtml);
  });
});


// app.use("*", express.static(path.join(__dirname, "../dist")));

// static files
app.use(express.static(path.join(__dirname, "../dist")))

// all other requests, serve index.html
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, "../dist", 'index.html'))
})

app.get("/healthcheck", (req, res) => {
  res.send("Healthy!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
