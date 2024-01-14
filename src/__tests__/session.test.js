import {
  TOKEN_STORAGE_KEY,
  activeToken,
  clearToken,
  expiryOf,
  hasActiveSession,
  isExpired,
  readToken,
  writeToken,
} from "../auth/session";

const SECONDS_PER_MINUTE = 60;
const MILLISECONDS_PER_SECOND = 1000;

/** Build a token with the shape the API returns: "Bearer <header>.<payload>.<sig>". */
const tokenWithExpiry = (epochSeconds) => {
  const payload = window.btoa(JSON.stringify({ exp: epochSeconds, sub: "1" }));
  return `Bearer header.${payload.replace(/=+$/, "")}.signature`;
};

beforeEach(() => {
  window.localStorage.clear();
});

describe("token storage", () => {
  it("round-trips a token", () => {
    writeToken("Bearer abc");
    expect(readToken()).toBe("Bearer abc");
  });

  it("stores under a namespaced key rather than a bare 'token'", () => {
    writeToken("Bearer abc");
    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBe("Bearer abc");
    expect(window.localStorage.getItem("token")).toBeNull();
  });

  it("clears a token", () => {
    writeToken("Bearer abc");
    clearToken();
    expect(readToken()).toBeNull();
  });

  it("ignores an attempt to store nothing", () => {
    writeToken(null);
    expect(readToken()).toBeNull();
  });
});

describe("expiryOf", () => {
  it("reads the exp claim through the Bearer prefix", () => {
    const expiry = 1893456000;
    expect(expiryOf(tokenWithExpiry(expiry))).toBe(expiry * MILLISECONDS_PER_SECOND);
  });

  it("returns null for an opaque token with no JWT payload", () => {
    expect(expiryOf("Bearer demo.1")).toBeNull();
  });

  it("returns null for a payload that is not JSON", () => {
    expect(expiryOf("Bearer a.bm90LWpzb24.c")).toBeNull();
  });

  it("returns null for a non-string", () => {
    expect(expiryOf(undefined)).toBeNull();
  });
});

describe("isExpired", () => {
  const now = 1_700_000_000 * MILLISECONDS_PER_SECOND;

  it("rejects a token whose exp is in the past", () => {
    const past = 1_700_000_000 - 10 * SECONDS_PER_MINUTE;
    expect(isExpired(tokenWithExpiry(past), now)).toBe(true);
  });

  it("accepts a token with plenty of life left", () => {
    const future = 1_700_000_000 + 60 * SECONDS_PER_MINUTE;
    expect(isExpired(tokenWithExpiry(future), now)).toBe(false);
  });

  it("rejects a token inside the clock-skew window before its expiry", () => {
    const almostNow = 1_700_000_000 + 5;
    expect(isExpired(tokenWithExpiry(almostNow), now)).toBe(true);
  });

  it("treats an unreadable token as live, leaving the decision to the server", () => {
    expect(isExpired("Bearer demo.1", now)).toBe(false);
  });
});

describe("activeToken", () => {
  it("returns null and clears storage when the stored token has expired", () => {
    const past = Math.floor(Date.now() / MILLISECONDS_PER_SECOND) - 3600;
    writeToken(tokenWithExpiry(past));

    expect(activeToken()).toBeNull();
    expect(readToken()).toBeNull();
    expect(hasActiveSession()).toBe(false);
  });

  it("returns a live token", () => {
    const future = Math.floor(Date.now() / MILLISECONDS_PER_SECOND) + 3600;
    const token = tokenWithExpiry(future);
    writeToken(token);

    expect(activeToken()).toBe(token);
    expect(hasActiveSession()).toBe(true);
  });

  it("returns null when nothing is stored", () => {
    expect(activeToken()).toBeNull();
  });
});
