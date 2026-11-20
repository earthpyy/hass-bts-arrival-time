import type { Language } from "./types";

export interface Strings {
  arriving: string;
  noService: string;
  directionMissing: string;
  unavailable: string;
  min: string;
  updatedJustNow: string;
  updatedAgo: (n: number) => string;
  refresh: string;
}

export const STRINGS: Record<Language, Strings> = {
  en: {
    arriving: "Arriving",
    noService: "No service",
    directionMissing: "Direction not found",
    unavailable: "Unavailable",
    min: "min",
    updatedJustNow: "Updated just now",
    updatedAgo: (n) => `Updated ${n} min ago`,
    refresh: "Refresh",
  },
  th: {
    arriving: "มาถึงแล้ว",
    noService: "ไม่มีบริการ",
    directionMissing: "ไม่พบทิศทาง",
    unavailable: "ไม่พร้อมใช้งาน",
    min: "นาที",
    updatedJustNow: "อัปเดตเมื่อสักครู่",
    updatedAgo: (n) => `อัปเดต ${n} นาทีที่แล้ว`,
    refresh: "รีเฟรช",
  },
};
