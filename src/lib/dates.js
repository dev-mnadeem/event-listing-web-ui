/**
 * Date presentation. The API sends ISO 8601 in UTC and the browser renders in
 * local time, so every conversion happens here rather than inline in JSX.
 */

const LOCALE = undefined; // Use the browser's locale.

export const parseEventDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatFullDate = (value) => {
  const date = parseEventDate(value);
  if (!date) return "Date to be confirmed";
  return date.toLocaleDateString(LOCALE, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export const formatTime = (value) => {
  const date = parseEventDate(value);
  if (!date) return "";
  return date.toLocaleTimeString(LOCALE, { hour: "2-digit", minute: "2-digit" });
};

export const formatShortDate = (value) => {
  const date = parseEventDate(value);
  if (!date) return "TBC";
  return date.toLocaleDateString(LOCALE, { day: "numeric", month: "short" });
};

/** `{ month: "NOV", day: "02" }` for the date chip on a card. */
export const dateChipParts = (value) => {
  const date = parseEventDate(value);
  if (!date) return { month: "TBC", day: "--" };
  return {
    month: date.toLocaleDateString(LOCALE, { month: "short" }).toUpperCase(),
    day: String(date.getDate()),
  };
};

export const isPast = (value, now = Date.now()) => {
  const date = parseEventDate(value);
  return date !== null && date.getTime() < now;
};

/** ISO 8601 with a time component, which is what the API stores. */
export const toApiDate = (value) => {
  const date = value instanceof Date ? value : parseEventDate(value);
  return (date ?? new Date()).toISOString();
};
