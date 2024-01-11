import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as backend from "../api";
import { onSessionExpired } from "../api/httpClient";
import { activeToken, clearToken, writeToken } from "../auth/session";

const SessionContext = createContext(null);

/**
 * Who is signed in, and whether the token we hold is worth using.
 *
 * `isAuthenticated` is derived from a token that is present *and* not past its
 * `exp` claim. Deriving it from mere presence is what made an expired token
 * render the full signed-in page and then fail every request on it.
 */
export const SessionProvider = ({ children }) => {
  const [token, setToken] = useState(() => activeToken());
  const [user, setUser] = useState(null);
  const [expiryNotice, setExpiryNotice] = useState(false);

  // In demo mode the fixture backend needs to know which seeded user a stored
  // token belongs to after a reload. Against the real API this is a no-op.
  useEffect(() => {
    if (token) setUser(backend.adoptStoredToken(token));
  }, [token]);

  // A 401 from any request means the server rejected the token, whatever its
  // `exp` said. Sign out once, centrally, rather than in every catch block.
  useEffect(
    () =>
      onSessionExpired(() => {
        setToken(null);
        setUser(null);
        setExpiryNotice(true);
      }),
    [],
  );

  const signIn = useCallback(async (credentials) => {
    const result = await backend.signIn(credentials);
    writeToken(result.token);
    setToken(result.token);
    setUser(result.user);
    setExpiryNotice(false);
    return result;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await backend.signOut();
    } finally {
      // Whether or not the server accepted the revocation, this browser is done
      // with the token.
      clearToken();
      setToken(null);
      setUser(null);
    }
  }, []);

  const dismissExpiryNotice = useCallback(() => setExpiryNotice(false), []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: token !== null,
      expiryNotice,
      dismissExpiryNotice,
      signIn,
      signOut,
    }),
    [user, token, expiryNotice, dismissExpiryNotice, signIn, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};

export default SessionContext;
