/**
 * Where the JWT lives, and how we decide it is still worth sending.
 *
 * The API returns the token in the `Authorization` *response header* of
 * `POST /login`, already carrying the `Bearer ` prefix. It is stored and sent
 * back byte for byte — do not add a second `Bearer `.
 */

const TOKEN_KEY = "event-app.token";
const MILLISECONDS_PER_SECOND = 1000;

/** Treat a token as dead this long before its real expiry, to avoid a race. */
const EXPIRY_SKEW_MS = 30 * MILLISECONDS_PER_SECOND;

const safeStorage = () => {
  try {
    return window.localStorage;
  } catch {
    // Safari in private mode throws on access rather than on write.
    return null;
  }
};

export const readToken = () => {
  const storage = safeStorage();
  if (!storage) return null;
  return storage.getItem(TOKEN_KEY);
};

export const writeToken = (token) => {
  const storage = safeStorage();
  if (!storage || !token) return;
  storage.setItem(TOKEN_KEY, token);
};

export const clearToken = () => {
  const storage = safeStorage();
  if (!storage) return;
  storage.removeItem(TOKEN_KEY);
};

const base64UrlDecode = (segment) => {
  const padded = segment.replace(/-/g, "+").replace(/_/g, "/");
  return window.atob(padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), "="));
};

/**
 * Read the `exp` claim without verifying the signature. The server is still the
 * authority — this only stops the client rendering three list sections that are
 * all guaranteed to 401.
 *
 * @returns {number|null} expiry in epoch milliseconds, or null if unreadable
 */
export const expiryOf = (token) => {
  if (typeof token !== "string") return null;
  const payload = token.replace(/^Bearer\s+/i, "").split(".")[1];
  if (!payload) return null;

  try {
    const claims = JSON.parse(base64UrlDecode(payload));
    if (typeof claims.exp !== "number") return null;
    return claims.exp * MILLISECONDS_PER_SECOND;
  } catch {
    return null;
  }
};

/**
 * An opaque or unparseable token is treated as live: only a token that says
 * outright that it has expired is rejected here.
 */
export const isExpired = (token, now = Date.now()) => {
  const expiry = expiryOf(token);
  if (expiry === null) return false;
  return expiry - EXPIRY_SKEW_MS <= now;
};

/** The token to send, or null if there is nothing usable. Clears a dead one. */
export const activeToken = () => {
  const token = readToken();
  if (!token) return null;
  if (isExpired(token)) {
    clearToken();
    return null;
  }
  return token;
};

export const hasActiveSession = () => activeToken() !== null;

export const TOKEN_STORAGE_KEY = TOKEN_KEY;
