import { useEffect, useMemo, useState } from "react";
import { Activity, CalendarDays, ExternalLink, LockKeyhole, RefreshCcw, Trophy, Wallet } from "lucide-react";
import { fetchDashboard } from "./api";
import { AdminPage } from "./components/AdminPage";
import { CalendarView } from "./components/CalendarView";
import { SummaryView } from "./components/SummaryView";
import type { CourtNumber, DashboardData } from "./types";
import { addDays, isAuthCallbackHash, koreanDateTime, money, monthKey, toLocalISO } from "./utils";

const emptyDashboard: DashboardData = {
  users: [],
  reservations: [],
  notices: [],
  activeCourts: [1, 2, 3, 4],
  lastCollectedAt: null,
  collectionError: null,
  sourceUrl: "https://www.gwangjusportsinfo.org/reservation/reservation_view/2/1?agree=1",
};

export default function App() {
  if (window.location.pathname.startsWith("/admin") || isAuthCallbackHash(window.location.hash)) return <AdminPage />;
  return <Dashboard />;
}

function Dashboard() {
  const today = toLocalISO(new Date());
  const [data, setData] = useState<DashboardData>(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [month, setMonth] = useState(monthKey(new Date()));
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(addDays(today, 6));

  async function load() {
    setLoading(true);
    setError("");
    try {
      setData(await fetchDashboard());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const activeReservations = useMemo(
    () => data.reservations.filter((reservation) => reservation.status === "reserved" && !reservation.excludedAt),
    [data.reservations],
  );
  const periodReservations = activeReservations.filter((reservation) => reservation.date >= startDate && reservation.date <= endDate);
  const periodFee = periodReservations.reduce((sum, reservation) => sum + reservation.fee, 0);
  const courtLabel = formatCourtLabel(data.activeCourts);

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="코트로그 홈">
          <span className="brand-mark"><span /></span>
          <span><b>COURTLOG</b><small>YEOMJU TENNIS</small></span>
        </a>
        <nav>
          <a href="#calendar">예약 캘린더</a>
          <a href="#statement">이용내역</a>
          <a className="admin-link" href="/admin"><LockKeyhole size={15} /> 관리자</a>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow light">YEOMJU COURT {data.activeCourts.map((court) => String(court).padStart(2, "0")).join(" · ")}</p>
            <h1>저녁 코트의 기록을<br /><em>한눈에.</em></h1>
            <p className="hero-description">염주테니스장 {courtLabel}의 17시, 19시, 21시 예약과 이용금액을 매일 한 번 정리합니다.</p>
            <div className="hero-actions">
              <a className="primary-button lime" href="#calendar"><CalendarDays size={18} /> 예약 현황 보기</a>
              <a className="source-link" href={data.sourceUrl} target="_blank" rel="noreferrer">공식 예약 사이트 <ExternalLink size={15} /></a>
            </div>
          </div>
          <div className="court-art" aria-hidden="true">
            <div className="court-lines"><span className="net" /></div>
            <div className="tennis-ball" />
            <div className="court-label"><span>LIVE</span><b>{data.activeCourts.length} COURTS</b><small>17 · 19 · 21</small></div>
          </div>
        </section>

        <section className="stats-strip" aria-label="기간 요약">
          <article><span className="stat-icon"><Trophy size={20} /></span><div><small>추적 사용자</small><strong>{data.users.filter((user) => user.active).length}<em>명</em></strong></div></article>
          <article><span className="stat-icon"><Activity size={20} /></span><div><small>선택 기간 예약</small><strong>{periodReservations.length}<em>건</em></strong></div></article>
          <article><span className="stat-icon"><Wallet size={20} /></span><div><small>선택 기간 금액</small><strong>{money.format(periodFee)}</strong></div></article>
          <article className="updated-stat"><span className="pulse-dot" /><div><small>마지막 업데이트</small><strong>{data.lastCollectedAt ? koreanDateTime.format(new Date(data.lastCollectedAt)) : "수집 대기 중"}</strong></div></article>
        </section>

        {error && <div className="error-banner" role="alert"><span>{error}</span><button type="button" onClick={() => void load()}><RefreshCcw size={16} /> 다시 시도</button></div>}
        {data.collectionError && <div className="warning-banner" role="status">최근 자동 수집에 오류가 있었습니다. 마지막 정상 데이터를 표시합니다.</div>}

        <div id="calendar" className="anchor-offset" />
        {loading ? <LoadingPanel /> : <CalendarView month={month} onMonthChange={setMonth} reservations={data.reservations} notices={data.notices} users={data.users} courts={data.activeCourts} />}

        <div id="statement" className="anchor-offset" />
        {loading ? <LoadingPanel /> : (
          <SummaryView
            users={data.users}
            reservations={data.reservations}
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />
        )}
      </main>

      <footer>
        <div className="brand compact"><span className="brand-mark"><span /></span><span><b>COURTLOG</b><small>YEOMJU TENNIS</small></span></div>
        <p>광주체육시설 공개 예약정보를 매일 한 번 변경분 중심으로 정리합니다.</p>
        <a href="/admin"><LockKeyhole size={14} /> 사용자 관리</a>
      </footer>
    </div>
  );
}

function formatCourtLabel(courts: CourtNumber[]): string {
  if (courts.length === 4) return "1~4코트";
  return `${courts.map((court) => `${court}코트`).join(" · ")}`;
}

function LoadingPanel() {
  return (
    <section className="panel loading-panel" aria-label="불러오는 중">
      <RefreshCcw className="spin" size={24} />
      <p>예약 정보를 불러오고 있습니다.</p>
    </section>
  );
}
