import httpClient from "../api/httpClient";
import * as live from "../api/liveBackend";
import { ApiError, CONFLICT, FORBIDDEN, VALIDATION } from "../api/apiError";

jest.mock("../api/httpClient", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
  onSessionExpired: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

const listResponse = (items, headers) => ({ data: items, headers });

describe("list endpoints", () => {
  it.each([
    ["listOrganizedEvents", "/api/v1/events"],
    ["listJoinedEvents", "/api/v1/events/joined_events"],
    ["listJoinableEvents", "/api/v1/events/get_events"],
  ])("%s calls %s with page and per_page", async (fn, path) => {
    httpClient.get.mockResolvedValue(listResponse([], {}));
    await live[fn]({ page: 2, perPage: 8 });

    expect(httpClient.get).toHaveBeenCalledWith(path, {
      params: { page: 2, per_page: 8 },
    });
  });

  it("reads X-Total-Count, X-Page and X-Per-Page off the response", async () => {
    httpClient.get.mockResolvedValue(
      listResponse([{ id: 1 }, { id: 2 }], {
        "x-total-count": "57",
        "x-page": "3",
        "x-per-page": "2",
      }),
    );

    const page = await live.listOrganizedEvents({ page: 3, perPage: 2 });
    expect(page).toEqual({ items: [{ id: 1 }, { id: 2 }], total: 57, page: 3, perPage: 2 });
  });

  it("falls back to the row count when the server omits the headers", async () => {
    httpClient.get.mockResolvedValue(listResponse([{ id: 1 }], {}));
    const page = await live.listJoinedEvents({ page: 1, perPage: 8 });
    expect(page.total).toBe(1);
    expect(page.perPage).toBe(8);
  });

  it("survives a body that is not an array", async () => {
    httpClient.get.mockResolvedValue(listResponse("", {}));
    const page = await live.listJoinableEvents({ page: 1, perPage: 8 });
    expect(page.items).toEqual([]);
    expect(page.total).toBe(0);
  });
});

describe("authentication", () => {
  it("takes the token from the Authorization response header, not the body", async () => {
    httpClient.post.mockResolvedValue({
      headers: { authorization: "Bearer abc.def.ghi" },
      data: { status: { code: 200, data: { user: { id: 1, email: "ada@example.com" } } } },
    });

    const result = await live.signIn({ email: "ada@example.com", password: "password123" });
    expect(result.token).toBe("Bearer abc.def.ghi");
    expect(result.user.email).toBe("ada@example.com");
  });

  it("posts the credentials nested under a user key", async () => {
    httpClient.post.mockResolvedValue({ headers: { authorization: "Bearer x" }, data: {} });
    await live.signIn({ email: "ada@example.com", password: "password123" });

    expect(httpClient.post).toHaveBeenCalledWith("/login", {
      user: { email: "ada@example.com", password: "password123" },
    });
  });

  it("fails loudly when the Authorization header is missing", async () => {
    httpClient.post.mockResolvedValue({ headers: {}, data: {} });
    await expect(live.signIn({ email: "a@b.c", password: "x" })).rejects.toBeInstanceOf(
      ApiError,
    );
  });

  it("sends the confirmation field under the server's snake_case name", async () => {
    httpClient.post.mockResolvedValue({ data: { data: { id: 4 } } });
    await live.signUp({
      name: "Ada",
      email: "ada@example.com",
      password: "password123",
      passwordConfirmation: "password123",
    });

    expect(httpClient.post).toHaveBeenCalledWith("/signup", {
      user: {
        name: "Ada",
        email: "ada@example.com",
        password: "password123",
        password_confirmation: "password123",
      },
    });
  });

  it("sends logout with no explicit header, letting the interceptor attach the token", async () => {
    httpClient.delete.mockResolvedValue({ status: 200 });
    await live.signOut();
    expect(httpClient.delete).toHaveBeenCalledWith("/logout");
  });
});

describe("event writes", () => {
  it("wraps the attributes under an event key", async () => {
    httpClient.post.mockResolvedValue({ data: { id: 9 } });
    await live.createEvent({ name: "A", location: "B" });

    expect(httpClient.post).toHaveBeenCalledWith("/api/v1/events", {
      event: { name: "A", location: "B" },
    });
  });

  it("uses PATCH for an update", async () => {
    httpClient.patch.mockResolvedValue({ data: { id: 9 } });
    await live.updateEvent(9, { name: "A" });
    expect(httpClient.patch).toHaveBeenCalledWith("/api/v1/events/9", { event: { name: "A" } });
  });
});

describe("joinEvent", () => {
  it("sends event_id as a query parameter with no body", async () => {
    httpClient.post.mockResolvedValue({ data: { id: 1, user_id: 2, event_id: 4 } });
    await live.joinEvent(4);

    expect(httpClient.post).toHaveBeenCalledWith("/api/v1/events/add_user_to_events", null, {
      params: { event_id: 4 },
    });
  });

  it("turns the 403 into the reason it actually means", async () => {
    httpClient.post.mockRejectedValue(
      new ApiError("Forbidden", { kind: FORBIDDEN, status: 403 }),
    );
    await expect(live.joinEvent(4)).rejects.toMatchObject({
      kind: FORBIDDEN,
      message: "You organize this event, so you cannot book a place at it.",
    });
  });

  it("turns the uniqueness 422 into a conflict, not a validation error", async () => {
    httpClient.post.mockRejectedValue(
      new ApiError("Invalid", { kind: VALIDATION, status: 422 }),
    );
    await expect(live.joinEvent(4)).rejects.toMatchObject({ kind: CONFLICT });
  });

  it("passes any other failure through untouched", async () => {
    const original = new ApiError("Boom", { kind: "unknown", status: 500 });
    httpClient.post.mockRejectedValue(original);
    await expect(live.joinEvent(4)).rejects.toBe(original);
  });
});
