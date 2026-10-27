import { describe, expect, it } from "vitest";
import type { Reservation } from "../src/types";
import { preserveCollectedReservations } from "../netlify/lib/reservations";

const legacyCancelled: Reservation = {
  id: "2026-10-27-3-21:00-baek-changbeom",
  date: "2026-10-27",
  court: 3,
  startTime: "21:00",
  endTime: "23:00",
  maskedName: "백*범",
  userId: "baek-changbeom",
  status: "cancelled",
  fee: 15000,
  firstSeenAt: "2026-10-26T00:00:00.000Z",
  lastSeenAt: "2026-10-26T00:00:00.000Z",
  cancelledAt: "2026-10-27T00:00:00.000Z",
};

describe("accumulated reservations", () => {
  it("restores legacy cancellations without mutating stored input", () => {
    const [preserved] = preserveCollectedReservations([legacyCancelled]);
    expect(preserved.status).toBe("reserved");
    expect(preserved.cancelledAt).toBeUndefined();
    expect(legacyCancelled.status).toBe("cancelled");
  });
});
