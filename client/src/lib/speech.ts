"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
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

/* ------------------------------------------------------------------ */
/* Nhận diện giọng nói (Speech-to-Text) để tra từ bằng giọng.          */
/* ------------------------------------------------------------------ */

interface RecognitionResultEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
}

interface RecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: RecognitionResultEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}

type RecognitionCtor = new () => RecognitionLike;

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useSpeechRecognition(onFinal: (text: string) => void) {
  const supported = useSyncExternalStore(
    () => () => {},
    () => getRecognitionCtor() !== null,
    () => false
  );
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<RecognitionLike | null>(null);
  const onFinalRef = useRef(onFinal);

  useEffect(() => {
    onFinalRef.current = onFinal;
  }, [onFinal]);

  useEffect(() => () => recRef.current?.abort(), []);

  const start = useCallback((lang: "ja-JP" | "vi-VN") => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    recRef.current?.abort();
    const rec = new Ctor();
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      let text = "";
      let final = false;
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
        if (e.results[i].isFinal) final = true;
      }
      setInterim(text);
      if (final) onFinalRef.current(text.trim());
    };
    rec.onerror = (e) => {
      setError(
        e.error === "not-allowed"
          ? "Trình duyệt chưa cho phép dùng micro."
          : e.error === "no-speech"
            ? "Không nghe thấy giọng nói, thử lại nhé."
            : "Không nhận diện được giọng nói."
      );
    };
    rec.onend = () => {
      setListening(false);
      setInterim("");
    };
    recRef.current = rec;
    setError(null);
    setListening(true);
    rec.start();
  }, []);

  const stop = useCallback(() => recRef.current?.stop(), []);

  return { supported, listening, interim, error, start, stop };
}
