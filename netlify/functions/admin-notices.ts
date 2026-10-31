import type { Config, Context } from "@netlify/functions";
import { randomUUID } from "node:crypto";
import type { CalendarNotice } from "../../src/types";
import { requireAdmin } from "../lib/auth";
import { cleanNoticeMessage, isValidNoticeDate } from "../lib/notices";
import { deleteNotice, getNotices, saveNotice } from "../lib/storage";

interface NoticeInput {
  id?: unknown;
  date?: unknown;
  message?: unknown;
}

async function parseInput(request: Request): Promise<NoticeInput | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export default async function handler(request: Request, context: Context): Promise<Response> {
  const denied = await requireAdmin(context);
  if (denied) return denied;

  if (request.method === "GET") return Response.json(await getNotices());

  const input = await parseInput(request);
  if (!input) return new Response("요청 형식이 올바르지 않습니다.", { status: 400 });

  if (request.method === "POST") {
    const message = cleanNoticeMessage(input.message);
    if (!isValidNoticeDate(input.date)) return new Response("공지 날짜가 올바르지 않습니다.", { status: 400 });
    if (!message || message.length > 80) return new Response("공지 내용은 1자 이상 80자 이하로 입력해 주세요.", { status: 400 });

    const now = new Date().toISOString();
    const notice: CalendarNotice = {
      id: randomUUID(),
      date: input.date,
      message,
      createdAt: now,
      updatedAt: now,
    };
    await saveNotice(notice);
    return Response.json(await getNotices(), { status: 201 });
  }

  if (request.method === "DELETE") {
    const id = typeof input.id === "string" ? input.id.trim() : "";
    if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("공지 식별자가 올바르지 않습니다.", { status: 400 });
    const notices = await getNotices();
    if (!notices.some((notice) => notice.id === id)) return new Response("공지를 찾을 수 없습니다.", { status: 404 });
    await deleteNotice(id);
    return Response.json(await getNotices());
  }

  return new Response("지원하지 않는 요청입니다.", { status: 405 });
}

export const config: Config = { path: "/api/admin/notices" };
