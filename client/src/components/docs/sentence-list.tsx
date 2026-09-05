import type { Word } from "@/lib/strapi";

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex gap-3 py-1.5">
      <span className="w-24 shrink-0 text-xs font-bold tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <span className="text-sm text-foreground">{value || "—"}</span>
    </div>
  );
}

export function SentenceList({ sentences }: { sentences: Word[] }) {
  if (sentences.length === 0) return null;

  return (
    <div className="mb-11">
      <h2 className="mb-3 text-xs font-bold tracking-wide text-muted-foreground uppercase">
        Câu ví dụ
      </h2>
      <div className="flex flex-col gap-3">
        {sentences.map((s) => (
          <div
            key={s.id}
            className="divide-y divide-border rounded-xl border border-border bg-card px-5 py-1"
          >
            <Row label="Từ" value={s.word} />
            <Row label="Hiragana" value={s.hiragana} />
            <Row label="Katakana" value={s.katakana} />
            <Row label="Romaji" value={s.romaji} />
          </div>
        ))}
      </div>
    </div>
  );
}
