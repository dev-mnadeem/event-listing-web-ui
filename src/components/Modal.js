import React, { useEffect } from "react";

/**
 * A dialog that closes on Escape and on a backdrop click.
 *
 * react-bootstrap's Modal would do this too, but the rest of the interface no
 * longer uses Bootstrap components and pulling one back in for a single overlay
 * is not worth the inconsistency.
 */
const Modal = ({ title, onClose, children }) => {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="modal-backdrop-custom"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal-card" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-card__head">
          <h2 className="modal-card__title">{title}</h2>
          <button
            type="button"
            className="modal-card__close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;
