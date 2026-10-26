import type { Config } from "@netlify/functions";
import { collectReservations } from "../lib/collector";

export default async function handler(): Promise<Response> {
  try {
    return Response.json(await collectReservations());
  } catch (error) {
    return new Response(error instanceof Error ? error.message : "수집에 실패했습니다.", { status: 502 });
  }
}

export const config: Config = { schedule: "10 0 * * *" };
