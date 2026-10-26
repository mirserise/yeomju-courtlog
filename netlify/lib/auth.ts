import { getUser } from "@netlify/identity";
import type { Context } from "@netlify/functions";

export async function requireAdmin(_context: Context): Promise<Response | null> {
  let user;
  try {
    user = await getUser();
  } catch {
    return new Response("관리자 인증을 확인할 수 없습니다.", { status: 401 });
  }
  if (!user) return new Response("관리자 로그인이 필요합니다.", { status: 401 });
  const allowedEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const email = user.email?.toLowerCase() ?? "";
  if (allowedEmail && email !== allowedEmail) {
    return new Response("관리자 권한이 없습니다.", { status: 403 });
  }
  return null;
}
