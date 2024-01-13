import React, { useState } from "react";
import DatePicker from "react-datepicker";
import { toApiDate } from "../lib/dates";
import "react-datepicker/dist/react-datepicker.css";

const EMPTY_EVENT = { name: "", description: "", location: "", date: new Date() };

const Field = ({ id, label, error, children }) => (
  <div className={`field${error ? " field--invalid" : ""}`}>
    <label className="field__label" htmlFor={id}>
      {label}
    </label>
    {children}
    {error ? (
      <span className="field__error" id={`${id}-error`}>
        {error}
      </span>
    ) : null}
  </div>
);

/**
 * Create or edit an event.
 *
 * `onSubmit` is expected to reject with an `ApiError`. A 422 carries
 * `fieldErrors` keyed by the server's own column names, which map one to one
 * onto the inputs below, so validation failures land on the field that caused
 * them instead of in a generic toast.
 */
const EventForm = ({ event, onSubmit, onCancel, submitLabel }) => {
  const initial = event ?? EMPTY_EVENT;
  const [values, setValues] = useState({
    name: initial.name ?? "",
    description: initial.description ?? "",
    location: initial.location ?? "",
    date: new Date(initial.date ?? Date.now()),
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  const setValue = (name, value) => setValues((current) => ({ ...current, [name]: value }));

  const handleChange = (changeEvent) =>
    setValue(changeEvent.target.name, changeEvent.target.value);

  const handleSubmit = async (submitEvent) => {
    submitEvent.preventDefault();
    setSaving(true);
    setFieldErrors({});
    setFormError(null);

    try {
      await onSubmit({
        name: values.name.trim(),
        description: values.description.trim(),
        location: values.location.trim(),
        date: toApiDate(values.date),
      });
    } catch (error) {
      setFieldErrors(error.fieldErrors ?? {});
      // A 422 already puts its detail next to each field, so repeating the
      // flattened version above the form would say the same thing twice.
      setFormError(Object.keys(error.fieldErrors ?? {}).length > 0 ? null : error.message);
    } finally {
      setSaving(false);
    }
  };

  const errorFor = (field) => fieldErrors[field]?.join(", ");

  return (
    <form onSubmit={handleSubmit} noValidate>
      {formError ? <div className="callout callout--warning">{formError}</div> : null}

      <Field id="event-name" label="Event name" error={errorFor("name")}>
        <input
          id="event-name"
          className="field__control"
          name="name"
          value={values.name}
          onChange={handleChange}
          placeholder="Zero Downtime Migrations"
          required
        />
      </Field>

      <Field id="event-date" label="Date and time" error={errorFor("date")}>
        <DatePicker
          id="event-date"
          selected={values.date}
          onChange={(date) => setValue("date", date ?? new Date())}
          showTimeSelect
          dateFormat="d MMMM yyyy, HH:mm"
          timeFormat="HH:mm"
          className="field__control"
        />
      </Field>

      <Field id="event-location" label="Location" error={errorFor("location")}>
        <input
          id="event-location"
          className="field__control"
          name="location"
          value={values.location}
          onChange={handleChange}
          placeholder="York"
          required
        />
      </Field>

      <Field id="event-description" label="Description" error={errorFor("description")}>
        <textarea
          id="event-description"
          className="field__control"
          name="description"
          rows={4}
          value={values.description}
          onChange={handleChange}
          placeholder="What will happen, and who it is for."
          required
        />
      </Field>

      <div className="modal-card__actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default EventForm;
