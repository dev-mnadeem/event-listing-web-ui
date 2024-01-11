/**
 * Fixture data for demo mode.
 *
 * Dates are generated relative to load time so the "upcoming" filter keeps
 * having something to include and something to exclude however long after this
 * was written the repository is opened.
 */

const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
const SECONDS_PER_MINUTE = 60;
const MILLISECONDS_PER_SECOND = 1000;
const MILLISECONDS_PER_DAY =
  HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND;

/** The signed-in user in demo mode. Matches the API's own `db:seed` first user. */
export const DEMO_USER = { id: 1, name: "Ada Lovelace", email: "ada@example.com" };

export const DEMO_USERS = [
  DEMO_USER,
  { id: 2, name: "Grace Hopper", email: "grace@example.com" },
  { id: 3, name: "Alan Turing", email: "alan@example.com" },
];

export const DEMO_PASSWORD = "password123";

const daysFromNow = (days, hour) => {
  const date = new Date(Date.now() + days * MILLISECONDS_PER_DAY);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

/**
 * `organizer_id: 1` puts an event in "Events you organize"; an entry in
 * `bookings` puts it in "Events you have booked"; everything else that is still
 * in the future is joinable. The single past event is there so the upcoming
 * filter visibly excludes something.
 */
const EVENT_SEED = [
  {
    id: 1,
    organizer_id: 1,
    days: 6,
    hour: 18,
    name: "Zero Downtime Migrations",
    location: "York",
    description:
      "Shipping schema changes without a maintenance window, and what to do when the backfill is the slow part.",
  },
  {
    id: 2,
    organizer_id: 1,
    days: 19,
    hour: 10,
    name: "Pagination Without Tears",
    location: "Leeds",
    description:
      "Offset, keyset and cursor pagination compared on a table nobody is allowed to lock.",
  },
  {
    id: 3,
    organizer_id: 1,
    days: 41,
    hour: 9,
    name: "Reading EXPLAIN ANALYZE",
    location: "Manchester",
    description:
      "A morning spent turning query plans into index decisions, on plans from real production traffic.",
  },

  {
    id: 4,
    organizer_id: 2,
    days: 3,
    hour: 19,
    name: "JWTs and the jti Column",
    location: "Bristol",
    description:
      "Why a stateless token still needs one row of server state before you can revoke it.",
  },
  {
    id: 5,
    organizer_id: 3,
    days: 12,
    hour: 17,
    name: "CORS for People Who Have Given Up",
    location: "Sheffield",
    description:
      "Preflights, exposed headers, and the one setting that makes a token readable from a browser.",
  },

  {
    id: 6,
    organizer_id: 2,
    days: 2,
    hour: 18,
    name: "N+1 Queries in the Wild",
    location: "Edinburgh",
    description:
      "Finding the loop that issues a thousand queries, and the four ways to collapse it into one.",
  },
  {
    id: 7,
    organizer_id: 3,
    days: 8,
    hour: 13,
    name: "Designing an Error Envelope",
    location: "Glasgow",
    description:
      "One shape for validation failures, one for everything else, and never a raw exception string.",
  },
  {
    id: 8,
    organizer_id: 2,
    days: 14,
    hour: 18,
    name: "Idempotency Keys in Practice",
    location: "Cardiff",
    description:
      "Making a retried booking request safe when the first attempt timed out after it committed.",
  },
  {
    id: 9,
    organizer_id: 3,
    days: 21,
    hour: 11,
    name: "The Cost of a Composite Index",
    location: "Newcastle",
    description:
      "Write amplification, column order, and measuring whether the index you added is used at all.",
  },
  {
    id: 10,
    organizer_id: 2,
    days: 27,
    hour: 18,
    name: "Background Jobs That Survive Deploys",
    location: "Nottingham",
    description:
      "Draining a queue safely, and why at-least-once delivery changes how you write the handler.",
  },
  {
    id: 11,
    organizer_id: 3,
    days: 33,
    hour: 14,
    name: "Schema Design for Two-Sided Edges",
    location: "Liverpool",
    description:
      "When one table relates to another twice, and the association names that stop it going wrong.",
  },
  {
    id: 12,
    organizer_id: 2,
    days: 38,
    hour: 18,
    name: "Rate Limiting the Honest Way",
    location: "Brighton",
    description:
      "Token buckets, the headers to send back, and what a client should do with a 429.",
  },
  {
    id: 13,
    organizer_id: 3,
    days: 45,
    hour: 10,
    name: "Testing Against a Real Database",
    location: "Oxford",
    description:
      "Transactional fixtures, the cases they hide, and when to pay for a truncation strategy instead.",
  },
  {
    id: 14,
    organizer_id: 2,
    days: 52,
    hour: 18,
    name: "Observability on a Small Budget",
    location: "Cambridge",
    description:
      "Structured logs, three metrics worth alerting on, and tracing only the requests that matter.",
  },
  {
    id: 15,
    organizer_id: 3,
    days: 59,
    hour: 16,
    name: "Deleting Code You Are Afraid Of",
    location: "Reading",
    description:
      "Characterisation tests, feature flags, and proving a branch is unreachable before removing it.",
  },

  {
    id: 16,
    organizer_id: 2,
    days: -11,
    hour: 18,
    name: "Postgres Upgrade Retrospective",
    location: "London",
    description: "What the logical replication cutover cost us, in downtime and in surprises.",
  },
];

/** Bookings held by the demo user, which is what "joined" means. */
const BOOKING_SEED = [
  { id: 1, user_id: DEMO_USER.id, event_id: 4 },
  { id: 2, user_id: DEMO_USER.id, event_id: 5 },
];

export const buildSeed = () => ({
  users: DEMO_USERS.map((user) => ({ ...user })),
  events: EVENT_SEED.map(({ days, hour, ...event }) => ({
    ...event,
    date: daysFromNow(days, hour),
  })),
  bookings: BOOKING_SEED.map((booking) => ({ ...booking })),
});
