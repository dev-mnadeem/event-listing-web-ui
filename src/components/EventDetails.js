import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import * as backend from "../api";
import StatePanel from "./StatePanel";
import { formatFullDate, formatTime, isPast } from "../lib/dates";

/**
 * A single event.
 *
 * The id comes from the route parameter rather than from parsing
 * `window.location.pathname`, so the page also works when it is reached by an
 * in-app link instead of a full page load.
 */
const EventDetails = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError(null);

    backend
      .getEvent(id)
      .then((result) => {
        if (current) setEvent(result);
      })
      .catch((caught) => {
        if (current) setError(caught);
      })
      .finally(() => {
        if (current) setLoading(false);
      });

    return () => {
      current = false;
    };
  }, [id]);

  if (loading) {
    return (
      <section className="section">
        <div className="shell">
          <div className="skeleton-card" style={{ height: 220 }} aria-label="Loading event" />
        </div>
      </section>
    );
  }

  if (error || !event) {
    return (
      <section className="section">
        <div className="shell">
          <StatePanel
            variant="error"
            title="That event could not be shown"
            body={error?.message ?? "The event is no longer available."}
            action={
              <Link to="/" className="btn btn--ghost btn--sm">
                Back to events
              </Link>
            }
          />
        </div>
      </section>
    );
  }

  return (
    <article>
      <div className="detail-hero">
        <div className="shell">
          <Link to="/" className="detail-back">
            &larr; All events
          </Link>
          <h1 className="detail-hero__title">{event.name}</h1>

          <div className="detail-facts">
            <div className="detail-fact">
              <div className="detail-fact__label">Date</div>
              <div className="detail-fact__value">{formatFullDate(event.date)}</div>
            </div>
            <div className="detail-fact">
              <div className="detail-fact__label">Starts</div>
              <div className="detail-fact__value">{formatTime(event.date)}</div>
            </div>
            <div className="detail-fact">
              <div className="detail-fact__label">Location</div>
              <div className="detail-fact__value">{event.location}</div>
            </div>
            <div className="detail-fact">
              <div className="detail-fact__label">Status</div>
              <div className="detail-fact__value">
                {isPast(event.date) ? "Finished" : "Upcoming"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="section">
        <div className="shell detail-body">
          <div>
            <h2 className="section__title">About this event</h2>
            <p className="detail-body__text">{event.description}</p>
          </div>

          <aside className="detail-aside">
            <h3 className="detail-aside__title">At a glance</h3>
            <dl className="detail-aside__list">
              <div>
                <dt>Event</dt>
                <dd>#{event.id}</dd>
              </div>
              <div>
                <dt>Organizer</dt>
                <dd>User #{event.organizer_id}</dd>
              </div>
              <div>
                <dt>Starts</dt>
                <dd>
                  {formatFullDate(event.date)}, {formatTime(event.date)}
                </dd>
              </div>
            </dl>
            <p className="detail-aside__note">
              These are every field the API returns for an event: id, name, description, date,
              location and organizer_id.
            </p>
            <Link to="/" className="btn btn--ghost btn--block">
              Back to all events
            </Link>
          </aside>
        </div>
      </section>
    </article>
  );
};

export default EventDetails;
