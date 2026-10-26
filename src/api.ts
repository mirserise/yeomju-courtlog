import type { CourtNumber, CourtSettings, DashboardData, Reservation, TrackedUser } from "./types";

export async function fetchDashboard(): Promise<DashboardData> {
  const response = await fetch("/api/dashboard", { cache: "no-store" });
  if (!response.ok) throw new Error("대시보드 데이터를 불러오지 못했습니다.");
  return response.json();
}

const jsonHeaders: HeadersInit = { "Content-Type": "application/json" };

export async function fetchAdminUsers(): Promise<TrackedUser[]> {
  const response = await fetch("/api/admin/users", { credentials: "same-origin" });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export async function createAdminUser(input: Pick<TrackedUser, "name" | "maskedName">): Promise<TrackedUser[]> {
  const response = await fetch("/api/admin/users", {
    method: "POST",
    headers: jsonHeaders,
    credentials: "same-origin",
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export async function updateAdminUser(
  id: string,
  input: Pick<TrackedUser, "name" | "maskedName" | "active">,
): Promise<TrackedUser[]> {
  const response = await fetch("/api/admin/users", {
    method: "PUT",
    headers: jsonHeaders,
    credentials: "same-origin",
    body: JSON.stringify({ id, ...input }),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export async function deleteAdminUser(id: string): Promise<TrackedUser[]> {
  const response = await fetch("/api/admin/users", {
    method: "DELETE",
    headers: jsonHeaders,
    credentials: "same-origin",
    body: JSON.stringify({ id }),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export async function runCollection(): Promise<{ collected: number; active: number; added: number; changed: number }> {
  const response = await fetch("/api/admin/collect", {
    method: "POST",
    credentials: "same-origin",
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export async function updateCourtSettings(activeCourts: CourtNumber[]): Promise<CourtSettings> {
  const response = await fetch("/api/admin/settings", {
    method: "PUT",
    headers: jsonHeaders,
    credentials: "same-origin",
    body: JSON.stringify({ activeCourts }),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export async function updateReservationExclusions(ids: string[], excluded: boolean): Promise<Reservation[]> {
  const response = await fetch("/api/admin/reservations", {
    method: "PATCH",
    headers: jsonHeaders,
    credentials: "same-origin",
    body: JSON.stringify({ ids, excluded }),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}
