import type { Config } from "@netlify/functions";
import { SOURCE_URL } from "../lib/defaults";
import { applyReservationExclusions } from "../lib/exclusions";
import { preserveCollectedReservations } from "../lib/reservations";
import { getCollectionMeta, getCourtSettings, getNotices, getReservationExclusions, getReservations, getUsers } from "../lib/storage";

export default async function handler(): Promise<Response> {
  const [users, reservations, notices, exclusions, meta, settings] = await Promise.all([
    getUsers(),
    getReservations(),
    getNotices(),
    getReservationExclusions(),
    getCollectionMeta(),
    getCourtSettings(),
  ]);

  return Response.json({
    users: users.filter((user) => user.active),
    reservations: applyReservationExclusions(
      preserveCollectedReservations(reservations)
        .filter((reservation) => settings.activeCourts.includes(reservation.court)),
      exclusions,
    ),
    notices,
    activeCourts: settings.activeCourts,
    ...meta,
    sourceUrl: SOURCE_URL,
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}

export const config: Config = { path: "/api/dashboard" };
