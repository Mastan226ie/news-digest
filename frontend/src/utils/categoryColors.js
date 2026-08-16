/**
 * Maps a news category name to a Tailwind-compatible text-color class.
 * @param {string} category
 * @returns {string}
 */
export function getCategoryColor(category) {
  const colorMap = {
    National: "text-blue-600 dark:text-blue-400",
    International: "text-purple-600 dark:text-purple-400",
    Business: "text-emerald-600 dark:text-emerald-400",
    Markets: "text-green-700 dark:text-green-400",
    Economy: "text-teal-600 dark:text-teal-400",
    Industry: "text-cyan-700 dark:text-cyan-400",
    Technology: "text-indigo-600 dark:text-indigo-400",
    Internet: "text-sky-600 dark:text-sky-400",
    Science: "text-violet-600 dark:text-violet-400",
    Agriculture: "text-lime-700 dark:text-lime-400",
    Health: "text-rose-600 dark:text-rose-400",
    Environment: "text-green-600 dark:text-green-400",
    Sports: "text-orange-600 dark:text-orange-400",
    States: "text-yellow-700 dark:text-yellow-400",
    Cities: "text-amber-600 dark:text-amber-400",
    "Andhra Pradesh": "text-red-600 dark:text-red-400",
    Opinion: "text-slate-600 dark:text-slate-400",
    Editorial: "text-gray-700 dark:text-gray-400",
    Books: "text-brown-600",
    Education: "text-fuchsia-600 dark:text-fuchsia-400",
    Elections: "text-red-700 dark:text-red-400",
    Commerce: "text-emerald-700 dark:text-emerald-400",
    Politics: "text-red-500 dark:text-red-400",
    Geopolitics: "text-purple-700 dark:text-purple-400",
  };
  return colorMap[category] || "text-theme-muted";
}
