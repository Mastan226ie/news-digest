import { useState, useEffect, useRef, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import DateSelector from "../components/DateSelector";
import NewsCard from "../components/NewsCard";
import AIAssistant from "../components/AIAssistant";
import ReadingTracker from "../components/ReadingTracker";
import { getLocalDateString, formatLocalDate } from "../utils/date";
import { useNews } from "../contexts/NewsContext";

function ArticlesSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-col justify-between py-2 border-b border-theme-border pb-6 animate-pulse">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-16 h-3.5 bg-theme-border/70 rounded" />
              <span className="w-1 h-1 rounded-full bg-theme-border" />
              <div className="w-24 h-3.5 bg-theme-border/70 rounded" />
            </div>
            <div className="w-full h-8 bg-theme-border/70 rounded mb-3" />
            <div className="w-3/4 h-8 bg-theme-border/70 rounded mb-6" />
            <div className="w-full h-4 bg-theme-border/70 rounded mb-2" />
            <div className="w-5/6 h-4 bg-theme-border/70 rounded mb-2" />
            <div className="w-2/3 h-4 bg-theme-border/70 rounded mb-6" />
          </div>
          <div className="w-32 h-4 bg-theme-border/70 rounded mt-4" />
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const [isMounted, setIsMounted] = useState(false);
  const [theme, setTheme] = useState("paper");

  const {
    selectedCategory, selectedDate, articles, page, hasMore, isLoading,
    error, isFetchingNews, fetchStatus, handleCategoryChange, handleDateChange,
    handleFetchNewsForDate, loadMore, setScrollPosition, scrollPosition, readArticleIds,
  } = useNews();

  const observer = useRef(null);
  const lastArticleElementRef = useCallback((node) => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) loadMore();
    });
    if (node) observer.current.observe(node);
  }, [isLoading, hasMore, loadMore]);

  useEffect(() => {
    setIsMounted(true);
    if (scrollPosition > 0) setTimeout(() => window.scrollTo(0, scrollPosition), 50);

    let timeoutId;
    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setScrollPosition(window.scrollY), 100);
    };
    window.addEventListener("scroll", handleScroll);

    const savedTheme = localStorage.getItem("mba-digest-theme");
    if (savedTheme && ["paper", "sage", "alabaster", "dark"].includes(savedTheme)) {
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    } else {
      document.documentElement.setAttribute("data-theme", "paper");
    }

    return () => { window.removeEventListener("scroll", handleScroll); clearTimeout(timeoutId); };
  }, []);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("mba-digest-theme", newTheme);
  };

  return (
    <div className="min-h-screen bg-theme-bg text-theme-fg font-sans selection:bg-theme-selection-bg transition-colors duration-300">
      <header className="sticky top-0 z-30 bg-theme-bg/95 backdrop-blur-md border-b border-theme-border/80 transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-6 py-6 md:py-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-4 mb-1">
                <img src="/logo.png" alt="Logo" className="w-10 h-10 md:w-12 md:h-12 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] object-cover" />
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-theme-fg uppercase">NEWS Digest</h1>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-2.5">
                <span className="text-xs font-bold text-theme-muted uppercase tracking-widest">The Daily Brief</span>
                <span className="w-1.5 h-1.5 rounded-full bg-theme-border" />

                {/* Theme Switcher */}
                <div className="flex items-center gap-2.5 bg-theme-card-bg/90 border border-theme-border/60 py-1 px-2.5 rounded-full shadow-sm">
                  <span className="text-[10px] font-bold text-theme-muted uppercase tracking-widest mr-1">Theme:</span>
                  {[
                    { id: "paper", bg: "#F9F7F1", ring: "ring-amber-700/30 border-amber-700", label: "Calm Paper" },
                    { id: "sage", bg: "#F2F5F0", ring: "ring-emerald-700/30 border-emerald-700", label: "Classic Sage" },
                    { id: "alabaster", bg: "#F5F3EE", ring: "ring-amber-950/30 border-amber-950", label: "Muted Alabaster" },
                    { id: "dark", bg: "#0D0D0C", ring: "ring-stone-200/30 border-stone-200", label: "Deep Charcoal" },
                  ].map(({ id, bg, ring, label }) => (
                    <button
                      key={id}
                      onClick={() => handleThemeChange(id)}
                      className={`w-3.5 h-3.5 rounded-full border transition-all hover:scale-125 cursor-pointer relative group ${theme === id ? `${ring} ring-2 scale-110` : "border-stone-300"}`}
                      style={{ backgroundColor: bg }}
                      title={label}
                      aria-label={`Switch to ${label} theme`}
                    >
                      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-theme-fg text-theme-bg text-[9px] font-bold px-2 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="w-full md:w-auto">
              {isMounted && selectedDate ? (
                <DateSelector selectedDate={selectedDate} onSelectDate={handleDateChange} />
              ) : (
                <div className="flex gap-4 overflow-x-auto py-1">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="w-20 h-8 bg-theme-border/60 rounded-full animate-pulse" />
                  ))}
                </div>
              )}
            </div>
          </div>

          <Sidebar selectedCategory={selectedCategory} onSelectCategory={handleCategoryChange} />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 md:py-16">
        <div className="mb-12 border-b border-theme-fg pb-4">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-theme-fg">
            {selectedCategory === "All" ? "Today's Top Stories" : `${selectedCategory} News`}
          </h2>
          <p className="text-theme-muted mt-2 text-sm font-semibold uppercase tracking-wider">
            {isMounted && selectedDate
              ? formatLocalDate(selectedDate, { weekday: "long", month: "long", day: "numeric", year: "numeric" })
              : <span className="inline-block w-48 h-4 bg-theme-border/60 rounded animate-pulse" />}
          </p>
        </div>

        {!isMounted || !selectedDate || (isLoading && page === 1) ? (
          <ArticlesSkeleton />
        ) : error && page === 1 ? (
          error.includes("Fetching took longer") ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-16 h-16 mb-6 text-theme-muted/50 animate-pulse">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3 tracking-tight text-theme-fg">Still Working on It...</h3>
              <p className="max-w-md font-medium text-theme-muted mb-8">
                The AI is taking a little longer than usual. It is running safely in the background and your articles will be available shortly.
              </p>
              <button onClick={() => window.location.reload()} className="px-6 py-3 border border-theme-border hover:border-theme-fg font-semibold text-sm uppercase tracking-widest transition-all cursor-pointer rounded-xl">
                Refresh Page
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 text-center text-red-500">
              <h3 className="text-2xl font-bold mb-3 tracking-tight">Error Loading News</h3>
              <p className="max-w-md font-medium">{error}</p>
            </div>
          )
        ) : articles.length > 0 ? (
          <>
            {(() => {
              const isToday = selectedDate === getLocalDateString(new Date());
              const trendingArticles = isToday ? articles.filter((a) => !readArticleIds.has(a.id)) : [];
              const regularArticles = isToday ? articles.filter((a) => readArticleIds.has(a.id)) : articles;
              return (
                <>
                  {isToday && trendingArticles.length > 0 && (
                    <div className="mb-16">
                      <div className="flex items-center gap-3 mb-8">
                        <span className="w-3 h-3 rounded-full bg-theme-accent animate-pulse" />
                        <h3 className="text-xl md:text-2xl font-extrabold tracking-tight text-theme-fg uppercase">Trending Today</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
                        {trendingArticles.map((article, index) => (
                          <div key={`trending-${article.id}-${index}`} className="h-full flex flex-col">
                            <NewsCard article={article} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {regularArticles.length > 0 && (
                    <div>
                      {isToday && trendingArticles.length > 0 && (
                        <h3 className="text-lg md:text-xl font-bold tracking-tight text-theme-muted uppercase mb-8 border-b border-theme-border/50 pb-2">Previously Read / Feed</h3>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
                        {regularArticles.map((article, index) => (
                          <div key={`${article.id}-${index}`} className="h-full flex flex-col">
                            <NewsCard article={article} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={lastArticleElementRef} className="h-1 w-full" />
                </>
              );
            })()}
            {isLoading && page > 1 && <div className="mt-12"><ArticlesSkeleton /></div>}
          </>
        ) : isFetchingNews ? (
          <div className="flex flex-col items-center justify-center py-32 text-center animate-pulse">
            <div className="w-12 h-12 border-4 border-t-theme-accent border-theme-border rounded-full animate-spin mb-6" />
            <h3 className="text-2xl font-bold mb-3 tracking-tight text-theme-fg">AI Curation in Progress</h3>
            <p className="text-theme-muted max-w-md font-medium text-sm">{fetchStatus}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <h3 className="text-2xl font-bold mb-3 tracking-tight text-theme-fg">No stories found</h3>
            <p className="text-theme-muted max-w-md font-medium mb-8">
              We couldn&apos;t find any news articles for {selectedCategory} on this date.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button onClick={handleFetchNewsForDate} className="px-6 py-3 bg-theme-accent text-theme-bg border border-theme-accent hover:bg-transparent hover:text-theme-accent font-bold text-sm uppercase tracking-widest transition-all cursor-pointer shadow-lg">
                Fetch & Curate news with AI
              </button>
              <button onClick={() => { handleCategoryChange("All"); handleDateChange(""); }} className="px-6 py-3 border border-theme-border hover:border-theme-fg font-semibold text-sm uppercase tracking-widest transition-all cursor-pointer">
                Reset Filters
              </button>
            </div>
          </div>
        )}
      </main>

      <AIAssistant />
      <ReadingTracker />
    </div>
  );
}
