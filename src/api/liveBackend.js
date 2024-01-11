import httpClient from "./httpClient";
import { ApiError, FORBIDDEN, CONFLICT, VALIDATION } from "./apiError";

/**
 * The eleven endpoints of event_management_app_BE, and nothing else.
 *
 * The route names are the server's, awkward ones included
 * (`add_user_to_events`, `get_events`, `joined_events`). They are quarantined in
 * this file so the rest of the client speaks in domain verbs instead.
 */

const EVENTS_PATH = "/api/v1/events";

/** The response headers every list endpoint sets alongside its bare JSON array. */
const TOTAL_COUNT_HEADER = "x-total-count";
const PAGE_HEADER = "x-page";
const PER_PAGE_HEADER = "x-per-page";

const readIntHeader = (headers, name, fallback) => {
  const raw = headers?.[name];
  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

/**
 * Every list endpoint answers with a bare array plus pagination headers, so the
 * page shape is assembled here rather than by each caller.
 *
 * @returns {{items: object[], total: number, page: number, perPage: number}}
 */
const toPage = (response, requested) => {
  const items = Array.isArray(response.data) ? response.data : [];
  return {
    items,
    total: readIntHeader(response.headers, TOTAL_COUNT_HEADER, items.length),
    page: readIntHeader(response.headers, PAGE_HEADER, requested.page),
    perPage: readIntHeader(response.headers, PER_PAGE_HEADER, requested.perPage),
  };
};

const listParams = ({ page, perPage }) => ({ params: { page, per_page: perPage } });

const fetchList = async (path, pagination) => {
  const response = await httpClient.get(path, listParams(pagination));
  return toPage(response, pagination);
};

// --- authentication -------------------------------------------------------

/** `POST /signup`. The server names the confirmation field `password_confirmation`. */
export const signUp = async ({ name, email, password, passwordConfirmation }) => {
  const response = await httpClient.post("/signup", {
    user: {
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
    },
  });
  return response.data?.data ?? null;
};

/**
 * `POST /login`. The token is in the `Authorization` response header, not the
 * body. A browser can only read it because the server sends
 * `Access-Control-Expose-Headers: Authorization`.
 */
export const signIn = async ({ email, password }) => {
  const response = await httpClient.post("/login", { user: { email, password } });
  const token = response.headers?.authorization;

  if (!token) {
    throw new ApiError(
      "Signed in, but the API did not return a token. Check that it sends Access-Control-Expose-Headers: Authorization.",
    );
  }

  return { token, user: response.data?.status?.data?.user ?? null };
};

/** `DELETE /logout`. Revokes the presented token server-side. */
export const signOut = async () => {
  await httpClient.delete("/logout");
};

// --- events ---------------------------------------------------------------

/** `GET /api/v1/events` — events the caller organizes. */
export const listOrganizedEvents = (pagination) => fetchList(EVENTS_PATH, pagination);

/** `GET /api/v1/events/joined_events` — events the caller has booked. */
export const listJoinedEvents = (pagination) =>
  fetchList(`${EVENTS_PATH}/joined_events`, pagination);

/**
 * `GET /api/v1/events/get_events` — upcoming events the caller neither
 * organizes nor has joined. The server, not the client, applies the date
 * filter.
 */
export const listJoinableEvents = (pagination) =>
  fetchList(`${EVENTS_PATH}/get_events`, pagination);

export const getEvent = async (id) => {
  const response = await httpClient.get(`${EVENTS_PATH}/${id}`);
  return response.data;
};

/** `POST /api/v1/events`. `organizer_id` is ignored — the caller is the organizer. */
export const createEvent = async (attributes) => {
  const response = await httpClient.post(EVENTS_PATH, { event: attributes });
  return response.data;
};

/** `PATCH /api/v1/events/:id`. 403 for anyone but the organizer. */
export const updateEvent = async (id, attributes) => {
  const response = await httpClient.patch(`${EVENTS_PATH}/${id}`, { event: attributes });
  return response.data;
};

/** `DELETE /api/v1/events/:id`. 403 for anyone but the organizer, 204 on success. */
export const deleteEvent = async (id) => {
  await httpClient.delete(`${EVENTS_PATH}/${id}`);
};

/**
 * `POST /api/v1/events/add_user_to_events?event_id=:id`.
 *
 * Two refusals are domain rules rather than faults, and both are worth a
 * specific message: 403 means the caller organizes the event, 422 means they
 * already hold a booking.
 */
export const joinEvent = async (eventId) => {
  try {
    const response = await httpClient.post(`${EVENTS_PATH}/add_user_to_events`, null, {
      params: { event_id: eventId },
    });
    return response.data;
  } catch (error) {
    if (error.kind === FORBIDDEN) {
      throw new ApiError("You organize this event, so you cannot book a place at it.", {
        kind: FORBIDDEN,
        status: error.status,
      });
    }
    if (error.kind === VALIDATION) {
      throw new ApiError("You have already booked a place at this event.", {
        kind: CONFLICT,
        status: error.status,
      });
    }
    throw error;
  }
};

/** `GET /up` — the health probe, which touches the database. */
export const health = async () => {
  await httpClient.get("/up");
  return true;
};
