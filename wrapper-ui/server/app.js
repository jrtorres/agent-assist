
const express = require("express");
const session = require("express-session");
const { createProxyMiddleware } = require('http-proxy-middleware')
const passport = require("passport");
const appID = require("ibmcloud-appid");
const path = require("path");
require("dotenv").config();
const bucketRoute = require("./utils/listBuckets");
let port;

if (process.env.NODE_ENV === undefined) {
  port = 3003;
} else {
  port = 8080;
}

const WebAppStrategy = appID.WebAppStrategy;

const app = express();

app.use(express.json());

const CALLBACK_URL = "/ibm/cloud/appid/callback";

// Setup express application to use express-session middleware
// Must be configured with proper session storage for production
// environments. See https://github.com/expressjs/session for
// additional documentation
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    proxy: true,
  }),
);

// Configure express application to use passportjs
app.use(passport.initialize());
app.use(passport.session());

let webAppStrategy;

if (process.env.NODE_ENV === undefined) {
  webAppStrategy = new WebAppStrategy({
    clientId: process.env.CLIENT_ID,
    oauthServerUrl: process.env.OAUTH_SERVER_URL,
    profilesUrl: process.env.PROFILES_URL,
    secret: process.env.APP_ID_SECRET,
    tenantId: process.env.TENANT_ID,
    redirectUri: "http://localhost:3000/ibm/cloud/appid/callback",
  });
} else {
  webAppStrategy = new WebAppStrategy({
    clientId: process.env.CLIENT_ID,
    oauthServerUrl: process.env.OAUTH_SERVER_URL,
    profilesUrl: process.env.PROFILES_URL,
    secret: process.env.APP_ID_SECRET,
    tenantId: process.env.TENANT_ID,
    redirectUri: process.env.REDIRECT_URI,
  });
}

passport.use(webAppStrategy);

// Configure passportjs with user serialization/deserialization. This is required
// for authenticated session persistence accross HTTP requests. See passportjs docs
// for additional information http://passportjs.org/docs
passport.serializeUser((user, cb) => cb(null, user));
passport.deserializeUser((obj, cb) => cb(null, obj));

// Callback to finish the authorization process. Will retrieve access and identity tokens/
// from AppID service and redirect to either (in below order)
// 1. the original URL of the request that triggered authentication, as persisted in HTTP session under WebAppStrategy.ORIGINAL_URL key.
// 2. successRedirect as specified in passport.authenticate(name, {successRedirect: "...."}) invocation
// 3. application root ("/")
app.get(
  CALLBACK_URL,
  passport.authenticate(WebAppStrategy.STRATEGY_NAME, {
    failureRedirect: "/error",
    session: false,
  }),
);

const apiServerProxy = createProxyMiddleware({
  target: `${process.env.ANN_SOCKETIO_SERVER.replace(/^http/, 'ws')}`,
  changeOrigin: true,
  ws: true, // we turn this off so that the default upgrade function doesn't get called, we call our own later server.on('upgrade)
}
)

app.use('/socket.io', apiServerProxy)


app.get("/healthcheck", (req, res) => {
  res.send("Healthy!");
});

// Protect everything under /protected
app.use(
  "/protected",
  passport.authenticate(WebAppStrategy.STRATEGY_NAME, { session: false }),
);

// This will statically serve pages:
app.use(express.static(path.join(__dirname, "../landing")));

// This will statically serve the protected page (after authentication, since /protected is a protected area):
app.use("/protected", express.static(path.join(__dirname, "../dist")));

// Use to read the session, and deal with addition auth if necessary
app.use("/protected-auth", (req, res, next) => {
  console.log(req.session);
  // if (req.session.isAuth === undefined) {
  //   let middleware = express.static(path.join(__dirname, "../dist"));
  //   middleware(req, res, next);
  // } else {
  //   next();
  // }
});

app.get("/logout", (req, res) => {
  //Note: if you enabled SSO for Cloud Directory be sure to use webAppStrategy.logoutSSO instead.
  req._sessionManager = false;
  WebAppStrategy.logout(req);
  res.clearCookie("refreshToken");
  res.redirect("/");
});

//Serves the identity token payload
app.get("/protected/api/idPayload", (req, res) => {
  res.send(req.session[WebAppStrategy.AUTH_CONTEXT].identityTokenPayload);
});

// TODO: Protect buckets route
app.use("/buckets", bucketRoute);

app.get("/error", (req, res) => {
  res.send("Authentication Error");
});

app.listen(port, () => {
  console.log("Listening on http://localhost:" + port);
});
