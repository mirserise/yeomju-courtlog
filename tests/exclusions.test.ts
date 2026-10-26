import { describe, expect, it } from "vitest";
import type { Reservation } from "../src/types";
import { applyReservationExclusions, setReservationExclusions } from "../netlify/lib/exclusions";

const reservation: Reservation = {
  id: "2026-10-29-1-19:00-baek-changbeom",
  date: "2026-10-29",
  court: 1,
  startTime: "19:00",
  endTime: "21:00",
  maskedName: "백*범",
  userId: "baek-changbeom",
  status: "reserved",
  fee: 18000,
  firstSeenAt: "2026-10-26T00:00:00.000Z",
  lastSeenAt: "2026-10-26T00:00:00.000Z",
};

describe("reservation exclusions", () => {
  it("marks selected reservations without changing the source reservation", () => {
    const changedAt = "2026-10-26T03:00:00.000Z";
    const exclusions = setReservationExclusions({}, [reservation.id], true, changedAt);
    const [result] = applyReservationExclusions([reservation], exclusions);

    expect(result.excludedAt).toBe(changedAt);
    expect(reservation.excludedAt).toBeUndefined();
  });

  it("restores an excluded reservation", () => {
    const exclusions = setReservationExclusions(
      { [reservation.id]: "2026-10-26T03:00:00.000Z" },
      [reservation.id],
      false,
      "2026-10-26T04:00:00.000Z",
    );

    expect(exclusions[reservation.id]).toBeUndefined();
    expect(applyReservationExclusions([{ ...reservation, excludedAt: "stale" }], exclusions)[0].excludedAt).toBeUndefined();
  });
});
