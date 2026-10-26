import type { Config, Context } from "@netlify/functions";
import { requireAdmin } from "../lib/auth";
import { collectReservations } from "../lib/collector";

export default async function handler(_request: Request, context: Context): Promise<Response> {
  const denied = await requireAdmin(context);
  if (denied) return denied;
  try {
    return Response.json(await collectReservations());
  } catch (error) {
    return new Response(error instanceof Error ? error.message : "수집에 실패했습니다.", { status: 502 });
  }
}

export const config: Config = {
  path: "/api/admin/collect",
  rateLimit: { windowLimit: 3, windowSize: 60, aggregateBy: ["domain", "ip"] },
};
