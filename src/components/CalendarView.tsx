import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Circle } from "lucide-react";
import type { CourtNumber, Reservation, TrackedUser } from "../types";
import { getCalendarDays, parseLocalDate, shiftMonth } from "../utils";

interface CalendarViewProps {
  month: string;
  onMonthChange: (month: string) => void;
  reservations: Reservation[];
  users: TrackedUser[];
  selectable?: boolean;
  selectedIds?: ReadonlySet<string>;
  onToggleSelection?: (id: string) => void;
  showExcluded?: boolean;
  onCourtChange?: (court: number | "all") => void;
  courts?: CourtNumber[];
}

const userColors = ["mint", "sky", "sun"];
const allCourts: CourtNumber[] = [1, 2, 3, 4];
const emptySelectedIds = new Set<string>();

export function CalendarView({
  month,
  onMonthChange,
  reservations,
  users,
  selectable = false,
  selectedIds = emptySelectedIds,
  onToggleSelection,
  showExcluded = false,
  onCourtChange,
  courts = allCourts,
}: CalendarViewProps) {
  const [selectedCourt, setSelectedCourt] = useState<number | "all">("all");
  const days = getCalendarDays(month);
  const [year, monthNumber] = month.split("-").map(Number);
  const userMap = new Map(users.map((user, index) => [user.id, { ...user, color: userColors[index % userColors.length] }]));
  const monthlyReservations = reservations.filter((reservation) => (
    reservation.status === "reserved"
    && reservation.date.startsWith(month)
    && (showExcluded || !reservation.excludedAt)
  ));
  const active = selectedCourt === "all"
    ? monthlyReservations
    : monthlyReservations.filter((reservation) => reservation.court === selectedCourt);

  useEffect(() => {
    if (selectedCourt !== "all" && !courts.includes(selectedCourt as CourtNumber)) {
      setSelectedCourt("all");
      onCourtChange?.("all");
    }
  }, [courts, onCourtChange, selectedCourt]);

  function selectCourt(court: number | "all") {
    setSelectedCourt(court);
    onCourtChange?.(court);
  }

  return (
    <section className="panel calendar-panel" aria-labelledby="calendar-title">
      <div className="section-heading calendar-heading">
        <div>
          <p className="eyebrow">MONTHLY COURT VIEW</p>
          <h2 id="calendar-title">{selectable ? "예약 선택 관리" : "예약 캘린더"}</h2>
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

      <div className="court-tabs" aria-label="코트 선택">
        <button
          type="button"
          className={selectedCourt === "all" ? "active" : ""}
          aria-pressed={selectedCourt === "all"}
          onClick={() => selectCourt("all")}
        >
          <span>전체</span>
          <small>{monthlyReservations.length}건</small>
        </button>
        {courts.map((court) => {
          const count = monthlyReservations.filter((reservation) => reservation.court === court).length;
          return (
            <button
              type="button"
              className={selectedCourt === court ? "active" : ""}
              aria-pressed={selectedCourt === court}
              onClick={() => selectCourt(court)}
              key={court}
            >
              <span>실외 {court}번</span>
              <small>{count}건</small>
            </button>
          );
        })}
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
                    const className = `reservation-chip ${selectable ? "selectable-chip" : ""} ${user?.color ?? "mint"} ${reservation.excludedAt ? "excluded" : ""} ${selectedIds.has(reservation.id) ? "selected" : ""}`;
                    const title = `${user?.name ?? reservation.maskedName} · ${reservation.court}코트 · ${reservation.startTime}${reservation.excludedAt ? " · 집계 제외" : ""}`;
                    const details = (
                      <>
                        <span>{reservation.startTime.slice(0, 2)}시</span>
                        <b>{user?.name ?? reservation.maskedName}</b>
                        <small>{reservation.excludedAt ? "제외" : selectedCourt === "all" ? `${reservation.court}C` : "예약"}</small>
                      </>
                    );
                    if (selectable) {
                      return (
                        <label className={className} key={reservation.id} title={title}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(reservation.id)}
                            onChange={() => onToggleSelection?.(reservation.id)}
                            aria-label={`${user?.name ?? reservation.maskedName} ${reservation.date} ${reservation.startTime} ${reservation.court}코트 선택`}
                          />
                          {details}
                        </label>
                      );
                    }
                    return <div className={className} key={reservation.id} title={title}>{details}</div>;
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
