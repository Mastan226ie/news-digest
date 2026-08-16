const express = require("express");
const passport = require("passport");
const router = express.Router();

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// ─── Initiate Google OAuth ────────────────────────────────────────────────────
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

// ─── Google OAuth Callback ────────────────────────────────────────────────────
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${CLIENT_URL}/login?error=AccessDenied`,
    session: true,
  }),
  (req, res) => {
    // Successful login — redirect to home page
    res.redirect(`${CLIENT_URL}/`);
  }
);

// ─── Get current session user ─────────────────────────────────────────────────
router.get("/me", (req, res) => {
  if (req.isAuthenticated()) {
    return res.json({ user: req.user });
  }
  return res.status(401).json({ user: null });
});

// ─── Logout ───────────────────────────────────────────────────────────────────
router.post("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy((err) => {
      if (err) return next(err);
      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  });
});

module.exports = router;
