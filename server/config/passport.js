const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
      proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();
        if (!email) return done(null, false, { message: "No email found" });

        // Verify the user against the FastAPI backend
        console.log(`Verifying email ${email} against FastAPI at ${FASTAPI_URL}`);
        const res = await fetch(`${FASTAPI_URL}/api/auth/verify?email=${encodeURIComponent(email)}`);
        
        if (!res.ok) {
          const text = await res.text();
          console.error(`Backend verification failed with status ${res.status}:`, text);
          return done(null, false, { message: "Backend verification failed" });
        }

        const data = await res.json();
        console.log("Verification response from backend:", data);
        
        if (!data.allowed) {
          console.error("User explicitly denied access by backend.");
          return done(null, false, { message: "AccessDenied" });
        }

        const user = {
          email,
          name: profile.displayName,
          image: profile.photos?.[0]?.value || null,
          role: data.role,
        };

        return done(null, user);
      } catch (err) {
        console.error("Network or internal error during passport verification:", err);
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));
