import React from "react";

/** The empty, error and "nothing here yet" panel used by every list section. */
const StatePanel = ({ title, body, variant = "empty", action = null }) => (
  <div className={`state-panel${variant === "error" ? " state-panel--error" : ""}`}>
    <p className="state-panel__title">{title}</p>
    {body ? <p className="state-panel__body">{body}</p> : null}
    {action}
  </div>
);

export default StatePanel;
