/**
 * The API answers failures in exactly three shapes. Everything that talks to it
 * funnels through here so a component never has to know which one it got.
 *
 *   { "errors": ["Event not found"] }                  400, 403, 404, 500
 *   { "attributes_errors": { "name": ["can't be blank"] } }   422
 *   { "status": ["Email has already been taken"] }     the Devise signup route
 *
 * Anything else — an HTML error page from a misconfigured proxy, a network
 * failure, a 204 with no body — becomes a generic message rather than a crash.
 */

export const UNAUTHENTICATED = "unauthenticated";
export const FORBIDDEN = "forbidden";
export const NOT_FOUND = "not_found";
export const VALIDATION = "validation";
export const CONFLICT = "conflict";
export const NETWORK = "network";
export const UNKNOWN = "unknown";

const GENERIC_MESSAGE = "Something went wrong. Please try again.";
const NETWORK_MESSAGE = "Could not reach the events API.";

const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;
const HTTP_NOT_FOUND = 404;
const HTTP_UNPROCESSABLE = 422;

export class ApiError extends Error {
  /**
   * @param {string} message   a sentence fit to show a user
   * @param {object} [options]
   * @param {string} [options.kind]         one of the exported kind constants
   * @param {number} [options.status]       HTTP status, when there was one
   * @param {Object<string,string[]>} [options.fieldErrors] per-field messages, 422 only
   */
  constructor(message, { kind = UNKNOWN, status = null, fieldErrors = {} } = {}) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.fieldErrors = fieldErrors;
  }

  /** True when re-authenticating is the fix. */
  get isAuthFailure() {
    return this.kind === UNAUTHENTICATED;
  }
}

const kindForStatus = (status) => {
  switch (status) {
    case HTTP_UNAUTHORIZED:
      return UNAUTHENTICATED;
    case HTTP_FORBIDDEN:
      return FORBIDDEN;
    case HTTP_NOT_FOUND:
      return NOT_FOUND;
    case HTTP_UNPROCESSABLE:
      return VALIDATION;
    default:
      return UNKNOWN;
  }
};

const humanizeField = (field) => field.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

const flattenFieldErrors = (fieldErrors) =>
  Object.entries(fieldErrors)
    .map(([field, messages]) => `${humanizeField(field)} ${messages.join(", ")}`)
    .join(". ");

/**
 * @param {unknown} body  a parsed JSON response body, or whatever arrived instead
 * @returns {{ message: string|null, fieldErrors: Object<string,string[]> }}
 */
export const parseErrorBody = (body) => {
  if (!body || typeof body !== "object") {
    return { message: null, fieldErrors: {} };
  }

  if (Array.isArray(body.errors) && body.errors.length > 0) {
    return { message: body.errors.join(". "), fieldErrors: {} };
  }

  if (body.attributes_errors && typeof body.attributes_errors === "object") {
    const fieldErrors = body.attributes_errors;
    return { message: flattenFieldErrors(fieldErrors) || null, fieldErrors };
  }

  // Devise's signup route answers `{"status": ["Email has already been taken"]}`
  // on failure but `{"status": {"code": 200, ...}}` on success, so the array
  // check has to come before anything that assumes an object.
  if (Array.isArray(body.status) && body.status.length > 0) {
    return { message: body.status.join(". "), fieldErrors: {} };
  }

  if (typeof body.message === "string" && body.message !== "") {
    return { message: body.message, fieldErrors: {} };
  }

  return { message: null, fieldErrors: {} };
};

/** Turn any thrown value from axios into an ApiError. */
export const toApiError = (error) => {
  if (error instanceof ApiError) return error;

  const response = error?.response;
  if (!response) {
    return new ApiError(NETWORK_MESSAGE, { kind: NETWORK });
  }

  const { message, fieldErrors } = parseErrorBody(response.data);
  return new ApiError(message || GENERIC_MESSAGE, {
    kind: kindForStatus(response.status),
    status: response.status,
    fieldErrors,
  });
};
