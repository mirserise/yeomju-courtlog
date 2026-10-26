import type { Config, Context } from "@netlify/functions";
import type { CourtSettings } from "../../src/types";
import { requireAdmin } from "../lib/auth";
import { normalizeActiveCourts } from "../lib/settings";
import { getCourtSettings, saveCourtSettings } from "../lib/storage";

interface SettingsInput {
  activeCourts?: unknown;
}

export default async function handler(request: Request, context: Context): Promise<Response> {
  const denied = await requireAdmin(context);
  if (denied) return denied;

  if (request.method === "GET") return Response.json(await getCourtSettings());
  if (request.method !== "PUT") return new Response("지원하지 않는 요청입니다.", { status: 405 });

  let input: SettingsInput;
  try {
    input = await request.json();
  } catch {
    return new Response("요청 형식이 올바르지 않습니다.", { status: 400 });
  }

  const activeCourts = normalizeActiveCourts(input.activeCourts);
  if (!activeCourts) return new Response("1~4번 코트 중 하나 이상을 선택해 주세요.", { status: 400 });

  const settings: CourtSettings = { activeCourts, updatedAt: new Date().toISOString() };
  await saveCourtSettings(settings);
  return Response.json(settings);
}

export const config: Config = { path: "/api/admin/settings" };
