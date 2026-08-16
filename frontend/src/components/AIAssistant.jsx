import { useState } from "react";
import { Bot, Languages, X, Send, BookOpen } from "lucide-react";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState("define");
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState("Hindi");

  const formatResponse = (text) => {
    if (!text) return null;
    const lines = text.split("\n").filter((l) => l.trim() !== "");
    return (
      <div className="space-y-4">
        {lines.map((line, idx) => {
          const match = line.match(/^(Part of Speech|Meaning|Usage Example):\s*(.*)/i);
          if (match) {
            const [, header, content] = match;
            return (
              <div key={idx} className="flex flex-col gap-1 text-sm border-l-2 border-theme-accent/30 pl-3 py-0.5">
                <span className="font-extrabold text-[10px] uppercase tracking-wider text-theme-accent">{header}</span>
                <span className="font-semibold text-theme-fg/90 leading-relaxed">{content}</span>
              </div>
            );
          }
          return <p key={idx} className="text-sm font-semibold text-theme-fg/80 leading-relaxed">{line}</p>;
        })}
      </div>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    const currentQuery = query.trim();
    setLoading(true);
    setResponse("");
    setQuery("");
    try {
      let url = `${SERVER_URL}/api/assistant/define?word=${encodeURIComponent(currentQuery)}`;
      if (mode === "translate") {
        url = `${SERVER_URL}/api/assistant/translate?word=${encodeURIComponent(currentQuery)}&language=${encodeURIComponent(targetLanguage)}`;
      }
      const res = await fetch(url, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setResponse(data.result);
    } catch {
      setResponse("Sorry, there was an error. Please ensure the backend is running and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-theme-accent text-theme-bg rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-transform z-50 border border-theme-border/20 cursor-pointer overflow-hidden p-0"
        aria-label="Open AI Assistant"
      >
        <img src="/logo.png" alt="AI Assistant" className="w-full h-full object-cover rounded-full" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[360px] bg-theme-card-bg border border-theme-border shadow-2xl rounded-2xl z-50 overflow-hidden flex flex-col font-sans transition-colors duration-300">
      <div className="flex items-center justify-between p-4 border-b border-theme-border/60 bg-theme-border/20">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="w-5 h-5 rounded-md object-cover" />
          <h3 className="font-extrabold text-xs uppercase tracking-widest text-theme-fg">Reading Assistant</h3>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-theme-muted hover:text-theme-fg transition-colors cursor-pointer">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex border-b border-theme-border/60">
        {["define", "translate"].map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setResponse(""); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              mode === m ? "text-theme-fg border-b-2 border-theme-fg" : "text-theme-muted hover:text-theme-fg"
            }`}
          >
            {m === "define" ? <BookOpen className="w-4 h-4" /> : <Languages className="w-4 h-4" />}
            {m === "define" ? "Meaning" : "Translate"}
          </button>
        ))}
      </div>

      <div className="p-5 flex-1 min-h-[200px] flex flex-col justify-end bg-theme-bg/30">
        {response ? (
          <div className="bg-theme-border/30 text-theme-fg/90 p-4 rounded-xl text-sm leading-relaxed mb-4 border border-theme-border/50 shadow-sm max-h-[300px] overflow-y-auto">
            {formatResponse(response)}
          </div>
        ) : loading ? (
          <div className="flex items-center gap-2 text-theme-muted text-sm mb-4 animate-pulse px-2">
            <Bot className="w-4 h-4 text-indigo-600" />
            Generating response...
          </div>
        ) : (
          <div className="text-theme-muted text-xs font-medium mb-4 px-2 text-center leading-relaxed">
            Type any difficult word or phrase to get its {mode === "define" ? "meaning" : "translation"}.
          </div>
        )}

        {mode === "translate" && (
          <div className="mb-4 flex items-center justify-between bg-theme-bg border border-theme-border rounded-xl p-2 px-3 shadow-sm">
            <span className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">Translate to:</span>
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="bg-transparent text-xs font-bold focus:outline-none text-theme-fg cursor-pointer border-none outline-none mr-2 pr-1"
            >
              {["Hindi", "Telugu", "Spanish", "French", "German", "Mandarin"].map((lang) => (
                <option key={lang} value={lang} className="bg-theme-card-bg text-theme-fg">{lang}</option>
              ))}
            </select>
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative mt-auto">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={mode === "define" ? "e.g., Repo Rate, GDP..." : "Enter word to translate..."}
            className="w-full bg-theme-bg text-theme-fg border border-theme-border rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-theme-accent transition-all shadow-sm"
          />
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-theme-accent text-theme-bg rounded-lg disabled:opacity-40 transition-opacity cursor-pointer"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
