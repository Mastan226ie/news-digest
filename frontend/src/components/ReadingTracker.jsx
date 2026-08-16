import { useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";

export default function ReadingTracker() {
  const { user } = useAuth();
  const accumulatedTimeRef = useRef(0);
  const intervalRef = useRef(null);

  const reportTime = async (seconds, email) => {
    try {
      await fetch(`${SERVER_URL}/api/user/track-time`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, active_seconds: seconds }),
      });
    } catch (err) {
      console.error("Failed to report reading time", err);
    }
  };

  useEffect(() => {
    if (!user?.email) return;

    intervalRef.current = setInterval(() => {
      if (document.visibilityState === "visible") {
        accumulatedTimeRef.current += 10;
        if (accumulatedTimeRef.current >= 30 && user?.email) {
          reportTime(accumulatedTimeRef.current, user.email);
          accumulatedTimeRef.current = 0;
        }
      }
    }, 10000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (accumulatedTimeRef.current > 0 && user?.email) {
        reportTime(accumulatedTimeRef.current, user.email);
      }
    };
  }, [user]);

  return null;
}
