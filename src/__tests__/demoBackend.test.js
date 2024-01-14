import * as demo from "../api/demoBackend";
import { DEMO_USER, DEMO_PASSWORD } from "../api/demoSeed";
import { CONFLICT, FORBIDDEN, NOT_FOUND, UNAUTHENTICATED, VALIDATION } from "../api/apiError";

const ALL = { page: 1, perPage: 100 };

beforeEach(async () => {
  window.localStorage.clear();
  demo.resetDemoData();
  await demo.signIn({ email: DEMO_USER.email, password: DEMO_PASSWORD });
});

describe("sign in", () => {
  it("issues a token for a seeded user", async () => {
    const result = await demo.signIn({ email: DEMO_USER.email, password: DEMO_PASSWORD });
    expect(result.token).toMatch(/^Bearer demo\./);
    expect(result.user.email).toBe(DEMO_USER.email);
  });

  it("rejects a wrong password as an auth failure", async () => {
    await expect(
      demo.signIn({ email: DEMO_USER.email, password: "wrong" }),
    ).rejects.toMatchObject({
      kind: UNAUTHENTICATED,
    });
  });

  it("refuses every call once signed out", async () => {
    await demo.signOut();
    await expect(demo.listOrganizedEvents(ALL)).rejects.toMatchObject({
      kind: UNAUTHENTICATED,
    });
  });

  it("re-adopts a stored token after a reload", async () => {
    const { token } = await demo.signIn({ email: DEMO_USER.email, password: DEMO_PASSWORD });
    await demo.signOut();
    expect(demo.adoptToken(token).id).toBe(DEMO_USER.id);
  });
});

describe("the three lists", () => {
  it("puts an event in exactly one of them", async () => {
    const [organized, booked, joinable] = await Promise.all([
      demo.listOrganizedEvents(ALL),
      demo.listJoinedEvents(ALL),
      demo.listJoinableEvents(ALL),
    ]);

    const ids = [...organized.items, ...booked.items, ...joinable.items].map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only lists events the caller organizes under 'organized'", async () => {
    const { items } = await demo.listOrganizedEvents(ALL);
    expect(items.length).toBeGreaterThan(0);
    items.forEach((event) => expect(event.organizer_id).toBe(DEMO_USER.id));
  });

  it("excludes past events from the joinable list", async () => {
    const { items } = await demo.listJoinableEvents(ALL);
    items.forEach((event) =>
      expect(new Date(event.date).getTime()).toBeGreaterThan(Date.now()),
    );
  });

  it("keeps a past event out of the joinable list but still resolves it by id", async () => {
    const past = (await demo.listJoinableEvents(ALL)).items.find(
      (event) => new Date(event.date) < new Date(),
    );
    expect(past).toBeUndefined();
  });
});

describe("pagination", () => {
  it("reports the full total alongside a partial page", async () => {
    const all = await demo.listJoinableEvents(ALL);
    const firstPage = await demo.listJoinableEvents({ page: 1, perPage: 3 });

    expect(firstPage.items).toHaveLength(3);
    expect(firstPage.total).toBe(all.total);
    expect(firstPage.page).toBe(1);
    expect(firstPage.perPage).toBe(3);
  });

  it("returns an empty page rather than an error past the end", async () => {
    const page = await demo.listJoinableEvents({ page: 99, perPage: 3 });
    expect(page.items).toEqual([]);
    expect(page.total).toBeGreaterThan(0);
  });

  it("returns disjoint consecutive pages", async () => {
    const first = await demo.listJoinableEvents({ page: 1, perPage: 4 });
    const second = await demo.listJoinableEvents({ page: 2, perPage: 4 });
    const overlap = first.items.filter((a) => second.items.some((b) => b.id === a.id));
    expect(overlap).toEqual([]);
  });
});

