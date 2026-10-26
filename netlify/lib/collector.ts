import { getCollectionMeta, getReservations, getUsers, saveCollectionMeta, saveReservations } from "./storage";
import { mergeSnapshot, scrapeCurrentReservations } from "./scraper";

export async function collectReservations(): Promise<{ collected: number; active: number }> {
  const collectedAt = new Date().toISOString();
  try {
    const [users, previous] = await Promise.all([getUsers(), getReservations()]);
    const { rows, today } = await scrapeCurrentReservations(users);
    const merged = mergeSnapshot(previous, rows, users, collectedAt, today);
    await Promise.all([
      saveReservations(merged),
      saveCollectionMeta({ lastCollectedAt: collectedAt, collectionError: null }),
    ]);
    return {
      collected: rows.length,
      active: merged.filter((reservation) => reservation.status === "reserved").length,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 수집 오류";
    const previousMeta = await getCollectionMeta();
    await saveCollectionMeta({ lastCollectedAt: previousMeta.lastCollectedAt, collectionError: message });
    throw error;
  }
}
