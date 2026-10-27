import { getCollectionMeta, getCourtSettings, getReservations, getUsers, saveCollectionMeta, saveReservations } from "./storage";
import { mergeSnapshot, scrapeCurrentReservations } from "./scraper";

export interface CollectionResult {
  collected: number;
  active: number;
  added: number;
  changed: number;
}

export async function collectReservations(): Promise<CollectionResult> {
  const collectedAt = new Date().toISOString();
  try {
    const [users, previous, settings] = await Promise.all([getUsers(), getReservations(), getCourtSettings()]);
    const { rows } = await scrapeCurrentReservations(users, settings.activeCourts);
    const merged = mergeSnapshot(previous, rows, users, collectedAt);
    const previousById = new Map(previous.map((reservation) => [reservation.id, reservation]));
    const added = merged.filter((reservation) => !previousById.has(reservation.id)).length;
    const changed = merged.filter((reservation) => {
      const old = previousById.get(reservation.id);
      return old && JSON.stringify(old) !== JSON.stringify(reservation);
    }).length;
    const writes: Promise<void>[] = [saveCollectionMeta({ lastCollectedAt: collectedAt, collectionError: null })];
    if (added > 0 || changed > 0) writes.push(saveReservations(merged));
    await Promise.all(writes);
    return {
      collected: rows.length,
      active: merged.filter((reservation) => reservation.status === "reserved" && settings.activeCourts.includes(reservation.court)).length,
      added,
      changed,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 수집 오류";
    const previousMeta = await getCollectionMeta();
    await saveCollectionMeta({ lastCollectedAt: previousMeta.lastCollectedAt, collectionError: message });
    throw error;
  }
}
