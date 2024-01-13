import React from "react";
import EventCard from "./EventCard";
import Pagination from "./Pagination";
import StatePanel from "./StatePanel";

const SKELETON_COUNT = 4;

/**
 * One titled, paginated grid of events.
 *
 * The three home-page lists were three near-identical components that differed
 * only in the endpoint they called and the sentence they showed when empty.
 * They are now three calls to this one, with the fetching supplied by
 * `useEventCollection`.
 */
const EventSection = ({
  id,
  title,
  subtitle,
  accent = "accent",
  collection,
  emptyTitle,
  emptyBody,
  emptyAction = null,
  flag,
  onEdit,
  onDelete,
  onJoin,
  busyEventId = null,
  sunken = false,
}) => {
  const { events, total, page, pageCount, loading, error, goToPage } = collection;

  return (
    // aria-labelledby gives the <section> the "region" role, so each list is a
    // landmark a keyboard or screen-reader user can jump between.
    <section
      className={`section${sunken ? " section--sunken" : ""}`}
      id={id}
      aria-labelledby={`${id}-title`}
    >
      <div className="shell">
        <header className="section__head">
          <div>
            <h2 className="section__title" id={`${id}-title`}>
              <span className={`section__rule section__rule--${accent}`} aria-hidden="true" />
              {title}
            </h2>
            {subtitle ? <p className="section__subtitle">{subtitle}</p> : null}
          </div>
          {!loading && !error && total > 0 ? (
            <span className="section__count">
              {total} {total === 1 ? "event" : "events"}
            </span>
          ) : null}
        </header>

        <div className="card-grid">
          {loading
            ? Array.from({ length: SKELETON_COUNT }, (unused, index) => (
                <div key={index} className="skeleton-card" aria-hidden="true" />
              ))
            : null}

          {!loading && error ? (
            <StatePanel
              variant="error"
              title="This list could not be loaded"
              body={error.message}
            />
          ) : null}

          {!loading && !error && events.length === 0 ? (
            <StatePanel title={emptyTitle} body={emptyBody} action={emptyAction} />
          ) : null}

          {!loading && !error
            ? events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  flag={flag}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onJoin={onJoin}
                  busy={busyEventId === event.id}
                />
              ))
            : null}
        </div>

        <Pagination
          page={page}
          pageCount={pageCount}
          onChange={goToPage}
          label={`${title} pagination`}
        />
      </div>
    </section>
  );
};

export default EventSection;
