import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getLocalDateString } from "../utils/date";
import { useAuth } from "./AuthContext";

const API_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";

const NewsContext = createContext(undefined);

export function NewsProvider({ children }) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDate, setSelectedDate] = useState("");
  const [articles, setArticles] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFetchingNews, setIsFetchingNews] = useState(false);
  const [fetchStatus, setFetchStatus] = useState(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [readArticleIds, setReadArticleIds] = useState(new Set());

  const { user } = useAuth();

  // Fetch read articles when user loads
  useEffect(() => {
    if (user?.email) {
      const fetchReadStats = async () => {
        try {
          const res = await fetch(`${API_URL}/api/user/read-articles?email=${encodeURIComponent(user.email)}`, {
            credentials: "include",
          });
          if (res.ok) {
            const data = await res.json();
            setReadArticleIds(new Set(data.read_article_ids || []));
          }
        } catch (err) {
          console.error("Failed to fetch read articles", err);
        }
      };
      fetchReadStats();
    } else {
      setReadArticleIds(new Set());
    }
  }, [user]);

  const markAsRead = async (articleId) => {
    if (!articleId || readArticleIds.has(articleId)) return;
    setReadArticleIds((prev) => {
      const newSet = new Set(prev);
      newSet.add(articleId);
      return newSet;
    });
    if (user?.email) {
      try {
        await fetch(`${API_URL}/api/user/read-article`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email, article_id: articleId }),
        });
      } catch (err) {
        console.error("Failed to mark article as read", err);
      }
    }
  };

  // Set initial date
  useEffect(() => {
    if (!selectedDate) {
      setSelectedDate(getLocalDateString(new Date()));
    }
  }, [selectedDate]);

  const handleCategoryChange = useCallback((cat) => {
    setSelectedCategory((prev) => {
      if (prev === cat) return prev;
      setPage(1);
      setArticles([]);
      setHasMore(true);
      setScrollPosition(0);
      return cat;
    });
  }, []);

  const handleDateChange = useCallback((date) => {
    setSelectedDate((prev) => {
      if (prev === date) return prev;
      setPage(1);
      setArticles([]);
      setHasMore(true);
      setScrollPosition(0);
      return date;
    });
  }, []);

  const loadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      setPage((prev) => prev + 1);
    }
  }, [hasMore, isLoading]);

  const handleFetchNewsForDate = async () => {
    setIsFetchingNews(true);
    setError(null);
    setFetchStatus("Triggering Gemini API News Pipeline...");
    try {
      const res = await fetch(`${API_URL}/api/news/trigger-fetch?date=${selectedDate}`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to trigger news pipeline");

      setFetchStatus("Fetching RSS feeds & running Gemini MBA Curation (~20 seconds)...");

      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        try {
          const checkUrl = new URL(`${API_URL}/api/news`);
          checkUrl.searchParams.append("date", selectedDate);
          checkUrl.searchParams.append("limit", "1");
          const checkRes = await fetch(checkUrl.toString(), { credentials: "include" });
          if (checkRes.ok) {
            const checkData = await checkRes.json();
            if (checkData.articles && checkData.articles.length > 0) {
              clearInterval(interval);
              setIsFetchingNews(false);
              setFetchStatus(null);
              setPage(1);
              setArticles([]);
              setHasMore(true);
              const dateCopy = selectedDate;
              setSelectedDate("");
              setTimeout(() => setSelectedDate(dateCopy), 10);
            }
          }
        } catch (err) {
          console.error("Error polling database:", err);
        }
        if (attempts > 12) {
          clearInterval(interval);
          setIsFetchingNews(false);
          setFetchStatus(null);
          setError("Fetching took longer than expected. Please check again in a bit.");
        }
      }, 5000);
    } catch (err) {
      console.error("Fetch pipeline trigger failed:", err);
      setError("Failed to start news fetching pipeline.");
      setIsFetchingNews(false);
      setFetchStatus(null);
    }
  };

  useEffect(() => {
    if (!selectedDate) return;

    const fetchNews = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const url = new URL(`${API_URL}/api/news`);
        url.searchParams.append("date", selectedDate);
        if (selectedCategory !== "All") {
          url.searchParams.append("category", selectedCategory);
        }
        url.searchParams.append("skip", ((page - 1) * 20).toString());
        url.searchParams.append("limit", "20");

        const res = await fetch(url.toString(), { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch news");

        const data = await res.json();
        const newArticles = data.articles || [];
        setArticles((prev) => (page === 1 ? newArticles : [...prev, ...newArticles]));
        setHasMore(newArticles.length === 20);
      } catch (err) {
        console.error("Error fetching news:", err);
        setError("Failed to load news articles. Please try again later.");
        if (page === 1) setArticles([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, [selectedDate, selectedCategory, page]);

  return (
    <NewsContext.Provider
      value={{
        selectedCategory,
        selectedDate,
        articles,
        page,
        hasMore,
        isLoading,
        error,
        isFetchingNews,
        fetchStatus,
        handleCategoryChange,
        handleDateChange,
        handleFetchNewsForDate,
        loadMore,
        setScrollPosition,
        scrollPosition,
        readArticleIds,
        markAsRead,
      }}
    >
      {children}
    </NewsContext.Provider>
  );
}

export function useNews() {
  const context = useContext(NewsContext);
  if (context === undefined) {
    throw new Error("useNews must be used within a NewsProvider");
  }
  return context;
}
