import React from "react";
import { Link } from "react-router-dom";
import { FiMapPin, FiClock } from "react-icons/fi";
import { bannerStyle } from "../lib/banner";
import { dateChipParts, formatShortDate, formatTime, isPast } from "../lib/dates";

/**
 * One event, in whichever of the three lists it belongs to.
 *
 * The card is presentation only: it takes the actions it offers as callbacks so
 * the same component serves the organized, booked and joinable lists without
 * knowing which endpoint produced it.
 */
const EventCard = ({ event, flag, onEdit, onDelete, onJoin, busy = false }) => {
  const chip = dateChipParts(event.date);
  const past = isPast(event.date);

  return (
    <article className="event-card">
      <div className="event-card__banner" style={bannerStyle(event.id)}>
        <div className="event-card__date-chip">
          <span className="event-card__date-month">{chip.month}</span>
          <span className="event-card__date-day">{chip.day}</span>
        </div>
        {flag ? <span className="event-card__flag">{past ? "Finished" : flag}</span> : null}
      </div>

      <div className="event-card__body">
        <h3 className="event-card__title">
          <Link to={`/events/${event.id}`} className="event-card__link">
            {event.name}
          </Link>
        </h3>

        <p className="event-card__meta">
          <FiClock aria-hidden="true" />
          <span>
            {formatShortDate(event.date)} at {formatTime(event.date)}
          </span>
        </p>
        <p className="event-card__meta">
          <FiMapPin aria-hidden="true" />
          <span>{event.location}</span>
        </p>

        <p className="event-card__description">{event.description}</p>

        <div className="event-card__actions">
          {onEdit ? (
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => onEdit(event)}
            >
              Edit
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              className="btn btn--danger btn--sm"
              onClick={() => onDelete(event)}
            >
              Delete
            </button>
          ) : null}
          {onJoin ? (
            <button
              type="button"
              className="btn btn--primary btn--sm btn--block"
              onClick={() => onJoin(event)}
              disabled={busy}
            >
              {busy ? "Booking…" : "Book a place"}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
};

export default EventCard;
