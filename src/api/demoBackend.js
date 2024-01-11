import config from "../config";
import { buildSeed, DEMO_USER, DEMO_USERS, DEMO_PASSWORD } from "./demoSeed";
import {
  ApiError,
  CONFLICT,
  FORBIDDEN,
  NOT_FOUND,
  UNAUTHENTICATED,
  VALIDATION,
} from "./apiError";

/**
 * An in-memory stand-in for event_management_app_BE.
 *
 * It exports the same functions as `liveBackend`, enforces the same three
 * refusals the real API enforces (organizer-only writes, no booking your own
 * event, no booking twice) and paginates the same way, so switching between the
 * two changes no component. It is not a mock of the HTTP layer — it replaces
 * it — which is why a fresh clone runs with nothing else installed.
 */

const STATE_KEY = "event-app.demo-state";
const DEMO_TOKEN_PREFIX = "Bearer demo.";

const HTTP_FORBIDDEN = 403;
const HTTP_NOT_FOUND = 404;
const HTTP_UNPROCESSABLE = 422;
const HTTP_UNAUTHORIZED = 401;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const latency = () => sleep(config.demoLatencyMs);

const loadState = () => {
  try {
    const stored = window.localStorage.getItem(STATE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // Unreadable or unparseable storage just means we start from the seed.
  }
  return buildSeed();
};

const saveState = (state) => {
  try {
    window.localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {
    // A full or blocked storage should not break the page.
  }
};

let state = null;

const currentState = () => {
  if (state === null) state = loadState();
  return state;
};

const commit = (next) => {
  state = next;
  saveState(state);
  return state;
};

/** Discard any demo edits and go back to the seeded data. */
export const resetDemoData = () => commit(buildSeed());

const nextId = (rows) => rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;

// --- session --------------------------------------------------------------

/**
 * A demo token is not a JWT. It carries no `exp`, which `session.isExpired`
 * treats as "unknown, assume live" — the deliberate behaviour for opaque
 * tokens.
 */
const tokenFor = (user) => `${DEMO_TOKEN_PREFIX}${user.id}`;

const userFromToken = (token) => {
  if (typeof token !== "string" || !token.startsWith(DEMO_TOKEN_PREFIX)) return null;
  const id = Number.parseInt(token.slice(DEMO_TOKEN_PREFIX.length), 10);
  return currentState().users.find((user) => user.id === id) ?? null;
};

let signedInUserId = null;

const requireUser = () => {
  const user = currentState().users.find((candidate) => candidate.id === signedInUserId);
  if (!user) {
    throw new ApiError("Your session has ended. Please sign in again.", {
      kind: UNAUTHENTICATED,
      status: HTTP_UNAUTHORIZED,
    });
  }
  return user;
};

/** Re-establish the demo session from a stored token after a page reload. */
export const adoptToken = (token) => {
  const user = userFromToken(token);
  signedInUserId = user ? user.id : null;
  return user;
};

/** The credentials the sign-in form offers in demo mode. */
export const demoCredentials = { email: DEMO_USER.email, password: DEMO_PASSWORD };

export const signUp = async ({ email, name }) => {
  await latency();
  const existing = currentState().users.find((user) => user.email === email);
  if (existing) {
    throw new ApiError("Email has already been taken", {
      kind: VALIDATION,
      status: HTTP_UNPROCESSABLE,
      fieldErrors: { email: ["has already been taken"] },
    });
  }

  const users = currentState().users;
  const user = { id: nextId(users), name, email };
  commit({ ...currentState(), users: [...users, user] });
  return user;
};

export const signIn = async ({ email, password }) => {
  await latency();
  const user = currentState().users.find((candidate) => candidate.email === email);
  if (!user || password !== DEMO_PASSWORD) {
    throw new ApiError(
      `Invalid email or password. In demo mode any seeded address works with the password "${DEMO_PASSWORD}".`,
      { kind: UNAUTHENTICATED, status: HTTP_UNAUTHORIZED },
    );
  }
  signedInUserId = user.id;
  return { token: tokenFor(user), user };
};

export const signOut = async () => {
  await latency();
  signedInUserId = null;
};

// --- events ---------------------------------------------------------------

const byDateAscending = (a, b) => new Date(a.date) - new Date(b.date);

const paginate = (rows, { page, perPage }) => ({
  items: rows.slice((page - 1) * perPage, page * perPage),
  total: rows.length,
  page,
  perPage,
});

const bookedEventIds = (userId) =>
  new Set(
    currentState()
      .bookings.filter((booking) => booking.user_id === userId)
      .map((booking) => booking.event_id),
  );

export const listOrganizedEvents = async (pagination) => {
  await latency();
  const user = requireUser();
  const rows = currentState()
    .events.filter((event) => event.organizer_id === user.id)
    .sort(byDateAscending);
  return paginate(rows, pagination);
};

export const listJoinedEvents = async (pagination) => {
  await latency();
  const user = requireUser();
  const booked = bookedEventIds(user.id);
  const rows = currentState()
    .events.filter((event) => booked.has(event.id))
    .sort(byDateAscending);
  return paginate(rows, pagination);
};

/** Upcoming events on neither edge — the server's `get_events`, reproduced. */
export const listJoinableEvents = async (pagination) => {
  await latency();
  const user = requireUser();
  const booked = bookedEventIds(user.id);
  const now = Date.now();
  const rows = currentState()
    .events.filter(
      (event) =>
        event.organizer_id !== user.id &&
        !booked.has(event.id) &&
        new Date(event.date).getTime() > now,
    )
    .sort(byDateAscending);
  return paginate(rows, pagination);
};

const findEvent = (id) => {
  const event = currentState().events.find((candidate) => candidate.id === Number(id));
  if (!event) {
    throw new ApiError("Event not found", { kind: NOT_FOUND, status: HTTP_NOT_FOUND });
  }
  return event;
};

export const getEvent = async (id) => {
  await latency();
  requireUser();
  return { ...findEvent(id) };
};

const validate = (attributes) => {
  const fieldErrors = {};
  ["name", "description", "location"].forEach((field) => {
    if (!attributes[field] || String(attributes[field]).trim() === "") {
      fieldErrors[field] = ["can't be blank"];
    }
  });
  if (Object.keys(fieldErrors).length > 0) {
    throw new ApiError("Please fill in every field.", {
      kind: VALIDATION,
      status: HTTP_UNPROCESSABLE,
      fieldErrors,
    });
  }
};

export const createEvent = async (attributes) => {
  await latency();
  const user = requireUser();
  validate(attributes);

  const events = currentState().events;
  // organizer_id from the caller is ignored, exactly as the API ignores it.
  const event = {
    id: nextId(events),
    name: attributes.name,
    description: attributes.description,
    location: attributes.location,
    date: new Date(attributes.date).toISOString(),
    organizer_id: user.id,
  };
  commit({ ...currentState(), events: [...events, event] });
  return event;
};

const requireOrganizer = (event, user) => {
  if (event.organizer_id !== user.id) {
    throw new ApiError("You are not the organizer of this event.", {
      kind: FORBIDDEN,
      status: HTTP_FORBIDDEN,
    });
  }
};

export const updateEvent = async (id, attributes) => {
  await latency();
  const user = requireUser();
  const event = findEvent(id);
  requireOrganizer(event, user);
  validate(attributes);

  const updated = {
    ...event,
    name: attributes.name,
    description: attributes.description,
    location: attributes.location,
    date: new Date(attributes.date).toISOString(),
  };
  commit({
    ...currentState(),
    events: currentState().events.map((row) => (row.id === updated.id ? updated : row)),
  });
  return updated;
};

export const deleteEvent = async (id) => {
  await latency();
  const user = requireUser();
  const event = findEvent(id);
  requireOrganizer(event, user);

  commit({
    ...currentState(),
    events: currentState().events.filter((row) => row.id !== event.id),
    bookings: currentState().bookings.filter((row) => row.event_id !== event.id),
  });
};

export const joinEvent = async (eventId) => {
  await latency();
  const user = requireUser();
  const event = findEvent(eventId);

  if (event.organizer_id === user.id) {
    throw new ApiError("You organize this event, so you cannot book a place at it.", {
      kind: FORBIDDEN,
      status: HTTP_FORBIDDEN,
    });
  }

  const bookings = currentState().bookings;
  const alreadyBooked = bookings.some(
    (booking) => booking.user_id === user.id && booking.event_id === event.id,
  );
  if (alreadyBooked) {
    throw new ApiError("You have already booked a place at this event.", {
      kind: CONFLICT,
      status: HTTP_UNPROCESSABLE,
    });
  }

  const booking = { id: nextId(bookings), user_id: user.id, event_id: event.id };
  commit({ ...currentState(), bookings: [...bookings, booking] });
  return booking;
};

export const health = async () => true;

export const DEMO_USERS_FOR_DISPLAY = DEMO_USERS;
