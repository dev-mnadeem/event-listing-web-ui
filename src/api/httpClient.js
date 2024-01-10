import axios from "axios";
import config from "../config";
import { activeToken, clearToken } from "../auth/session";
import { toApiError } from "./apiError";

const HTTP_UNAUTHORIZED = 401;

/** Paths that must be called without a token, because they mint or burn one. */
const UNAUTHENTICATED_PATHS = ["/login", "/signup"];

const isUnauthenticatedPath = (url = "") =>
  UNAUTHENTICATED_PATHS.some((path) => url === path || url.startsWith(`${path}?`));

const httpClient = axios.create({
  baseURL: config.apiBaseUrl || "/",
});

/**
 * Attach the stored token to everything except login and signup.
 *
 * Logout deliberately *is* authenticated: the server revokes the presented
 * token by rotating the user's `jti`, so stripping the header here would make
 * every sign-out a 401 and leave the token valid until it expired on its own.
 */
httpClient.interceptors.request.use((requestConfig) => {
  if (isUnauthenticatedPath(requestConfig.url)) {
    return requestConfig;
  }

  const token = activeToken();
  if (token) {
    // The stored value already begins with "Bearer ". Prefixing it again
    // produces "Bearer Bearer …" and a silent 401.
    requestConfig.headers.Authorization = token;
  }
  return requestConfig;
});

/** Callbacks run when the server rejects our token, so the UI can react once. */
const sessionExpiryListeners = new Set();

export const onSessionExpired = (listener) => {
  sessionExpiryListeners.add(listener);
  return () => sessionExpiryListeners.delete(listener);
};

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === HTTP_UNAUTHORIZED && !isUnauthenticatedPath(error.config?.url)) {
      clearToken();
      sessionExpiryListeners.forEach((listener) => listener());
    }
    return Promise.reject(toApiError(error));
  },
);

export default httpClient;
