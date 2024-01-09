/**
 * Every environment-dependent value the client reads, in one place.
 *
 * Create React App only exposes variables prefixed `REACT_APP_`, and it inlines
 * them at build time, so nothing here can be changed after `npm run build`
 * without rebuilding. Anything read outside this module is a bug.
 */

/** The API answers `per_page` up to 100 and defaults to 50 (see the API contract). */
export const MAX_PAGE_SIZE = 100;

/** How many cards a list section shows before it offers a next page. */
const DEFAULT_PAGE_SIZE = 8;

/** Simulated round-trip in demo mode. Long enough to see, short enough not to annoy. */
const DEMO_LATENCY_MS = 180;

const toPositiveInt = (raw, fallback) => {
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, MAX_PAGE_SIZE);
};

const toBoolean = (raw, fallback) => {
  if (raw === undefined || raw === "") return fallback;
  return raw === "true" || raw === "1";
};

const apiBaseUrl = (process.env.REACT_APP_API_BASE_URL || "").replace(/\/+$/, "");

/**
 * Demo mode is the default when no API base URL is configured, so a fresh
 * clone renders something instead of three error toasts over three empty lists.
 * Setting REACT_APP_API_BASE_URL is what turns the real client on.
 */
const demoMode = toBoolean(process.env.REACT_APP_DEMO, apiBaseUrl === "");

const config = {
  apiBaseUrl,
  demoMode,
  pageSize: toPositiveInt(process.env.REACT_APP_PAGE_SIZE, DEFAULT_PAGE_SIZE),
  /** Simulated latency in demo mode, so the loading skeletons are actually reachable. */
  demoLatencyMs: DEMO_LATENCY_MS,
};

export default config;
