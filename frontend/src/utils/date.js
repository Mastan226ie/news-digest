/**
 * Returns a YYYY-MM-DD date string in the user's LOCAL timezone.
 * @param {Date} date
 * @returns {string}
 */
export function getLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Formats a YYYY-MM-DD string or Date into a human-readable string using the
 * user's local timezone (Intl.DateTimeFormat).
 * @param {string|Date} date
 * @param {Intl.DateTimeFormatOptions} [options]
 * @returns {string}
 */
export function formatLocalDate(date, options = { month: "short", day: "numeric", year: "numeric" }) {
  const d = typeof date === "string" ? new Date(date + "T00:00:00") : date;
  return new Intl.DateTimeFormat("en-US", options).format(d);
}
