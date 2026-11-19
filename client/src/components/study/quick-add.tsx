"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectGroupLabel, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { LessonInfo } from "@/lib/strapi";
import { readingsFrom } from "@/lib/text";

/** Thêm nhanh một từ / câu vào bài học trong Strapi qua route /api/words/bulk có sẵn. */
export function QuickAdd({ lessons, defaultSentence = false }: { lessons: LessonInfo[]; defaultSentence?: boolean }) {
  const router = useRouter();
  const [lessonId, setLessonId] = useState<string | null>(lessons[0]?.id ?? null);
  const [kind, setKind] = useState<"word" | "sentence">(defaultSentence ? "sentence" : "word");
  const [jp, setJp] = useState("");
  const [meaning, setMeaning] = useState("");
  const [saving, setSaving] = useState(false);

  const readings = useMemo(() => readingsFrom(jp), [jp]);
  const groups = useMemo(() => {
    const map = new Map<string, LessonInfo[]>();
    for (const l of lessons) map.set(l.chapterName, [...(map.get(l.chapterName) ?? []), l]);
    return [...map.entries()];
  }, [lessons]);
  const lessonItems = useMemo(() => Object.fromEntries(lessons.map((l) => [l.id, l.name])), [lessons]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonId) return toast.error("Hãy chọn bài học để lưu vào.");
    if (!readings.hiragana || !meaning.trim()) return toast.error("Cần nhập cả tiếng Nhật và nghĩa tiếng Việt.");
    setSaving(true);
    try {
      const res = await fetch("/api/words/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId,
          words: [
            {
              word: meaning.trim(),
              hiragana: readings.hiragana,
              katakana: readings.katakana,
              romaji: readings.romaji,
              sentence: kind === "sentence",
            },
          ],
        }),
      });
      const json = await res.json();
      if (!res.ok || json.createdCount !== 1) {
        throw new Error(json.error ?? json.errors?.[0]?.error ?? "Không lưu được.");
      }
      toast.success(kind === "sentence" ? "Đã lưu mẫu câu vào sổ." : "Đã lưu từ vào sổ.");
      setJp("");
      setMeaning("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không lưu được.");
    } finally {
      setSaving(false);
    }
  };

  if (lessons.length === 0) {
    return <p className="text-sm text-muted-foreground">Tạo ít nhất một bài học trong Strapi để thêm từ.</p>;
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3.5">
      <ToggleGroup aria-label="Loại mục" value={[kind]} onValueChange={(v) => v[0] && setKind(v[0] as "word" | "sentence")}>
        <ToggleGroupItem value="word" className="min-h-9 flex-1">
          Từ vựng
        </ToggleGroupItem>
        <ToggleGroupItem value="sentence" className="min-h-9 flex-1">
          Mẫu câu
        </ToggleGroupItem>
      </ToggleGroup>
      <Label>
        Lưu vào bài
        <Select value={lessonId} onValueChange={(v) => setLessonId(v as string)} items={lessonItems}>
          <SelectTrigger aria-label="Bài học">
            <SelectValue placeholder="Chọn bài học" />
          </SelectTrigger>
          <SelectContent>
            {groups.map(([chapter, ls]) => (
              <SelectGroup key={chapter}>
                <SelectGroupLabel>{chapter}</SelectGroupLabel>
                {ls.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </Label>
      <Label>
        Tiếng Nhật (kana hoặc romaji)
        <Input
          value={jp}
          onChange={(e) => setJp(e.target.value)}
          placeholder={kind === "sentence" ? "vd: eki wa doko desu ka" : "vd: gakusei"}
          className="jp h-11 rounded-xl border-[1.5px] bg-card text-[15px]"
          autoCapitalize="off"
          autoComplete="off"
          spellCheck={false}
        />
        {readings.hiragana && (
          <span className="jp text-xs font-normal text-muted-foreground">
            {readings.hiragana} · {readings.katakana} · {readings.romaji}
          </span>
        )}
      </Label>
      <Label>
        Nghĩa tiếng Việt
        <Input
          value={meaning}
          onChange={(e) => setMeaning(e.target.value)}
          placeholder={kind === "sentence" ? "vd: Nhà ga ở đâu?" : "vd: Học sinh"}
          className="h-11 rounded-xl border-[1.5px] bg-card text-[15px]"
        />
      </Label>
      <button
        type="submit"
        disabled={saving}
        className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary text-[15px] font-extrabold text-primary-foreground shadow-[0_4px_0_var(--indigo-ink)] disabled:opacity-60"
      >
        {saving && <Loader2 className="size-4 animate-spin" aria-hidden />}
        Lưu vào sổ
      </button>
    </form>
  );
}
