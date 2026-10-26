import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, CloudDownload, Eye, EyeOff, LogIn, LogOut, Pencil, Plus, RefreshCcw, RotateCcw, Trash2, UserRoundCog } from "lucide-react";
import { getUser, handleAuthCallback, login, logout, onAuthChange, type User } from "@netlify/identity";
import { createAdminUser, deleteAdminUser, fetchAdminUsers, fetchDashboard, runCollection, updateAdminUser, updateReservationExclusions } from "../api";
import type { Reservation, TrackedUser } from "../types";
import { monthKey } from "../utils";
import { CalendarView } from "./CalendarView";

interface DraftUser {
  name: string;
  maskedName: string;
}

const emptyDraft: DraftUser = { name: "", maskedName: "" };

export function AdminPage() {
  const [identityUser, setIdentityUser] = useState<User | null>(null);
  const [users, setUsers] = useState<TrackedUser[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [month, setMonth] = useState(monthKey(new Date()));
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showExcluded, setShowExcluded] = useState(false);
  const [draft, setDraft] = useState<DraftUser>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authReady, setAuthReady] = useState(false);
  const reservationById = useMemo(
    () => new Map(reservations.map((reservation) => [reservation.id, reservation])),
    [reservations],
  );
  const selectedActiveCount = [...selectedIds].filter((id) => !reservationById.get(id)?.excludedAt).length;
  const selectedExcludedCount = [...selectedIds].filter((id) => Boolean(reservationById.get(id)?.excludedAt)).length;

  const loadAdminData = useCallback(async () => {
    try {
      const [adminUsers, dashboard] = await Promise.all([fetchAdminUsers(), fetchDashboard()]);
      setUsers(adminUsers);
      setReservations(dashboard.reservations);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "관리 정보를 불러오지 못했습니다.");
    }
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        await handleAuthCallback();
        const user = await getUser();
        if (active) setIdentityUser(user);
      } catch (error) {
        if (active) setMessage(error instanceof Error ? error.message : "로그인 상태를 확인하지 못했습니다.");
      } finally {
        if (active) setAuthReady(true);
      }
    })();
    const unsubscribe = onAuthChange((_event, user) => setIdentityUser(user));
    return () => { active = false; unsubscribe(); };
  }, []);

  useEffect(() => {
    if (identityUser) void loadAdminData();
  }, [identityUser, loadAdminData]);

  async function submitUser(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      if (editingId) {
        const current = users.find((user) => user.id === editingId)!;
        setUsers(await updateAdminUser(editingId, { ...draft, active: current.active }));
        setMessage("사용자 정보가 변경되었습니다.");
      } else {
        setUsers(await createAdminUser(draft));
        setMessage("새 사용자가 등록되었습니다.");
      }
      setDraft(emptyDraft);
      setEditingId(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "저장 중 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleUser(user: TrackedUser) {
    setBusy(true);
    try {
      setUsers(await updateAdminUser(user.id, { name: user.name, maskedName: user.maskedName, active: !user.active }));
      setMessage(user.active ? "사용자를 비활성화했습니다." : "사용자를 다시 활성화했습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "변경 중 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function removeUser(user: TrackedUser) {
    if (!window.confirm(`${user.name} 사용자를 비활성화할까요? 과거 예약은 유지됩니다.`)) return;
    setBusy(true);
    try {
      setUsers(await deleteAdminUser(user.id));
      setMessage("사용자를 비활성화했습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "삭제 중 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function collectNow() {
    setBusy(true);
    setMessage("염주테니스장 예약을 수집하고 있습니다…");
    try {
      const result = await runCollection();
      await loadAdminData();
      setMessage(`수집 완료: ${result.collected}건 확인, 현재 예약 ${result.active}건`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "수집 중 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const user = await login(email.trim(), password);
      setIdentityUser(user);
      setPassword("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "로그인에 실패했습니다.");
    } finally {
      setBusy(false);
      setAuthReady(true);
    }
  }

  async function signOut() {
    setBusy(true);
    try {
      await logout();
      setIdentityUser(null);
      setUsers([]);
      setReservations([]);
      setSelectedIds(new Set());
    } finally {
      setBusy(false);
    }
  }

  function toggleReservation(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function changeReservationExclusions(excluded: boolean) {
    const ids = reservations
      .filter((reservation) => selectedIds.has(reservation.id) && Boolean(reservation.excludedAt) !== excluded)
      .map((reservation) => reservation.id);
    if (ids.length === 0) return;
    if (excluded && !window.confirm(`선택한 예약 ${ids.length}건을 금액 및 예약 건수 집계에서 제외할까요?`)) return;

    setBusy(true);
    setMessage("");
    try {
      setReservations(await updateReservationExclusions(ids, excluded));
      setSelectedIds((current) => {
        const next = new Set(current);
        ids.forEach((id) => next.delete(id));
        return next;
      });
      setMessage(excluded
        ? `${ids.length}건을 집계에서 제외했습니다. ‘제외 내역 보기’에서 복구할 수 있습니다.`
        : `${ids.length}건을 다시 집계에 포함했습니다.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "예약 변경 중 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  if (!identityUser) {
    return (
      <main className="admin-shell login-shell">
        <a className="back-link" href="/"><ArrowLeft size={17} /> 대시보드로 돌아가기</a>
        <section className="login-card">
          <div className="admin-mark"><UserRoundCog size={28} /></div>
          <p className="eyebrow">PRIVATE ADMIN</p>
          <h1>사용자 관리</h1>
          <p>예약자 이름 연결과 데이터 수집은 초대된 관리자만 변경할 수 있습니다.</p>
          <form className="login-form" onSubmit={signIn}>
            <label>이메일<input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
            <label>비밀번호<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
            <button className="primary-button" type="submit" disabled={busy || !authReady}>
              {busy ? <RefreshCcw className="spin" size={18} /> : <LogIn size={18} />} 관리자 로그인
            </button>
          </form>
          {message && <p className="login-error" role="alert">{message}</p>}
        </section>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <a className="back-link" href="/"><ArrowLeft size={17} /> 대시보드로 돌아가기</a>
          <p className="eyebrow">PRIVATE ADMIN</p>
          <h1>관리자 설정</h1>
          <p>사용자 연결과 예약 집계 제외 내역을 관리합니다.</p>
        </div>
        <button className="ghost-button" type="button" onClick={() => void signOut()}><LogOut size={17} /> 로그아웃</button>
      </header>

      <div className="admin-grid">
        <section className="panel admin-form-panel">
          <div className="section-heading"><div><p className="eyebrow">USER MAPPING</p><h2>{editingId ? "사용자 변경" : "사용자 추가"}</h2></div></div>
          <form className="admin-form" onSubmit={submitUser}>
            <label>실제 이름<input required maxLength={30} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="예: 백창범" /></label>
            <label>사이트 표시 이름<input required maxLength={30} value={draft.maskedName} onChange={(event) => setDraft({ ...draft, maskedName: event.target.value })} placeholder="예: 백*범" /></label>
            <button className="primary-button" type="submit" disabled={busy}><Plus size={18} /> {editingId ? "변경 저장" : "사용자 등록"}</button>
            {editingId && <button className="text-button" type="button" onClick={() => { setEditingId(null); setDraft(emptyDraft); }}>취소</button>}
          </form>
        </section>

        <section className="panel admin-users-panel">
          <div className="section-heading">
            <div><p className="eyebrow">TRACKED PLAYERS</p><h2>등록 사용자</h2></div>
            <span className="count-badge">{users.filter((user) => user.active).length}명 활성</span>
          </div>
          <div className="admin-user-list">
            {users.map((user) => (
              <article className={`admin-user-row ${user.active ? "" : "inactive"}`} key={user.id}>
                <div className="avatar">{user.name.slice(0, 1)}</div>
                <div className="user-identity"><b>{user.name}</b><span>{user.maskedName}</span></div>
                <button className="status-toggle" type="button" onClick={() => void toggleUser(user)}>{user.active ? "활성" : "비활성"}</button>
                <button className="icon-button" type="button" aria-label={`${user.name} 수정`} onClick={() => { setEditingId(user.id); setDraft({ name: user.name, maskedName: user.maskedName }); }}><Pencil size={16} /></button>
                <button className="icon-button danger" type="button" aria-label={`${user.name} 삭제`} onClick={() => void removeUser(user)}><Trash2 size={16} /></button>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="reservation-admin-block" aria-labelledby="reservation-admin-title">
        <div className="panel reservation-toolbar">
          <div>
            <p className="eyebrow">RESERVATION CONTROL</p>
            <h2 id="reservation-admin-title">달력에서 집계 제외</h2>
            <p>예약을 체크한 뒤 제외하면 공개 달력·예약 건수·금액 계산에서 빠집니다. 원본은 보존되어 언제든 복구할 수 있습니다.</p>
          </div>
          <div className="reservation-actions">
            <button className="ghost-button" type="button" onClick={() => { setShowExcluded((current) => !current); setSelectedIds(new Set()); }}>
              {showExcluded ? <EyeOff size={17} /> : <Eye size={17} />} {showExcluded ? "제외 내역 숨기기" : "제외 내역 보기"}
            </button>
            <button
              className="secondary-button danger-action"
              type="button"
              disabled={busy || selectedActiveCount === 0}
              onClick={() => void changeReservationExclusions(true)}
            >
              <Trash2 size={17} /> 선택 예약 제외{selectedActiveCount > 0 ? ` (${selectedActiveCount})` : ""}
            </button>
            {showExcluded && (
              <button
                className="secondary-button"
                type="button"
                disabled={busy || selectedExcludedCount === 0}
                onClick={() => void changeReservationExclusions(false)}
              >
                <RotateCcw size={17} /> 선택 예약 복구{selectedExcludedCount > 0 ? ` (${selectedExcludedCount})` : ""}
              </button>
            )}
          </div>
        </div>
        <CalendarView
          month={month}
          onMonthChange={(nextMonth) => { setMonth(nextMonth); setSelectedIds(new Set()); }}
          reservations={reservations}
          users={users}
          selectable
          selectedIds={selectedIds}
          onToggleSelection={toggleReservation}
          showExcluded={showExcluded}
        />
      </section>

      <section className="panel collect-panel">
        <div><CloudDownload size={22} /><div><h2>예약 데이터 수집</h2><p>자동 수집은 매일 01:10, 09:10, 17:10에 실행됩니다.</p></div></div>
        <button className="secondary-button" type="button" disabled={busy} onClick={() => void collectNow()}><RefreshCcw className={busy ? "spin" : ""} size={17} /> 지금 수집</button>
      </section>
      {message && <p className="toast" role="status">{message}</p>}
    </main>
  );
}
