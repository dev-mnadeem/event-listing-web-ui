import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => (
  <div className="shell notfound">
    <p className="notfound__code">404</p>
    <h1>No page at this address</h1>
    <p className="state-panel__body" style={{ margin: "10px auto 22px" }}>
      The link may be out of date, or the event it pointed at may have been deleted.
    </p>
    <Link to="/" className="btn btn--primary">
      Back to events
    </Link>
  </div>
);

export default NotFound;
