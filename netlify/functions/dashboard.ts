import type { Config } from "@netlify/functions";
import { SOURCE_URL } from "../lib/defaults";
import { applyReservationExclusions } from "../lib/exclusions";
import { getCollectionMeta, getReservationExclusions, getReservations, getUsers } from "../lib/storage";

export default async function handler(): Promise<Response> {
  const [users, reservations, exclusions, meta] = await Promise.all([
    getUsers(),
    getReservations(),
    getReservationExclusions(),
    getCollectionMeta(),
  ]);

  return Response.json({
    users: users.filter((user) => user.active),
    reservations: applyReservationExclusions(reservations, exclusions),
    ...meta,
    sourceUrl: SOURCE_URL,
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}

export const config: Config = { path: "/api/dashboard" };
