import { ChevronLeft, ChevronRight, Circle } from "lucide-react";
import type { Reservation, TrackedUser } from "../types";
import { getCalendarDays, parseLocalDate, shiftMonth } from "../utils";

interface CalendarViewProps {
  month: string;
  onMonthChange: (month: string) => void;
  reservations: Reservation[];
  users: TrackedUser[];
}

const userColors = ["mint", "sky", "sun"];

export function CalendarView({ month, onMonthChange, reservations, users }: CalendarViewProps) {
  const days = getCalendarDays(month);
  const [year, monthNumber] = month.split("-").map(Number);
  const userMap = new Map(users.map((user, index) => [user.id, { ...user, color: userColors[index % userColors.length] }]));
  const active = reservations.filter((reservation) => reservation.status === "reserved" && reservation.date.startsWith(month));

  return (
    <section className="panel calendar-panel" aria-labelledby="calendar-title">
      <div className="section-heading calendar-heading">
        <div>
          <p className="eyebrow">MONTHLY COURT VIEW</p>
          <h2 id="calendar-title">예약 캘린더</h2>
        </div>
        <div className="month-nav" aria-label="달 이동">
          <button type="button" className="icon-button" onClick={() => onMonthChange(shiftMonth(month, -1))} aria-label="이전 달">
            <ChevronLeft size={18} />
          </button>
          <strong>{year}년 {monthNumber}월</strong>
          <button type="button" className="icon-button" onClick={() => onMonthChange(shiftMonth(month, 1))} aria-label="다음 달">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="legend" aria-label="사용자 색상 안내">
        {users.filter((user) => user.active).map((user, index) => (
          <span key={user.id}><Circle className={`legend-dot ${userColors[index % userColors.length]}`} fill="currentColor" />{user.name}</span>
        ))}
      </div>

      <div className="calendar-scroll">
        <div className="calendar-grid calendar-weekdays" aria-hidden="true">
          {['일', '월', '화', '수', '목', '금', '토'].map((day) => <div key={day}>{day}</div>)}
        </div>
        <div className="calendar-grid calendar-days">
          {days.map((date, index) => {
            if (!date) return <div className="calendar-cell empty" key={`empty-${index}`} />;
            const dayReservations = active
              .filter((reservation) => reservation.date === date)
              .sort((a, b) => a.startTime.localeCompare(b.startTime) || a.court - b.court);
            const weekday = parseLocalDate(date).getDay();
            return (
              <article className={`calendar-cell ${weekday === 0 ? 'sunday' : ''} ${weekday === 6 ? 'saturday' : ''}`} key={date}>
                <time dateTime={date}>{Number(date.slice(-2))}</time>
                <div className="day-reservations">
                  {dayReservations.map((reservation) => {
                    const user = userMap.get(reservation.userId);
                    return (
                      <div className={`reservation-chip ${user?.color ?? 'mint'}`} key={reservation.id} title={`${user?.name ?? reservation.maskedName} · ${reservation.court}코트 · ${reservation.startTime}`}>
                        <span>{reservation.startTime.slice(0, 2)}시</span>
                        <b>{user?.name ?? reservation.maskedName}</b>
                        <small>{reservation.court}C</small>
                      </div>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
