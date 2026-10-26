import type { CourtNumber, CourtSettings } from "../../src/types";

export const ALL_COURTS: CourtNumber[] = [1, 2, 3, 4];

export const DEFAULT_COURT_SETTINGS: CourtSettings = {
  activeCourts: [...ALL_COURTS],
  updatedAt: null,
};

export function normalizeActiveCourts(value: unknown): CourtNumber[] | null {
  if (!Array.isArray(value)) return null;
  const unique = [...new Set(value)].filter(
    (court): court is CourtNumber => typeof court === "number" && ALL_COURTS.includes(court as CourtNumber),
  );
  if (unique.length !== value.length || unique.length === 0) return null;
  return unique.sort((a, b) => a - b);
}
