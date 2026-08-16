const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:4000/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();
        if (!email) return done(null, false, { message: "No email found" });

        // Verify the user against the FastAPI backend (same logic as next-auth signIn callback)
        const res = await fetch(`${FASTAPI_URL}/api/auth/verify?email=${encodeURIComponent(email)}`);
        if (!res.ok) return done(null, false, { message: "Backend verification failed" });

        const data = await res.json();
        if (!data.allowed) return done(null, false, { message: "AccessDenied" });

        const user = {
          email,
          name: profile.displayName,
          image: profile.photos?.[0]?.value || null,
          role: data.role,
        };

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));
