// routes/authRouter.js
const express = require("express");
const passport = require("passport");
const WebAppStrategy = require("ibmcloud-appid").WebAppStrategy;
const path = require("path");

const authRouter = express.Router();

// Configure App ID authentication
passport.use(
  new WebAppStrategy({
    tenantId: "f9afd1d8-eaec-46b6-aa75-206f066f5711", // Replace with your App ID tenant ID
    clientId: "2a00a6b8-aae8-479b-b111-d6afe59b9379", // Replace with your App ID client ID
    secret: "ZTVjNTZkZWItNmVkOC00NmE2LTg5M2UtNDAyNzQ2ZTkxMjk2", // Replace with your App ID secret
    oauthServerUrl:
      "https://us-south.appid.cloud.ibm.com/oauth/v4/f9afd1d8-eaec-46b6-aa75-206f066f5711", // Replace with your App ID region
    redirectUri: "http://localhost:3000/ibm/cloud/appid/callback",
  }),
);

// Serialize and deserialize user
passport.serializeUser((user, cb) => cb(null, user));
passport.deserializeUser((obj, cb) => cb(null, obj));

// Initialize App ID authentication middleware
authRouter.use(
  passport.authenticate(
    WebAppStrategy.STRATEGY_NAME,
    {
      successRedirect: "/",
      forceLogin: true,
    },
    console.log("Authenticated"),
  ),
);

//app.use("/", express.static(path.join(__dirname, "../dist")));

module.exports = authRouter;
