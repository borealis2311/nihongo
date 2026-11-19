"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { useStudy } from "@/lib/study-store";

/* ------------------------------------------------------------------ */
/* Đọc to (Text-to-Speech) bằng Web Speech API — không cần API key.    */
/* ------------------------------------------------------------------ */

function subscribeVoices(onChange: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return () => {};
  window.speechSynthesis.addEventListener("voiceschanged", onChange);
  return () => window.speechSynthesis.removeEventListener("voiceschanged", onChange);
}

let cachedVoices: SpeechSynthesisVoice[] = [];
let cachedKey = "";

function getJapaneseVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return cachedVoices;
  const all = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith("ja"));
  const key = all.map((v) => v.voiceURI).join("|");
  if (key !== cachedKey) {
    cachedKey = key;
    cachedVoices = all;
  }
  return cachedVoices;
}

const EMPTY: SpeechSynthesisVoice[] = [];

export function useJapaneseVoices(): SpeechSynthesisVoice[] {
  return useSyncExternalStore(subscribeVoices, getJapaneseVoices, () => EMPTY);
}

export function useTtsSupported(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => typeof window !== "undefined" && "speechSynthesis" in window,
    () => false
  );
}

export function useSpeak() {
  const voices = useJapaneseVoices();
  const voiceURI = useStudy((s) => s.settings.voiceURI);
  const rate = useStudy((s) => s.settings.rate);
  const [speakingText, setSpeakingText] = useState<string | null>(null);

  const speak = useCallback(
    (text: string) => {
      if (!text || typeof window === "undefined" || !("speechSynthesis" in window)) return;
      const synth = window.speechSynthesis;
      synth.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "ja-JP";
      utter.rate = rate;
      const voice = voices.find((v) => v.voiceURI === voiceURI) ?? voices[0];
      if (voice) utter.voice = voice;
      utter.onstart = () => setSpeakingText(text);
      utter.onend = () => setSpeakingText((t) => (t === text ? null : t));
      utter.onerror = () => setSpeakingText(null);
      synth.speak(utter);
    },
    [voices, voiceURI, rate]
  );

  return { speak, speakingText };
}
