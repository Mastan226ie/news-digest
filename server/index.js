require("dotenv").config();

const express = require("express");
const session = require("express-session");
const passport = require("passport");
const cors = require("cors");
const MongoStore = require("connect-mongo");
const { createProxyMiddleware } = require("http-proxy-middleware");

// --- Passport Strategy ---
require("./config/passport");

const app = express();
const PORT = process.env.PORT || 4000;
const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

// Support comma-separated origins and trim whitespace to avoid mismatches
const CLIENT_URLS = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((u) => u.trim())
  .filter(Boolean);
const CLIENT_URL = CLIENT_URLS[0]; // primary redirect target

// --- CORS ---
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (CLIENT_URLS.includes(origin)) return callback(null, true);
      callback(new Error("CORS: origin '" + origin + "' not allowed"));
    },
    credentials: true,
  })
);

app.use(express.json());

// --- Trust Proxy for Secure Cookies on Render ---
// Required for secure: true session cookies to be set when behind a load balancer
app.set("trust proxy", 1);

// --- Session ---
const sessionConfig = {
  secret: process.env.SESSION_SECRET || "dev-secret-change-in-production",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  },
};

// --- Persistent Session Store (MongoDB) ---
// Uses MongoClient directly (not mongoose) to bypass Render's broken SRV DNS.
// The { family: 4 } option forces IPv4-only resolution -- same fix as the
// Python backend -- which survives Render's broken Atlas SRV lookups.
if (process.env.MONGODB_URL) {
  const { MongoClient } = require("mongodb");

  const mongoClient = new MongoClient(process.env.MONGODB_URL, {
    serverSelectionTimeoutMS: 10000,
    family: 4, // Force IPv4 to fix Render DNS SRV resolution
  });

  const clientPromise = mongoClient
    .connect()
    .then((client) => {
      console.log("MongoDB session store connected");
      return client;
    })
    .catch((err) => {
      console.error("MongoDB session store failed to connect:", err.message);
      console.warn("Sessions will fall back to in-memory store (lost on restart).");
      return null;
    });

  sessionConfig.store = MongoStore.create({
    clientPromise,
    dbName: process.env.MONGODB_DB_NAME || "news_digest",
    collectionName: "sessions",
    ttl: 7 * 24 * 60 * 60, // 7 days in seconds
  });
} else {
  console.warn("MONGODB_URL not set -- using in-memory session store (sessions lost on restart).");
}

app.use(session(sessionConfig));

// --- Passport ---
app.use(passport.initialize());
app.use(passport.session());

// --- Auth Routes ---
app.use("/api/auth", require("./routes/auth"));

// --- Proxy all other /api/* requests to Python FastAPI backend ---
app.use(
  createProxyMiddleware({
    pathFilter: "/api",
    target: FASTAPI_URL.replace(/\/$/, ""),
    changeOrigin: true,
    on: {
      error: (err, req, res) => {
        console.error("[Proxy Error]", err.message);
        res.status(502).json({ error: "Backend service unavailable" });
      },
    },
  })
);

// --- Health check ---
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "news-digest-server" });
});

app.listen(PORT, () => {
  console.log("Express server running on http://localhost:" + PORT);
  console.log("  Proxying /api/* to " + FASTAPI_URL);
  console.log("  Client origin: " + CLIENT_URL);
});
