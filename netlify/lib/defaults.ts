import type { TrackedUser } from "../../src/types";

const seededAt = "2026-10-26T00:00:00.000Z";

export const DEFAULT_USERS: TrackedUser[] = [
  { id: "baek-changbeom", name: "백창범", maskedName: "백*범", active: true, createdAt: seededAt, updatedAt: seededAt },
  { id: "jang-sahyeon", name: "장사현", maskedName: "장*현", active: true, createdAt: seededAt, updatedAt: seededAt },
  { id: "yu-junho", name: "유준호", maskedName: "유*호", active: true, createdAt: seededAt, updatedAt: seededAt },
];

export const SOURCE_URL = "https://www.gwangjusportsinfo.org/reservation/reservation_view/2/1?agree=1";
