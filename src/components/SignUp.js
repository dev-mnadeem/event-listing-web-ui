import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as backend from "../api";
import { useToast } from "../context/ToastContext";

const MIN_PASSWORD_LENGTH = 6;

const SignUp = () => {
  const navigate = useNavigate();
  const { notifySuccess } = useToast();
  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirmation: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) =>
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));

  /** Checks worth doing before spending a round trip. The server repeats them. */
  const localErrors = () => {
    const errors = {};
    if (values.password.length < MIN_PASSWORD_LENGTH) {
      errors.password = [`must be at least ${MIN_PASSWORD_LENGTH} characters`];
    }
    if (values.password !== values.passwordConfirmation) {
      errors.password_confirmation = ["does not match the password"];
    }
    return errors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);

    const errors = localErrors();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    setFieldErrors({});

    try {
      await backend.signUp(values);
      notifySuccess("Account created. Sign in to continue.");
      navigate("/login", { replace: true });
    } catch (caught) {
      setFieldErrors(caught.fieldErrors ?? {});
      setFormError(Object.keys(caught.fieldErrors ?? {}).length > 0 ? null : caught.message);
      setSubmitting(false);
    }
  };

  const field = (id, label, name, type, autoComplete) => {
    const error = fieldErrors[name === "passwordConfirmation" ? "password_confirmation" : name];
    return (
      <div className={`field${error ? " field--invalid" : ""}`}>
        <label className="field__label" htmlFor={id}>
          {label}
        </label>
        <input
          id={id}
          className="field__control"
          type={type}
          name={name}
          autoComplete={autoComplete}
          value={values[name]}
          onChange={handleChange}
          required
        />
        {error ? <span className="field__error">{error.join(", ")}</span> : null}
      </div>
    );
  };

  return (
    <div className="auth-page">
      <div className="panel">
        <h1 className="panel__title">Create an account</h1>
        <p className="panel__lede">Organize your own events, and book a place at others.</p>

        {formError ? <div className="callout callout--warning">{formError}</div> : null}

        <form onSubmit={handleSubmit} noValidate>
          {field("signup-name", "Name", "name", "text", "name")}
          {field("signup-email", "Email", "email", "email", "email")}
          {field("signup-password", "Password", "password", "password", "new-password")}
          {field(
            "signup-password-confirmation",
            "Confirm password",
            "passwordConfirmation",
            "password",
            "new-password",
          )}

          <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
            {submitting ? "Creating…" : "Create account"}
          </button>
        </form>

        <p className="form-note">
          Already have an account? <Link to="/login">Sign in</Link>.
        </p>
      </div>
    </div>
  );
};

export default SignUp;
