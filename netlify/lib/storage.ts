import { getStore } from "@netlify/blobs";
import type { CalendarNotice, CourtSettings, Reservation, TrackedUser } from "../../src/types";
import { DEFAULT_USERS } from "./defaults";
import type { ReservationExclusions } from "./exclusions";
import { DEFAULT_COURT_SETTINGS, normalizeActiveCourts } from "./settings";

interface CollectionMeta {
  lastCollectedAt: string | null;
  collectionError: string | null;
}

const store = () => getStore({ name: "courtlog-data", consistency: "strong" });

export async function getUsers(): Promise<TrackedUser[]> {
  return (await store().get("users", { type: "json" }) as TrackedUser[] | null) ?? DEFAULT_USERS;
}

export async function saveUsers(users: TrackedUser[]): Promise<void> {
  await store().setJSON("users", users);
}

export async function getReservations(): Promise<Reservation[]> {
  return (await store().get("reservations", { type: "json" }) as Reservation[] | null) ?? [];
}

export async function saveReservations(reservations: Reservation[]): Promise<void> {
  await store().setJSON("reservations", reservations);
}

export async function getReservationExclusions(): Promise<ReservationExclusions> {
  return (await store().get("reservation-exclusions", { type: "json" }) as ReservationExclusions | null) ?? {};
}

export async function saveReservationExclusions(exclusions: ReservationExclusions): Promise<void> {
  await store().setJSON("reservation-exclusions", exclusions);
}

export async function getCourtSettings(): Promise<CourtSettings> {
  const saved = await store().get("court-settings", { type: "json" }) as CourtSettings | null;
  const activeCourts = normalizeActiveCourts(saved?.activeCourts);
  return activeCourts
    ? { activeCourts, updatedAt: saved?.updatedAt ?? null }
    : { ...DEFAULT_COURT_SETTINGS, activeCourts: [...DEFAULT_COURT_SETTINGS.activeCourts] };
}

export async function saveCourtSettings(settings: CourtSettings): Promise<void> {
  await store().setJSON("court-settings", settings);
}

export async function getNotices(): Promise<CalendarNotice[]> {
  const { blobs } = await store().list({ prefix: "notices/" });
  const notices = await Promise.all(
    blobs.map((blob) => store().get(blob.key, { type: "json" }) as Promise<CalendarNotice | null>),
  );
  return notices
    .filter((notice): notice is CalendarNotice => Boolean(notice))
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
}

export async function saveNotice(notice: CalendarNotice): Promise<void> {
  await store().setJSON(`notices/${notice.id}`, notice);
}

export async function deleteNotice(id: string): Promise<void> {
  await store().delete(`notices/${id}`);
}

export async function getCollectionMeta(): Promise<CollectionMeta> {
  return (await store().get("collection-meta", { type: "json" }) as CollectionMeta | null) ?? {
    lastCollectedAt: null,
    collectionError: null,
  };
}

export async function saveCollectionMeta(meta: CollectionMeta): Promise<void> {
  await store().setJSON("collection-meta", meta);
}
