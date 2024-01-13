import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import { useToast } from "../context/ToastContext";

const SignOut = () => {
  const navigate = useNavigate();
  const { signOut } = useSession();
  const { notifySuccess } = useToast();
  const [busy, setBusy] = useState(false);

  const handleSignOut = async () => {
    setBusy(true);
    // `signOut` clears the local token whether or not the server accepted the
    // revocation, so there is no failure path that should keep the user here.
    await signOut();
    notifySuccess("Signed out.");
    // Last: the redirect takes this button off screen.
    navigate("/login", { replace: true });
  };

  return (
    <button type="button" className="topbar__link" onClick={handleSignOut} disabled={busy}>
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
};

export default SignOut;
