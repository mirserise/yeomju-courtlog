import type { Config, Context } from "@netlify/functions";
import { requireAdmin } from "../lib/auth";
import { applyReservationExclusions, setReservationExclusions } from "../lib/exclusions";
import {
  getReservationExclusions,
  getReservations,
  saveReservationExclusions,
} from "../lib/storage";

interface ExclusionInput {
  ids?: unknown;
  excluded?: unknown;
}

export default async function handler(request: Request, context: Context): Promise<Response> {
  const denied = await requireAdmin(context);
  if (denied) return denied;
  if (request.method !== "PATCH") return new Response("지원하지 않는 요청입니다.", { status: 405 });

  let input: ExclusionInput;
  try {
    input = await request.json();
  } catch {
    return new Response("요청 형식이 올바르지 않습니다.", { status: 400 });
  }

  if (!Array.isArray(input.ids) || input.ids.length === 0 || input.ids.length > 100) {
    return new Response("변경할 예약을 1건 이상 100건 이하로 선택해 주세요.", { status: 400 });
  }
  if (input.excluded !== true && input.excluded !== false) {
    return new Response("제외 여부가 올바르지 않습니다.", { status: 400 });
  }

  const ids = [...new Set(input.ids.filter((id): id is string => typeof id === "string" && id.length > 0))];
  if (ids.length !== input.ids.length) {
    return new Response("예약 식별자가 올바르지 않습니다.", { status: 400 });
  }

  const [reservations, exclusions] = await Promise.all([
    getReservations(),
    getReservationExclusions(),
  ]);
  const reservableIds = new Set(
    reservations.filter((reservation) => reservation.status === "reserved").map((reservation) => reservation.id),
  );
  if (ids.some((id) => !reservableIds.has(id))) {
    return new Response("선택한 예약 중 현재 예약 내역에서 찾을 수 없는 항목이 있습니다.", { status: 404 });
  }

  const next = setReservationExclusions(exclusions, ids, input.excluded, new Date().toISOString());
  await saveReservationExclusions(next);
  return Response.json(applyReservationExclusions(reservations, next));
}

export const config: Config = { path: "/api/admin/reservations" };
