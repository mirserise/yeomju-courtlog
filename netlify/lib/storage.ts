import { getStore } from "@netlify/blobs";
import type { Reservation, TrackedUser } from "../../src/types";
import { DEFAULT_USERS } from "./defaults";
import type { ReservationExclusions } from "./exclusions";

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

export async function getCollectionMeta(): Promise<CollectionMeta> {
  return (await store().get("collection-meta", { type: "json" }) as CollectionMeta | null) ?? {
    lastCollectedAt: null,
    collectionError: null,
  };
}

export async function saveCollectionMeta(meta: CollectionMeta): Promise<void> {
  await store().setJSON("collection-meta", meta);
}
