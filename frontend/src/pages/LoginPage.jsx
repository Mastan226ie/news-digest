import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LogIn, Quote } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";

const QUOTES = [
  { text: "You have to dream before your dreams can come true.", author: "A.P.J. Abdul Kalam" },
  { text: "I don't believe in taking right decisions. I take decisions and then make them right.", author: "Ratan Tata" },
  { text: "All of us do not have equal talent. But, all of us have an equal opportunity to develop our talents.", author: "A.P.J. Abdul Kalam" },
  { text: "Take the stones people throw at you and use them to build a monument.", author: "Ratan Tata" },
  { text: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt" },
  { text: "Success is not final, failure is not fatal: It is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Arise, awake, and stop not till the goal is reached.", author: "Swami Vivekananda" },
  { text: "When something is important enough, you do it even if the odds are not in your favor.", author: "Elon Musk" },
  { text: "Play iterated games. All the returns in life come from compound interest.", author: "Naval Ravikant" },
  { text: "Hard work beats talent when talent doesn't work hard.", author: "Tim Notke" },
];

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, status } = useAuth();
  const error = searchParams.get("error");
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (status === "authenticated" && user) {
      navigate("/", { replace: true });
    }
  }, [status, user, navigate]);

  // Auto-redirect after 6 seconds if AccessDenied
  useEffect(() => {
    if (error === "AccessDenied") {
      const timer = setTimeout(() => navigate("/"), 6000);
      return () => clearTimeout(timer);
    }
  }, [error, navigate]);

  const handleSignIn = () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    // Redirect to the Express server's Google OAuth route
    window.location.href = `${SERVER_URL}/api/auth/google`;
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col relative overflow-hidden font-sans selection:bg-cyan-500/30">
      {/* Neon glowing orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: "8s" }} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-fuchsia-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: "10s" }} />
      <div className="absolute top-[40%] left-[40%] w-[20%] h-[20%] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDuration: "6s" }} />

      {/* Header */}
      <header className="w-full p-6 md:px-12 md:py-8 flex justify-between items-center relative z-20">
        <div className="font-black text-xl tracking-tighter uppercase flex items-center gap-3">
          <img src="/logo.png" alt="News Digest Logo" className="w-8 h-8 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] object-cover" />
          <span className="tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-white to-stone-400">NEWS Digest</span>
        </div>

        <button
          type="button"
          onClick={handleSignIn}
          className={`group relative px-6 py-2.5 rounded-full overflow-hidden flex items-center gap-2 border border-cyan-500/30 hover:border-cyan-400 transition-all bg-black/40 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.1)] hover:shadow-[0_0_25px_rgba(6,182,212,0.3)] ${isLoggingIn ? "opacity-70 cursor-wait" : "cursor-pointer"}`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-fuchsia-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
          {isLoggingIn ? (
            <div className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin relative z-10" />
          ) : (
            <LogIn className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300 transition-colors relative z-10" />
          )}
          <span className="text-sm font-bold text-stone-200 group-hover:text-white transition-colors tracking-widest uppercase relative z-10">
            {isLoggingIn ? "Connecting..." : "Sign In"}
          </span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-6 max-w-5xl mx-auto w-full">
        {error === "AccessDenied" ? (
          <div className="flex flex-col items-center justify-center max-w-lg text-center mt-[-40px]">
            <div className="w-64 h-64 flex items-center justify-center mb-4">
              <div className="text-8xl">🚫</div>
            </div>
            <h2 className="text-3xl md:text-4xl font-light text-stone-200 mb-3 tracking-tight">Oops!</h2>
            <p className="text-lg text-stone-400 leading-relaxed font-medium mb-6">
              It looks like you don&apos;t have access to this application just yet.
            </p>
            <div className="px-6 py-4 bg-cyan-950/40 border border-cyan-500/30 rounded-2xl text-cyan-200 text-sm tracking-widest uppercase font-bold shadow-[0_0_20px_rgba(6,182,212,0.15)] flex flex-col items-center gap-2">
              <span>Please reach out to the admin</span>
              <span className="text-[10px] text-cyan-500 font-medium">Redirecting to main page in 6 seconds...</span>
            </div>
          </div>
        ) : (
          <div style={{ animation: "loginFadeIn 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}>
            <Quote className="w-10 h-10 md:w-14 md:h-14 text-cyan-500/30 mb-8 mx-auto" />
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-light leading-tight text-center mb-12 text-transparent bg-clip-text bg-gradient-to-b from-white via-stone-200 to-stone-500 tracking-tight">
              &ldquo;{quote.text}&rdquo;
            </h1>
            <div className="flex items-center justify-center gap-6">
              <div className="h-[1px] w-16 md:w-24 bg-gradient-to-r from-transparent to-fuchsia-500/50" />
              <p className="text-sm md:text-lg font-bold tracking-[0.2em] uppercase text-fuchsia-400 drop-shadow-[0_0_12px_rgba(232,121,249,0.4)]">
                {quote.author}
              </p>
              <div className="h-[1px] w-16 md:w-24 bg-gradient-to-l from-transparent to-fuchsia-500/50" />
            </div>
          </div>
        )}
      </main>

      <footer className="p-6 md:p-12 text-center relative z-10">
        <p className="text-stone-600 text-[10px] md:text-xs tracking-[0.3em] uppercase font-bold">
          Focus &bull; Learn &bull; Achieve
        </p>
      </footer>
    </div>
  );
}
