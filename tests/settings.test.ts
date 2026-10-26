import { describe, expect, it } from "vitest";
import { normalizeActiveCourts } from "../netlify/lib/settings";

describe("court settings", () => {
  it("sorts a valid court selection", () => {
    expect(normalizeActiveCourts([4, 1, 3])).toEqual([1, 3, 4]);
  });

  it("requires one or more unique courts from 1 through 4", () => {
    expect(normalizeActiveCourts([])).toBeNull();
    expect(normalizeActiveCourts([1, 1])).toBeNull();
    expect(normalizeActiveCourts([1, 5])).toBeNull();
  });
});
