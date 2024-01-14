import { dateChipParts, isPast, parseEventDate, toApiDate } from "../lib/dates";
import { bannerStyle, BANNER_COLOUR_COUNT } from "../lib/banner";

describe("parseEventDate", () => {
  it("parses the ISO 8601 UTC string the API sends", () => {
    expect(parseEventDate("2026-11-02T18:00:00.000Z").getUTCFullYear()).toBe(2026);
  });

  it("returns null rather than an Invalid Date", () => {
    expect(parseEventDate("not a date")).toBeNull();
    expect(parseEventDate(undefined)).toBeNull();
  });
});

describe("dateChipParts", () => {
  it("splits a date into an uppercase month and a day", () => {
    const parts = dateChipParts("2026-11-02T18:00:00.000Z");
    expect(parts.month).toBe(parts.month.toUpperCase());
    expect(Number(parts.day)).toBeGreaterThan(0);
  });

  it("degrades to a placeholder rather than throwing", () => {
    expect(dateChipParts("rubbish")).toEqual({ month: "TBC", day: "--" });
  });
});

describe("isPast", () => {
  const now = Date.parse("2026-06-01T00:00:00.000Z");

  it("is true for a date before now", () => {
    expect(isPast("2026-05-31T23:00:00.000Z", now)).toBe(true);
  });

  it("is false for a date after now", () => {
    expect(isPast("2026-06-02T00:00:00.000Z", now)).toBe(false);
  });

  it("is false for an unparseable date", () => {
    expect(isPast("rubbish", now)).toBe(false);
  });
});

describe("toApiDate", () => {
  it("emits an ISO string with a time component", () => {
    expect(toApiDate(new Date("2026-11-02T18:00:00.000Z"))).toBe("2026-11-02T18:00:00.000Z");
  });

  it("falls back to now for an unparseable value", () => {
    expect(Number.isNaN(Date.parse(toApiDate("rubbish")))).toBe(false);
  });
});

describe("bannerStyle", () => {
  it("is stable for the same id", () => {
    expect(bannerStyle(7)).toEqual(bannerStyle(7));
  });

  it("differs between adjacent ids", () => {
    expect(bannerStyle(1)).not.toEqual(bannerStyle(2));
  });

  it("handles a missing id without throwing", () => {
    expect(bannerStyle(undefined).background).toContain("linear-gradient");
  });

  it("cycles through the palette", () => {
    expect(bannerStyle(0)).toEqual(bannerStyle(BANNER_COLOUR_COUNT));
  });
});
