import type { Config } from "@netlify/functions";
import { SOURCE_URL } from "../lib/defaults";
import { getCollectionMeta, getReservations, getUsers } from "../lib/storage";

export default async function handler(): Promise<Response> {
  const [users, reservations, meta] = await Promise.all([
    getUsers(),
    getReservations(),
    getCollectionMeta(),
  ]);

  return Response.json({
    users: users.filter((user) => user.active),
    reservations,
    ...meta,
    sourceUrl: SOURCE_URL,
  }, {
    headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
  });
}

export const config: Config = { path: "/api/dashboard" };
