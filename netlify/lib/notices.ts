const NOTICE_PREFIX = /^\s*\[공지\]\s*/;

export function cleanNoticeMessage(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(NOTICE_PREFIX, "").trim().replace(/\s+/g, " ");
}

export function isValidNoticeDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
