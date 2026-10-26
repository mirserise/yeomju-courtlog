import type { Reservation } from "../../src/types";

export type ReservationExclusions = Record<string, string>;

export function applyReservationExclusions(
  reservations: Reservation[],
  exclusions: ReservationExclusions,
): Reservation[] {
  return reservations.map((reservation) => {
    const excludedAt = exclusions[reservation.id];
    if (!excludedAt) {
      const visibleReservation = { ...reservation };
      delete visibleReservation.excludedAt;
      return visibleReservation;
    }
    return { ...reservation, excludedAt };
  });
}

export function setReservationExclusions(
  current: ReservationExclusions,
  ids: string[],
  excluded: boolean,
  changedAt: string,
): ReservationExclusions {
  const next = { ...current };
  for (const id of ids) {
    if (excluded) next[id] = changedAt;
    else delete next[id];
  }
  return next;
}
