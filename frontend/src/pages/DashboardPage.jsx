import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import TicTacToe from "../components/games/TicTacToe";
import Bizdle from "../components/games/Bizdle";
import { Flame, Clock, ArrowLeft } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";

export default function DashboardPage() {
  const { user, status } = useAuth();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async (email) => {
      try {
        const res = await fetch(`${SERVER_URL}/api/user/stats?email=${encodeURIComponent(email)}`, {
          credentials: "include",
        });
        if (res.ok) setStats(await res.json());
      } catch (err) {
        console.error("Failed to fetch stats", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (status === "authenticated" && user?.email) {
      fetchStats(user.email);
    } else if (status === "unauthenticated") {
      setIsLoading(false);
    }
  }, [user, status]);

  if (isLoading || status === "loading") {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-t-theme-accent border-theme-border rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-theme-bg flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-3xl font-black text-theme-fg mb-4 uppercase tracking-tighter">Access Denied</h2>
        <p className="text-theme-muted mb-8 font-medium">Please log in to view your dashboard.</p>
        <Link to="/" className="px-6 py-3 bg-theme-accent text-theme-bg font-bold text-sm uppercase tracking-widest rounded-full transition-all hover:scale-105">
          Return Home
        </Link>
      </div>
    );
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  return (
    <div className="min-h-screen bg-theme-bg text-theme-fg font-sans selection:bg-theme-selection-bg transition-colors duration-300">
      <header className="sticky top-0 z-30 bg-theme-bg/95 backdrop-blur-md border-b border-theme-border/80 transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-6 py-6 md:py-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-4 mb-1">
                <img src="/logo.png" alt="Logo" className="w-10 h-10 md:w-12 md:h-12 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] object-cover" />
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-theme-fg uppercase">Dashboard</h1>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-2.5">
                <span className="text-xs font-bold text-theme-muted uppercase tracking-widest">Your Stats & Games</span>
                <span className="w-1.5 h-1.5 rounded-full bg-theme-border" />
                <Link to="/" className="flex items-center gap-1.5 text-[10px] font-bold text-theme-muted hover:text-theme-fg uppercase tracking-widest transition-colors group">
                  <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
                  Back to News
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h2 className="text-2xl font-extrabold tracking-tight text-theme-fg uppercase">Your Progress</h2>
          <p className="text-theme-muted mt-1 text-sm font-semibold uppercase tracking-wider">
            Keep up the good work, {user?.name?.split(" ")[0]}!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {/* Streak Card */}
          <div className="flex items-center gap-6 bg-theme-card-bg/60 p-6 sm:p-8 rounded-3xl border border-theme-border/60 shadow-sm relative overflow-hidden group hover:border-theme-border transition-colors duration-500">
            <div className="w-20 h-20 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0 border border-orange-500/20 group-hover:scale-110 transition-transform duration-500">
              <Flame className="w-10 h-10 text-orange-500 drop-shadow-md" />
            </div>
            <div>
              <p className="text-xs font-bold text-theme-muted uppercase tracking-widest mb-1">Current Streak</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-5xl font-black text-theme-fg tracking-tighter">{stats?.streak_days || 0}</h3>
                <span className="text-sm font-bold text-theme-muted uppercase tracking-widest">Days</span>
              </div>
            </div>
            <div className="absolute -right-8 -bottom-8 opacity-5">
              <Flame className="w-48 h-48" />
            </div>
          </div>

          {/* Reading Time Card */}
          <div className="flex items-center gap-6 bg-theme-card-bg/60 p-6 sm:p-8 rounded-3xl border border-theme-border/60 shadow-sm relative overflow-hidden group hover:border-theme-border transition-colors duration-500">
            <div className="w-20 h-20 rounded-full bg-theme-accent/10 flex items-center justify-center shrink-0 border border-theme-accent/20 group-hover:scale-110 transition-transform duration-500">
              <Clock className="w-10 h-10 text-theme-accent" />
            </div>
            <div>
              <p className="text-xs font-bold text-theme-muted uppercase tracking-widest mb-1">Time Read Today</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-4xl sm:text-5xl font-black text-theme-fg tracking-tighter">
                  {stats ? formatTime(stats.today_reading_seconds) : "0s"}
                </h3>
              </div>
            </div>
            <div className="absolute -right-8 -bottom-8 opacity-5">
              <Clock className="w-48 h-48" />
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-extrabold tracking-tight text-theme-fg uppercase">Mini-Games Break</h2>
          <p className="text-theme-muted mt-1 text-sm font-semibold uppercase tracking-wider">Take a quick mental break</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          <TicTacToe />
          <Bizdle />
        </div>
      </main>
    </div>
  );
}
