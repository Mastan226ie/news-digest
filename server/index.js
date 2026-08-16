require("dotenv").config();

const express = require("express");
const session = require("express-session");
const passport = require("passport");
const cors = require("cors");
const MongoStore = require("connect-mongo");
const { createProxyMiddleware } = require("http-proxy-middleware");

// ─── Passport Strategy ───────────────────────────────────────────────────────
require("./config/passport");

const app = express();
const PORT = process.env.PORT || 4000;
const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());

// ─── Session ──────────────────────────────────────────────────────────────────
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

const mongoose = require("mongoose");

// Use MongoDB for session storage if MONGODB_URL is set
if (process.env.MONGODB_URL) {
  // Use mongoose to connect gracefully without crashing on Render's slow DNS
  const clientPromise = mongoose
    .connect(process.env.MONGODB_URL, {
      serverSelectionTimeoutMS: 5000,
    })
    .then((m) => m.connection.getClient())
    .catch((err) => {
      console.error("⚠️ MongoDB connection error at startup:", err.message);
      // We return the promise anyway so connect-mongo doesn't completely break, 
      // but we catch the error to prevent the Node process from exiting.
    });

  sessionConfig.store = MongoStore.create({
    clientPromise: clientPromise,
    dbName: process.env.MONGODB_DB_NAME || "news_digest",
    collectionName: "sessions",
    ttl: 7 * 24 * 60 * 60,
  });
}

app.use(session(sessionConfig));

// ─── Passport ────────────────────────────────────────────────────────────────
app.use(passport.initialize());
app.use(passport.session());

// ─── Auth Routes ─────────────────────────────────────────────────────────────
app.use("/api/auth", require("./routes/auth"));

// ─── Proxy all other /api/* requests to Python FastAPI backend ────────────────
app.use(
  "/api",
  createProxyMiddleware({
    target: FASTAPI_URL,
    changeOrigin: true,
    on: {
      error: (err, req, res) => {
        console.error("[Proxy Error]", err.message);
        res.status(502).json({ error: "Backend service unavailable" });
      },
    },
  })
);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "news-digest-server" });
});

app.listen(PORT, () => {
  console.log(`✅ Express server running on http://localhost:${PORT}`);
  console.log(`   Proxying /api/* → ${FASTAPI_URL}`);
  console.log(`   Client origin: ${CLIENT_URL}`);
});
