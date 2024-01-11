import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

const DEFAULT_DURATION_MS = 4500;

let nextToastId = 0;

/**
 * Transient success and failure messages.
 *
 * This replaces `react-notifications`, which renders through APIs React 18
 * removed. Four functions and a list of strings is the whole requirement.
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (variant, message, duration = DEFAULT_DURATION_MS) => {
      if (!message) return;
      nextToastId += 1;
      const id = nextToastId;
      setToasts((current) => [...current, { id, variant, message }]);
      setTimeout(() => dismiss(id), duration);
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({
      toasts,
      dismiss,
      notifySuccess: (message) => push("success", message),
      notifyError: (message) => push("error", message),
      notifyInfo: (message) => push("info", message),
    }),
    [toasts, dismiss, push],
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export default ToastContext;