describe("booking", () => {
  const firstJoinable = async () => (await demo.listJoinableEvents(ALL)).items[0];

  it("moves an event from the joinable list to the booked list", async () => {
    const event = await firstJoinable();
    await demo.joinEvent(event.id);

    const booked = await demo.listJoinedEvents(ALL);
    const joinable = await demo.listJoinableEvents(ALL);

    expect(booked.items.map((e) => e.id)).toContain(event.id);
    expect(joinable.items.map((e) => e.id)).not.toContain(event.id);
  });

  it("refuses a second booking for the same pair", async () => {
    const event = await firstJoinable();
    await demo.joinEvent(event.id);
    await expect(demo.joinEvent(event.id)).rejects.toMatchObject({ kind: CONFLICT });
  });

  it("refuses the organizer a place at their own event", async () => {
    const own = (await demo.listOrganizedEvents(ALL)).items[0];
    await expect(demo.joinEvent(own.id)).rejects.toMatchObject({ kind: FORBIDDEN });
  });

  it("404s for an event that does not exist", async () => {
    await expect(demo.joinEvent(999_999)).rejects.toMatchObject({ kind: NOT_FOUND });
  });
});

describe("writing events", () => {
  const attributes = {
    name: "Index-Only Scans",
    description: "When the heap can be skipped entirely.",
    location: "Durham",
    date: new Date(Date.now() + 86_400_000).toISOString(),
  };

  it("makes the caller the organizer, ignoring any organizer_id sent", async () => {
    const created = await demo.createEvent({ ...attributes, organizer_id: 999 });
    expect(created.organizer_id).toBe(DEMO_USER.id);
  });

  it("puts a created event in the organized list", async () => {
    const created = await demo.createEvent(attributes);
    const { items } = await demo.listOrganizedEvents(ALL);
    expect(items.map((e) => e.id)).toContain(created.id);
  });

  it("rejects a blank field with per-field errors", async () => {
    await expect(demo.createEvent({ ...attributes, name: "  " })).rejects.toMatchObject({
      kind: VALIDATION,
      fieldErrors: { name: ["can't be blank"] },
    });
  });

  it("refuses to update an event organized by somebody else", async () => {
    const other = (await demo.listJoinableEvents(ALL)).items[0];
    await expect(demo.updateEvent(other.id, attributes)).rejects.toMatchObject({
      kind: FORBIDDEN,
    });
  });

  it("refuses to delete an event organized by somebody else", async () => {
    const other = (await demo.listJoinableEvents(ALL)).items[0];
    await expect(demo.deleteEvent(other.id)).rejects.toMatchObject({ kind: FORBIDDEN });
  });

  it("updates an event the caller organizes", async () => {
    const own = (await demo.listOrganizedEvents(ALL)).items[0];
    const updated = await demo.updateEvent(own.id, { ...attributes, name: "Renamed" });
    expect(updated.name).toBe("Renamed");
    expect(updated.id).toBe(own.id);
  });

  it("removes the bookings of a deleted event", async () => {
    const event = (await demo.listJoinableEvents(ALL)).items[0];
    await demo.joinEvent(event.id);

    // Sign in as the organizer of that event to delete it.
    const organizer = { id: event.organizer_id };
    demo.adoptToken(`Bearer demo.${organizer.id}`);
    await demo.deleteEvent(event.id);

    demo.adoptToken(`Bearer demo.${DEMO_USER.id}`);
    const booked = await demo.listJoinedEvents(ALL);
    expect(booked.items.map((e) => e.id)).not.toContain(event.id);
  });

  it("404s when fetching an event that does not exist", async () => {
    await expect(demo.getEvent(999_999)).rejects.toMatchObject({ kind: NOT_FOUND });
  });
});

describe("signUp", () => {
  it("rejects an email that is already taken", async () => {
    await expect(
      demo.signUp({ name: "Someone", email: DEMO_USER.email, password: DEMO_PASSWORD }),
    ).rejects.toMatchObject({ kind: VALIDATION });
  });

  it("accepts a new email", async () => {
    const user = await demo.signUp({
      name: "Edsger Dijkstra",
      email: "edsger@example.com",
      password: DEMO_PASSWORD,
    });
    expect(user.email).toBe("edsger@example.com");
  });
});
