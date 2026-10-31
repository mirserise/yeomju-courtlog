export type ReservationStatus = "reserved" | "cancelled";
export type CourtNumber = 1 | 2 | 3 | 4;

export interface CourtSettings {
  activeCourts: CourtNumber[];
  updatedAt: string | null;
}

export interface TrackedUser {
  id: string;
  name: string;
  maskedName: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Reservation {
  id: string;
  date: string;
  court: CourtNumber;
  startTime: "17:00" | "19:00" | "21:00";
  endTime: "19:00" | "21:00" | "23:00";
  maskedName: string;
  userId: string;
  status: ReservationStatus;
  fee: number;
  firstSeenAt: string;
  lastSeenAt: string;
  cancelledAt?: string;
  excludedAt?: string;
}

export interface CalendarNotice {
  id: string;
  date: string;
  message: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardData {
  users: TrackedUser[];
  reservations: Reservation[];
  notices: CalendarNotice[];
  activeCourts: CourtNumber[];
  lastCollectedAt: string | null;
  collectionError: string | null;
  sourceUrl: string;
}
