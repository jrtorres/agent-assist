

import {Express} from "express";
import passport from "passport";
import session from "express-session";
import crypto from "crypto";

const WebAppStrategy = require('ibmcloud-appid').WebAppStrategy;

const AUTH_STRATEGY = process.env.AUTH_STRATEGY ? process.env.AUTH_STRATEGY : "WebAppStrategy";
const AUTH_CALLBACK_URL = process.env.AUTH_CALLBACK_URL ? process.env.AUTH_CALLBACK_URL : "/ibm/cloud/appid/callback";
const AUTH_SESSION_SECRET = process.env.AUTH_SESSION_SECRET ? process.env.AUTH_SESSION_SECRET : crypto.randomBytes(20).toString('hex');
const AUTH_CLIENT_ID = process.env.AUTH_CALLBACK_CLIENT_ID;
const AUTH_OAUTH_SERVER_URL = process.env.AUTH_OAUTH_SERVER_URL;
const AUTH_PROFILES_URL = process.env.AUTH_PROFILES_URL ? process.env.AUTH_PROFILES_URL : "https://us-south.appid.cloud.ibm.com";
const AUTH_APP_ID_SECRET = process.env.AUTH_APP_ID_SECRET;
const AUTH_TENANT_ID = process.env.AUTH_TENANT_ID;

export default function setupEnvironment(app: Express) {
  app.use(
    session({
      secret: AUTH_SESSION_SECRET,
      resave: true,
      saveUninitialized: true,
      proxy: true,
      cookie: {secure: true}
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  let appStrategy;
  let appStrategyName;

  switch (AUTH_STRATEGY) {
    case "WebAppStrategy":
    default:
      appStrategy = new WebAppStrategy({
        clientId: AUTH_CLIENT_ID,
        oauthServerUrl: AUTH_OAUTH_SERVER_URL,
        profilesUrl: AUTH_PROFILES_URL,
        secret: AUTH_APP_ID_SECRET,
        tenantId: AUTH_TENANT_ID,
        redirectUri: `http://localhost:3000${AUTH_CALLBACK_URL}`
      });

      appStrategyName = "webAppStrategy";
  }


  passport.use(appStrategyName, appStrategy);

  passport.serializeUser((user: any, cb) => cb(null, user));
  passport.deserializeUser((obj: any, cb) => cb(null, obj));

  app.get(
    AUTH_CALLBACK_URL,
    passport.authenticate(appStrategyName, {
      failureRedirect: "/error"
    }),
  );

  app.use(
    "/protected",
    passport.authenticate(appStrategyName)
  );

  app.get("/logout", (req, res, next) => {
    req.logout(function (err) {
      if (err) {
        return next(err);
      }
      res.clearCookie("refreshToken");
      res.redirect("/protected");
    });
  });

  app.get("/error", (req, res) => {
    res.send("Authentication Error");
  });
}
