import React, { useState } from "react";
import Modal from "./Modal";
import useIsMounted from "../hooks/useIsMounted";

/** A yes/no dialog that keeps the confirm button disabled while the call runs. */
const ConfirmDialog = ({
  title,
  body,
  confirmLabel,
  destructive = false,
  onConfirm,
  onCancel,
}) => {
  const [busy, setBusy] = useState(false);
  const isMounted = useIsMounted();

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      // A successful confirm usually unmounts this dialog, so re-enabling the
      // button is only meaningful when it is still on screen.
      if (isMounted()) setBusy(false);
    }
  };

  return (
    <Modal title={title} onClose={onCancel}>
      <p className="state-panel__body" style={{ maxWidth: "none" }}>
        {body}
      </p>
      <div className="modal-card__actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button
          type="button"
          className={destructive ? "btn btn--danger" : "btn btn--primary"}
          onClick={handleConfirm}
          disabled={busy}
        >
          {busy ? "Working…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
