import { CalendarRange, Clock3, WalletCards } from "lucide-react";
import type { Reservation, TrackedUser } from "../types";
import { koreanDate, money, parseLocalDate } from "../utils";

interface SummaryViewProps {
  users: TrackedUser[];
  reservations: Reservation[];
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
}

export function SummaryView({ users, reservations, startDate, endDate, onStartDateChange, onEndDateChange }: SummaryViewProps) {
  const selected = reservations
    .filter((reservation) => reservation.status === "reserved" && !reservation.excludedAt && reservation.date >= startDate && reservation.date <= endDate)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  return (
    <section className="panel summary-panel" aria-labelledby="summary-title">
      <div className="section-heading summary-heading">
        <div>
          <p className="eyebrow">PLAYER STATEMENT</p>
          <h2 id="summary-title">기간별 이용내역</h2>
        </div>
        <div className="date-range">
          <label>시작일<input type="date" value={startDate} onChange={(event) => onStartDateChange(event.target.value)} /></label>
          <span>—</span>
          <label>종료일<input type="date" value={endDate} min={startDate} onChange={(event) => onEndDateChange(event.target.value)} /></label>
        </div>
      </div>

      <div className="user-summary-grid">
        {users.filter((user) => user.active).map((user) => {
          const rows = selected.filter((reservation) => reservation.userId === user.id);
          const total = rows.reduce((sum, reservation) => sum + reservation.fee, 0);
          return (
            <article className="user-summary-card" key={user.id}>
              <header>
                <div className="avatar">{user.name.slice(0, 1)}</div>
                <div><h3>{user.name}</h3><p>{user.maskedName}</p></div>
                <strong>{money.format(total)}</strong>
              </header>
              <div className="mini-stats">
                <span><CalendarRange size={15} /> {rows.length}건</span>
                <span><Clock3 size={15} /> {rows.length * 2}시간</span>
              </div>
              <div className="statement-list">
                {rows.length === 0 ? (
                  <p className="empty-state">선택한 기간에 예약이 없습니다.</p>
                ) : rows.map((reservation) => (
                  <div className="statement-row" key={reservation.id}>
                    <div>
                      <b>{koreanDate.format(parseLocalDate(reservation.date))}</b>
                      <span>{reservation.startTime} · {reservation.court}코트</span>
                    </div>
                    <strong>{money.format(reservation.fee)}</strong>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>

      <div className="summary-total">
        <div><WalletCards size={20} /><span>선택 기간 전체 이용금액</span></div>
        <strong>{money.format(selected.reduce((sum, reservation) => sum + reservation.fee, 0))}</strong>
      </div>
    </section>
  );
}
