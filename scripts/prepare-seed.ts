import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { DEFAULT_USERS } from "../netlify/lib/defaults";
import { mergeSnapshot, scrapeCurrentReservations } from "../netlify/lib/scraper";

const outputDirectory = resolve(process.argv[2] ?? "/tmp/courtlog-seed");
const collectedAt = new Date().toISOString();
const { rows, today } = await scrapeCurrentReservations(DEFAULT_USERS);
const reservations = mergeSnapshot([], rows, DEFAULT_USERS, collectedAt, today);

await mkdir(outputDirectory, { recursive: true });
await Promise.all([
  writeFile(resolve(outputDirectory, "users.json"), JSON.stringify(DEFAULT_USERS)),
  writeFile(resolve(outputDirectory, "reservations.json"), JSON.stringify(reservations)),
  writeFile(resolve(outputDirectory, "collection-meta.json"), JSON.stringify({ lastCollectedAt: collectedAt, collectionError: null })),
]);

console.log(`Prepared ${reservations.length} reservations in ${outputDirectory}`);
