import Holidays from "date-holidays";

const holidays = new Holidays("KR");

export function calculateFee(date: string, startTime: string): number {
  const parsed = new Date(`${date}T12:00:00+09:00`);
  const day = parsed.getUTCDay();
  const premiumDay = day === 0 || day === 6 || Boolean(holidays.isHoliday(parsed));

  if (startTime === "17:00") {
    const month = Number(date.slice(5, 7));
    const summer = month >= 4 && month <= 9;
    if (summer) return premiumDay ? 15_000 : 10_000;
    return premiumDay ? 17_500 : 12_500;
  }

  return premiumDay ? 20_000 : 15_000;
}
