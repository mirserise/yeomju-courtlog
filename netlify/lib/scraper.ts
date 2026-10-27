import { load } from "cheerio";
import type { CourtNumber, Reservation, TrackedUser } from "../../src/types";
import { calculateFee } from "./fees";
import { preserveCollectedReservations } from "./reservations";

const START_TIMES = new Set(["17:00", "19:00", "21:00"]);
const END_TIMES = { "17:00": "19:00", "19:00": "21:00", "21:00": "23:00" } as const;

export interface ScrapedReservation {
  date: string;
  court: CourtNumber;
  startTime: "17:00" | "19:00" | "21:00";
  maskedName: string;
}

export function parseReservationPage(html: string, court: CourtNumber, users: TrackedUser[]): ScrapedReservation[] {
  const $ = load(html);
  const activeAliases = new Set(users.filter((user) => user.active).map((user) => user.maskedName));
  const result: ScrapedReservation[] = [];

  $("td.btn_pop[id]").each((_, dayElement) => {
    const date = $(dayElement).attr("id");
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return;

    $(dayElement).find("li b").each((__, labelElement) => {
      const text = $(labelElement).text().replace(/\s+/g, "").trim();
      const match = text.match(/^(.+?)\((\d{2}:\d{2})~/);
      if (!match) return;
      const [, maskedName, rawStartTime] = match;
      if (!START_TIMES.has(rawStartTime) || !activeAliases.has(maskedName)) return;
      result.push({
        date,
        court,
        startTime: rawStartTime as ScrapedReservation["startTime"],
        maskedName,
      });
    });
  });

  return result;
}

export function mergeSnapshot(
  previous: Reservation[],
  snapshot: ScrapedReservation[],
  users: TrackedUser[],
  collectedAt: string,
): Reservation[] {
  const userByAlias = new Map(users.filter((user) => user.active).map((user) => [user.maskedName, user]));
  const next = preserveCollectedReservations(previous);
  const byId = new Map(next.map((reservation) => [reservation.id, reservation]));

  for (const scraped of snapshot) {
    const user = userByAlias.get(scraped.maskedName);
    if (!user) continue;
    const id = `${scraped.date}-${scraped.court}-${scraped.startTime}-${user.id}`;
    const existing = byId.get(id);
    if (existing) {
      const fee = calculateFee(scraped.date, scraped.startTime);
      if (existing.status !== "reserved" || existing.fee !== fee) {
        existing.status = "reserved";
        existing.lastSeenAt = collectedAt;
        existing.fee = fee;
        delete existing.cancelledAt;
      }
      continue;
    }

    const reservation: Reservation = {
      id,
      date: scraped.date,
      court: scraped.court,
      startTime: scraped.startTime,
      endTime: END_TIMES[scraped.startTime],
      maskedName: scraped.maskedName,
      userId: user.id,
      status: "reserved",
      fee: calculateFee(scraped.date, scraped.startTime),
      firstSeenAt: collectedAt,
      lastSeenAt: collectedAt,
    };
    next.push(reservation);
    byId.set(id, reservation);
  }

  return next.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime) || a.court - b.court);
}

function seoulDateParts(now = new Date()): { today: string; months: Array<{ year: number; month: number }> } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const [year, month] = parts.split("-").map(Number);
  const next = new Date(Date.UTC(year, month, 1));
  return {
    today: parts,
    months: [
      { year, month },
      { year: next.getUTCFullYear(), month: next.getUTCMonth() + 1 },
    ],
  };
}

export async function scrapeCurrentReservations(
  users: TrackedUser[],
  activeCourts: CourtNumber[],
  now = new Date(),
): Promise<{ rows: ScrapedReservation[]; today: string }> {
  const { today, months } = seoulDateParts(now);
  const rows: ScrapedReservation[] = [];
  for (const { year, month } of months) {
    for (const court of activeCourts) {
      const url = `https://www.gwangjusportsinfo.org/reservation/reservation_view/2/${court}?year=${year}&month=${month}&agree=1`;
      let response = await fetchReservationPage(url);
      if (response.status >= 500) {
        await delay(750);
        response = await fetchReservationPage(url);
      }
      if (!response.ok) throw new Error(`염주테니스장 ${court}코트 조회 실패 (${response.status})`);
      rows.push(...parseReservationPage(await response.text(), court, users));
      await delay(250);
    }
  }
  return { rows, today };
}

function fetchReservationPage(url: string): Promise<Response> {
  return fetch(url, {
    headers: {
      "User-Agent": "Courtlog/1.0 (+public reservation dashboard; low-frequency fetch)",
      "Accept-Language": "ko-KR,ko;q=0.9",
    },
  });
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
