import type { Reservation } from "../../src/types";

/**
 * Courtlog is an append-only archive. Once a reservation has been collected,
 * a later omission from the rolling source page must not remove it from history.
 * This also migrates records cancelled by the former snapshot-replacement logic.
 */
export function preserveCollectedReservations(reservations: Reservation[]): Reservation[] {
  return reservations.map((reservation) => {
    if (reservation.status === "reserved" && !reservation.cancelledAt) return { ...reservation };
    const preserved: Reservation = { ...reservation, status: "reserved" };
    delete preserved.cancelledAt;
    return preserved;
  });
}
