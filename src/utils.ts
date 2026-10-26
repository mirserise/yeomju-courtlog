export const money = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
  maximumFractionDigits: 0,
});

export const koreanDate = new Intl.DateTimeFormat("ko-KR", {
  month: "long",
  day: "numeric",
  weekday: "short",
});

export const koreanDateTime = new Intl.DateTimeFormat("ko-KR", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Seoul",
});

export function toLocalISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseLocalDate(value: string): Date {
  return new Date(`${value}T12:00:00`);
}

export function addDays(value: string, amount: number): string {
  const date = parseLocalDate(value);
  date.setDate(date.getDate() + amount);
  return toLocalISO(date);
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function isAuthCallbackHash(hash: string): boolean {
  return /^#(?:confirmation_token|recovery_token|invite_token|email_change_token|access_token)=/.test(hash);
}

export function shiftMonth(key: string, amount: number): string {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(year, month - 1 + amount, 1);
  return monthKey(date);
}

export function getCalendarDays(key: string): Array<string | null> {
  const [year, month] = key.split("-").map(Number);
  const first = new Date(year, month - 1, 1);
  const total = new Date(year, month, 0).getDate();
  const result: Array<string | null> = Array(first.getDay()).fill(null);
  for (let day = 1; day <= total; day += 1) {
    result.push(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
  }
  while (result.length % 7) result.push(null);
  return result;
}
