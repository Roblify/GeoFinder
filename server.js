require("dotenv").config();

const path = require("path");
const express = require("express");
const session = require("express-session");

const {
  LOGIN_PASSWORD,
  GOOGLE_MAPS_API_KEY,
  SESSION_SECRET,
  PORT = 3000,
} = process.env;

if (!LOGIN_PASSWORD) {
  console.error("Missing LOGIN_PASSWORD in .env");
  process.exit(1);
}
if (!GOOGLE_MAPS_API_KEY) {
  console.error("Missing GOOGLE_MAPS_API_KEY in .env");
  process.exit(1);
}

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(
  session({
    secret: SESSION_SECRET || "geofinder-dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

function requireAuth(req, res, next) {
  if (req.session && req.session.authed) return next();
  return res.redirect("/login");
}

function requireAuthApi(req, res, next) {
  if (req.session && req.session.authed) return next();
  return res.status(401).json({ error: "unauthorized" });
}

app.get("/login", (req, res) => {
  if (req.session && req.session.authed) return res.redirect("/");
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.post("/login", (req, res) => {
  const { password } = req.body || {};
  if (typeof password === "string" && password === LOGIN_PASSWORD) {
    req.session.authed = true;
    return res.redirect("/");
  }
  res.status(401).sendFile(path.join(__dirname, "public", "login.html"));
});

app.post("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

// Serves the Google Maps script tag with the server-held key, so the key
// is never embedded in static HTML. The session still gates access.
app.get("/maps.js", requireAuthApi, (req, res) => {
  res.type("application/javascript");
  res.send(
    `window.__GOOGLE_MAPS_KEY__ = ${JSON.stringify(GOOGLE_MAPS_API_KEY)};`
  );
});

app.use(
  "/",
  requireAuth,
  express.static(path.join(__dirname, "public"), { index: "index.html" })
);

app.listen(PORT, () => {
  console.log(`GeoFinder listening on http://localhost:${PORT}`);
});
