import React from "react";
import config from "../config";
import { isDemoMode } from "../api";

const Footer = () => (
  <footer className="site-footer">
    <div className="shell">
      <div className="site-footer__grid">
        <div>
          <h2 className="site-footer__title">Events</h2>
          <p className="site-footer__text">
            A React client for the event_management_app_BE Rails API. Organize events, book a
            place at someone else&rsquo;s, and see what is coming up.
          </p>
        </div>

        <div>
          <h3 className="site-footer__heading">Pages</h3>
          <ul className="site-footer__list">
            <li>
              <a href="/">Events</a>
            </li>
            <li>
              <a href="/login">Sign in</a>
            </li>
            <li>
              <a href="/signup">Create an account</a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="site-footer__heading">Data source</h3>
          <ul className="site-footer__list">
            <li>{isDemoMode ? "Local demo fixtures" : "Live API"}</li>
            <li>
              <code>{isDemoMode ? "REACT_APP_DEMO=true" : config.apiBaseUrl}</code>
            </li>
            <li>{config.pageSize} events per page</li>
          </ul>
        </div>
      </div>

      <div className="site-footer__baseline">
        Event listing web UI &mdash; a portfolio project.
      </div>
    </div>
  </footer>
);

export default Footer;
