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

// ─── Trust Proxy for Secure Cookies on Render ─────────────────────────────────
// Required for secure: true session cookies to be set when behind a load balancer
app.set("trust proxy", 1);

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

// Use in-memory session store to completely bypass the Render MongoDB DNS SRV bugs.
// (Render free tier runs a single instance anyway, so MemoryStore is perfectly fine for now).
/*
if (process.env.MONGODB_URL) {
  const connectWithRetry = async () => {
    while (true) {
      try {
        const m = await mongoose.connect(process.env.MONGODB_URL, {
          serverSelectionTimeoutMS: 5000,
          family: 4, 
        });
        console.log("🔌 Successfully connected to MongoDB for sessions");
        return m.connection.getClient();
      } catch (err) {
        console.error("⚠️ MongoDB connection error, retrying in 2 seconds:", err.message);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  };

  sessionConfig.store = MongoStore.create({
    clientPromise: connectWithRetry(),
    dbName: process.env.MONGODB_DB_NAME || "news_digest",
    collectionName: "sessions",
    ttl: 7 * 24 * 60 * 60,
  });
}
*/

app.use(session(sessionConfig));

// ─── Passport ────────────────────────────────────────────────────────────────
app.use(passport.initialize());
app.use(passport.session());

// ─── Auth Routes ─────────────────────────────────────────────────────────────
app.use("/api/auth", require("./routes/auth"));

// ─── Proxy all other /api/* requests to Python FastAPI backend ────────────────
app.use(
  createProxyMiddleware("/api", {
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
