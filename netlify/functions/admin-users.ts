import type { Config, Context } from "@netlify/functions";
import { randomUUID } from "node:crypto";
import type { TrackedUser } from "../../src/types";
import { requireAdmin } from "../lib/auth";
import { getUsers, saveUsers } from "../lib/storage";

interface UserInput {
  id?: string;
  name?: string;
  maskedName?: string;
  active?: boolean;
}

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function validate(input: UserInput, users: TrackedUser[], editingId?: string): string | null {
  const name = cleanText(input.name);
  const maskedName = cleanText(input.maskedName);
  if (!name || !maskedName) return "실제 이름과 사이트 표시 이름을 모두 입력해 주세요.";
  if (name.length > 30 || maskedName.length > 30) return "이름은 30자 이내로 입력해 주세요.";
  if (!maskedName.includes("*")) return "사이트 표시 이름에는 마스킹 문자(*)가 포함되어야 합니다.";
  if (users.some((user) => user.id !== editingId && user.maskedName === maskedName)) {
    return `${maskedName}은 이미 등록되어 있습니다. 같은 마스킹 이름은 한 사용자로만 관리합니다.`;
  }
  return null;
}

export default async function handler(request: Request, context: Context): Promise<Response> {
  const denied = await requireAdmin(context);
  if (denied) return denied;
  const users = await getUsers();

  if (request.method === "GET") return Response.json(users);

  let input: UserInput;
  try {
    input = await request.json();
  } catch {
    return new Response("요청 형식이 올바르지 않습니다.", { status: 400 });
  }

  if (request.method === "POST") {
    const validationError = validate(input, users);
    if (validationError) return new Response(validationError, { status: 400 });
    const now = new Date().toISOString();
    users.push({
      id: randomUUID(),
      name: cleanText(input.name),
      maskedName: cleanText(input.maskedName),
      active: true,
      createdAt: now,
      updatedAt: now,
    });
    await saveUsers(users);
    return Response.json(users, { status: 201 });
  }

  if (request.method === "PUT") {
    const id = cleanText(input.id);
    const index = users.findIndex((user) => user.id === id);
    if (index < 0) return new Response("사용자를 찾을 수 없습니다.", { status: 404 });
    const validationError = validate(input, users, id);
    if (validationError) return new Response(validationError, { status: 400 });
    users[index] = {
      ...users[index],
      name: cleanText(input.name),
      maskedName: cleanText(input.maskedName),
      active: input.active ?? users[index].active,
      updatedAt: new Date().toISOString(),
    };
    await saveUsers(users);
    return Response.json(users);
  }

  if (request.method === "DELETE") {
    const id = cleanText(input.id);
    const index = users.findIndex((user) => user.id === id);
    if (index < 0) return new Response("사용자를 찾을 수 없습니다.", { status: 404 });
    users[index] = { ...users[index], active: false, updatedAt: new Date().toISOString() };
    await saveUsers(users);
    return Response.json(users);
  }

  return new Response("지원하지 않는 요청입니다.", { status: 405 });
}

export const config: Config = { path: "/api/admin/users" };
