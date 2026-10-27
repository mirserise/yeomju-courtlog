import { describe, expect, it } from "vitest";
import { DEFAULT_USERS } from "../netlify/lib/defaults";
import { mergeSnapshot, parseReservationPage } from "../netlify/lib/scraper";

const html = `
  <table><tr><td class="btn_pop" id="2026-10-29"><ul>
    <li><b>주야간(17:00~19:00)</b></li>
    <li><b>백*범(19:00~...</b></li>
    <li><b>김*형(21:00~...</b></li>
  </ul></td></tr></table>
`;

describe("reservation scraper", () => {
  it("only collects tracked masked names", () => {
    expect(parseReservationPage(html, 1, DEFAULT_USERS)).toEqual([
      { date: "2026-10-29", court: 1, startTime: "19:00", maskedName: "백*범" },
    ]);
  });

  it("keeps one identity for the same masked name", () => {
    const snapshot = parseReservationPage(html, 1, DEFAULT_USERS);
    const merged = mergeSnapshot([], snapshot, DEFAULT_USERS, "2026-10-26T00:00:00.000Z");
    expect(merged[0].userId).toBe("baek-changbeom");
    expect(merged[0].status).toBe("reserved");
  });

  it("keeps a collected booking when it disappears from the rolling source page", () => {
    const initial = mergeSnapshot([], parseReservationPage(html, 1, DEFAULT_USERS), DEFAULT_USERS, "2026-10-26T00:00:00.000Z");
    const merged = mergeSnapshot(initial, [], DEFAULT_USERS, "2026-10-27T00:00:00.000Z");
    expect(merged).toEqual(initial);
  });

  it("does not overwrite an existing exclusion marker while collecting", () => {
    const initial = mergeSnapshot([], parseReservationPage(html, 1, DEFAULT_USERS), DEFAULT_USERS, "2026-10-26T00:00:00.000Z");
    initial[0].excludedAt = "2026-10-26T01:00:00.000Z";
    const merged = mergeSnapshot(initial, parseReservationPage(html, 1, DEFAULT_USERS), DEFAULT_USERS, "2026-10-26T08:00:00.000Z");
    expect(merged[0].excludedAt).toBe("2026-10-26T01:00:00.000Z");
  });

  it("does not rewrite unchanged reservations on the next collection", () => {
    const initial = mergeSnapshot([], parseReservationPage(html, 1, DEFAULT_USERS), DEFAULT_USERS, "2026-10-26T00:00:00.000Z");
    const merged = mergeSnapshot(initial, parseReservationPage(html, 1, DEFAULT_USERS), DEFAULT_USERS, "2026-10-27T00:00:00.000Z");
    expect(merged).toEqual(initial);
  });

  it("restores records cancelled by the former snapshot logic", () => {
    const initial = mergeSnapshot([], parseReservationPage(html, 1, DEFAULT_USERS), DEFAULT_USERS, "2026-10-26T00:00:00.000Z");
    const legacyCancelled = [{ ...initial[0], status: "cancelled" as const, cancelledAt: "2026-10-27T00:00:00.000Z" }];
    const merged = mergeSnapshot(legacyCancelled, [], DEFAULT_USERS, "2026-10-28T00:00:00.000Z");
    expect(merged[0].status).toBe("reserved");
    expect(merged[0].cancelledAt).toBeUndefined();
  });
});
