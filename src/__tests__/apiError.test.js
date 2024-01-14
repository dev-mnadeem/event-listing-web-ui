import {
  ApiError,
  FORBIDDEN,
  NETWORK,
  NOT_FOUND,
  UNAUTHENTICATED,
  VALIDATION,
  parseErrorBody,
  toApiError,
} from "../api/apiError";

describe("parseErrorBody", () => {
  it("reads the errors array the API uses for 400, 403, 404 and 500", () => {
    expect(parseErrorBody({ errors: ["Event not found"] })).toEqual({
      message: "Event not found",
      fieldErrors: {},
    });
  });

  it("joins several messages from one errors array", () => {
    expect(parseErrorBody({ errors: ["First", "Second"] }).message).toBe("First. Second");
  });

  it("reads attributes_errors and keeps the per-field detail", () => {
    const parsed = parseErrorBody({
      attributes_errors: { name: ["can't be blank"], date: ["is invalid"] },
    });
    expect(parsed.fieldErrors).toEqual({ name: ["can't be blank"], date: ["is invalid"] });
    expect(parsed.message).toBe("Name can't be blank. Date is invalid");
  });

  it("humanizes the snake_case column names the server sends", () => {
    const parsed = parseErrorBody({ attributes_errors: { organizer_id: ["is required"] } });
    expect(parsed.message).toBe("Organizer id is required");
  });

  it("reads the signup route's status array", () => {
    expect(parseErrorBody({ status: ["Email has already been taken"] }).message).toBe(
      "Email has already been taken",
    );
  });

  it("does not mistake the signup success envelope for an error", () => {
    // `status` is an object on success and an array on failure, so the array
    // check has to come first or a 200 would be read as a message.
    expect(parseErrorBody({ status: { code: 200, message: "Signed up." } }).message).toBeNull();
  });

  it("returns no message for a body it does not recognise", () => {
    expect(parseErrorBody("<html>502 Bad Gateway</html>")).toEqual({
      message: null,
      fieldErrors: {},
    });
  });

  it("returns no message for an empty body", () => {
    expect(parseErrorBody(undefined).message).toBeNull();
  });
});

describe("toApiError", () => {
  const rejection = (status, data) => ({ response: { status, data } });

  it("maps 401 to an auth failure", () => {
    const error = toApiError(rejection(401, { errors: ["Unauthorized"] }));
    expect(error.kind).toBe(UNAUTHENTICATED);
    expect(error.isAuthFailure).toBe(true);
  });

  it("maps 403 to forbidden and keeps the server's sentence", () => {
    const error = toApiError(rejection(403, { errors: ["You are not the organizer"] }));
    expect(error.kind).toBe(FORBIDDEN);
    expect(error.message).toBe("You are not the organizer");
  });

  it("maps 404 to not found", () => {
    expect(toApiError(rejection(404, { errors: ["Event not found"] })).kind).toBe(NOT_FOUND);
  });

  it("maps 422 to validation and exposes fieldErrors", () => {
    const error = toApiError(
      rejection(422, { attributes_errors: { name: ["can't be blank"] } }),
    );
    expect(error.kind).toBe(VALIDATION);
    expect(error.fieldErrors.name).toEqual(["can't be blank"]);
  });

  it("treats a request that never reached the server as a network failure", () => {
    const error = toApiError(new Error("Network Error"));
    expect(error.kind).toBe(NETWORK);
    expect(error.isAuthFailure).toBe(false);
  });

  it("falls back to a generic sentence when the body carries no message", () => {
    expect(toApiError(rejection(500, {})).message).toBe(
      "Something went wrong. Please try again.",
    );
  });

  it("passes an ApiError through unchanged", () => {
    const original = new ApiError("Already wrapped", { kind: FORBIDDEN });
    expect(toApiError(original)).toBe(original);
  });
});
