import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import { useToast } from "../context/ToastContext";
import { demoCredentials, isDemoMode } from "../api";

const SignIn = () => {
  const navigate = useNavigate();
  const { signIn, expiryNotice, dismissExpiryNotice } = useSession();
  const { notifySuccess } = useToast();

  // In demo mode the seeded credentials are prefilled, because a sign-in form
  // with no way to get past it is the worst possible first screen.
  const [values, setValues] = useState({
    email: demoCredentials?.email ?? "",
    password: demoCredentials?.password ?? "",
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) =>
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    dismissExpiryNotice();

    try {
      await signIn(values);
      // Nothing may set state after this: the redirect replaces this component.
      notifySuccess("Signed in.");
      navigate("/", { replace: true });
    } catch (caught) {
      setError(caught.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="panel">
        <h1 className="panel__title">Sign in</h1>
        <p className="panel__lede">Your events, your bookings, and what is coming up.</p>

        {expiryNotice ? (
          <div className="callout callout--warning">
            Your session expired. Sign in again to pick up where you left off.
          </div>
        ) : null}

        {isDemoMode ? (
          <div className="callout">
            Demo mode. Any seeded address works with the password{" "}
            <code>{demoCredentials.password}</code> — no API needed.
          </div>
        ) : null}

        {error ? <div className="callout callout--warning">{error}</div> : null}

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label className="field__label" htmlFor="signin-email">
              Email
            </label>
            <input
              id="signin-email"
              className="field__control"
              type="email"
              name="email"
              autoComplete="username"
              value={values.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="signin-password">
              Password
            </label>
            <input
              id="signin-password"
              className="field__control"
              type="password"
              name="password"
              autoComplete="current-password"
              value={values.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="form-note">
          No account yet? <Link to="/signup">Create one</Link>.
        </p>
      </div>
    </div>
  );
};

export default SignIn;
