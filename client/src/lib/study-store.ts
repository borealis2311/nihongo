"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  createEmptyCard,
  fsrs,
  generatorParameters,
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

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
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
