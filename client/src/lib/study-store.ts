"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  Rating,
  State,
  type Card,
  type Grade,
} from "ts-fsrs";

/**
 * Tiến trình học (lịch ôn FSRS, từ yêu thích, cài đặt) là dữ liệu cá nhân nên
 * được lưu trong trình duyệt (localStorage). Nội dung từ/câu vẫn nằm trong Strapi.
 */

export interface StoredCard {
  due: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: State;
  last_review?: string;
  introducedAt: string;
}

export interface StudySettings {
  newPerDay: number;
  showRomaji: boolean;
  autoplay: boolean;
  voiceURI: string | null;
  rate: number;
  reduceMotion: boolean;
}

export type StudyStatus = "new" | "learning" | "known";

interface StudyState {
  cards: Record<string, StoredCard>;
  favorites: Record<string, true>;
  settings: StudySettings;
  grade: (id: string, rating: Grade) => void;
  toggleFavorite: (id: string) => void;
  updateSettings: (patch: Partial<StudySettings>) => void;
  importData: (data: unknown) => boolean;
  resetProgress: () => void;
}

export const DEFAULT_SETTINGS: StudySettings = {
  newPerDay: 5,
  showRomaji: true,
  autoplay: false,
  voiceURI: null,
  rate: 0.9,
  reduceMotion: false,
};

export const scheduler = fsrs(generatorParameters({ enable_fuzz: true }));

export const GRADES: { rating: Grade; label: string; tone: "vermilion" | "gold" | "indigo" | "matcha" }[] = [
  { rating: Rating.Again, label: "Quên", tone: "vermilion" },
  { rating: Rating.Hard, label: "Khó", tone: "gold" },
  { rating: Rating.Good, label: "Được", tone: "indigo" },
  { rating: Rating.Easy, label: "Dễ", tone: "matcha" },
];

export function toCard(stored: StoredCard): Card {
  return {
    ...stored,
    due: new Date(stored.due),
    last_review: stored.last_review ? new Date(stored.last_review) : undefined,
  };
}

function fromCard(card: Card, introducedAt: string): StoredCard {
  return {
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    learning_steps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: card.last_review?.toISOString(),
    introducedAt,
  };
}

/** Thời điểm ôn tiếp theo cho từng mức đánh giá (dùng để hiện “1 ngày”, “10 phút”…). */
export function previewIntervals(stored: StoredCard | undefined, now = new Date()): Record<number, Date> {
  const card = stored ? toCard(stored) : createEmptyCard(now);
  const preview = scheduler.repeat(card, now);
  const out: Record<number, Date> = {};
  for (const g of GRADES) out[g.rating] = preview[g.rating].card.due;
  return out;
}

export function statusOf(stored: StoredCard | undefined): StudyStatus {
  if (!stored) return "new";
  if (stored.state === State.Review && stored.scheduled_days >= 21) return "known";
  return "learning";
}

export const STATUS_LABEL: Record<StudyStatus, string> = {
  new: "Chưa học",
  learning: "Đang nhớ",
  known: "Đã thuộc",
};

export function isDue(stored: StoredCard | undefined, now = new Date()): boolean {
  return !!stored && new Date(stored.due).getTime() <= now.getTime();
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** “< 1 phút”, “10 phút”, “3 giờ”, “4 ngày”, “2 tháng”. */
export function formatInterval(to: Date, from = new Date()): string {
  const minutes = Math.round((to.getTime() - from.getTime()) / 60000);
  if (minutes < 1) return "< 1 phút";
  if (minutes < 60) return `${minutes} phút`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} giờ`;
  const days = Math.round(hours / 24);
  if (days < 31) return `${days} ngày`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} tháng`;
  return `${Math.round(months / 12)} năm`;
}

/** “Hôm nay”, “Ngày mai”, “3 ngày nữa”. */
export function formatDueDay(dueIso: string, now = new Date()): string {
  const due = new Date(dueIso);
  if (due.getTime() <= now.getTime() || isSameDay(due, now)) return "Hôm nay";
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
  const days = Math.round((startOfDue - startOfToday) / 86400000);
  if (days === 1) return "Ngày mai";
  if (days < 14) return `${days} ngày nữa`;
  if (days < 60) return `${Math.round(days / 7)} tuần nữa`;
  return `${Math.round(days / 30)} tháng nữa`;
}

function isStoredCard(v: unknown): v is StoredCard {
  if (!v || typeof v !== "object") return false;
  const c = v as Record<string, unknown>;
  return typeof c.due === "string" && typeof c.stability === "number" && typeof c.state === "number";
}

export const useStudy = create<StudyState>()(
  persist(
    (set) => ({
      cards: {},
      favorites: {},
      settings: DEFAULT_SETTINGS,
      grade: (id, rating) =>
        set((state) => {
          const now = new Date();
          const existing = state.cards[id];
          const card = existing ? toCard(existing) : createEmptyCard(now);
          const next = scheduler.next(card, now, rating).card;
          return {
            cards: { ...state.cards, [id]: fromCard(next, existing?.introducedAt ?? now.toISOString()) },
          };
        }),
      toggleFavorite: (id) =>
        set((state) => {
          const favorites = { ...state.favorites };
          if (favorites[id]) delete favorites[id];
          else favorites[id] = true;
          return { favorites };
        }),
      updateSettings: (patch) => set((state) => ({ settings: { ...state.settings, ...patch } })),
      importData: (data) => {
        if (!data || typeof data !== "object") return false;
        const d = data as { cards?: unknown; favorites?: unknown; settings?: unknown };
        const cards: Record<string, StoredCard> = {};
        if (d.cards && typeof d.cards === "object") {
          for (const [k, v] of Object.entries(d.cards as Record<string, unknown>)) {
            if (isStoredCard(v)) cards[k] = { ...v, introducedAt: v.introducedAt ?? v.due };
          }
        }
        const favorites: Record<string, true> = {};
        if (d.favorites && typeof d.favorites === "object") {
          for (const k of Object.keys(d.favorites as object)) favorites[k] = true;
        }
        const settings =
          d.settings && typeof d.settings === "object"
            ? { ...DEFAULT_SETTINGS, ...(d.settings as Partial<StudySettings>) }
            : DEFAULT_SETTINGS;
        set({ cards, favorites, settings });
        return true;
      },
      resetProgress: () => set({ cards: {}, favorites: {} }),
    }),
    {
      name: "nihongo-study",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ cards: s.cards, favorites: s.favorites, settings: s.settings }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<StudyState>;
        return {
          ...current,
          ...p,
          settings: { ...DEFAULT_SETTINGS, ...(p.settings ?? {}) },
        };
      },
    }
  )
);

/** true sau khi dữ liệu trong localStorage đã được nạp (tránh lệch khi render phía server). */
export function useStudyHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useStudy.persist.onFinishHydration(onChange),
    () => useStudy.persist.hasHydrated(),
    () => false
  );
}
