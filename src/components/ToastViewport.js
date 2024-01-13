import React from "react";
import { useToast } from "../context/ToastContext";

/**
 * Renders the queued toasts. `role="status"` with `aria-live="polite"` is what
 * makes a success or failure message reach a screen reader at all.
 */
const ToastViewport = () => {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-viewport" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.variant}`}>
          <span className="toast__message">{toast.message}</span>
          <button
            type="button"
            className="toast__close"
            onClick={() => dismiss(toast.id)}
            aria-label="Dismiss notification"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastViewport;
