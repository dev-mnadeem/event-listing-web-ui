import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "../context/SessionContext";

/**
 * Gate for the signed-in pages.
 *
 * Redirecting from a route element rather than from an effect in `App` means
 * the protected page never renders a frame before the redirect, which is what
 * produced a flash of empty lists followed by three failed requests.
 */
const RequireAuth = ({ children }) => {
  const { isAuthenticated } = useSession();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
};

export default RequireAuth;
