import { ArrowRight, CheckCircle2 } from "lucide-react";
import { formatLocalDate } from "../utils/date";
import { getCategoryColor } from "../utils/categoryColors";
import { useNews } from "../contexts/NewsContext";

export default function NewsCard({ article }) {
  const { readArticleIds, markAsRead } = useNews();
  const isRead = readArticleIds.has(article.id);

  return (
    <article
      className={`group break-inside-avoid flex flex-col justify-between py-2 transition-all hover:opacity-85 border-b border-theme-border/50 pb-8 duration-300 ${
        isRead ? "opacity-60 grayscale-[20%]" : ""
      }`}
    >
      <div>
        <div className="flex items-center gap-3 mb-4">
          <span className={`text-xs font-extrabold tracking-widest uppercase ${getCategoryColor(article.category)}`}>
            {article.category}
          </span>
          <span className="w-1 h-1 rounded-full bg-theme-border" />
          <span className="text-xs font-bold text-theme-muted uppercase tracking-widest">
            {formatLocalDate(article.published_date, { month: "short", day: "numeric", year: "numeric" })}
          </span>
          {isRead && (
            <>
              <span className="w-1 h-1 rounded-full bg-theme-border" />
              <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 uppercase tracking-widest">
                <CheckCircle2 className="w-3 h-3" /> Read
              </span>
            </>
          )}
        </div>

        <h2 className="text-3xl md:text-4xl font-extrabold text-theme-fg mb-4 leading-[1.1] tracking-tight transition-colors duration-300">
          {article.headline}
        </h2>

        <p className="text-theme-fg/80 text-base md:text-lg leading-relaxed mb-6 font-medium transition-colors duration-300">
          {article.description}
        </p>
      </div>

      <div className="mt-4">
        <a
          href={article.source_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => markAsRead(article.id)}
          className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-theme-fg group-hover:underline underline-offset-4 decoration-2 transition-colors duration-300"
        >
          Read Original Source
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </a>
      </div>
    </article>
  );
}
