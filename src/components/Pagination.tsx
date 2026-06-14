"use client";

export default function Pagination({
  page,
  totalPages,
  onChange,
  unit = "page",
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  unit?: string;
}) {
  if (totalPages <= 1) return null;

  const go = (p: number) => onChange(Math.min(totalPages, Math.max(1, p)));

  // Compact window of page numbers around the current page.
  const windowSize = 5;
  let start = Math.max(1, page - Math.floor(windowSize / 2));
  const end = Math.min(totalPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const btn =
    "min-w-9 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium transition disabled:opacity-40 dark:border-slate-700";

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-slate-500">
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => go(1)} disabled={page === 1} className={btn} aria-label="First page">«</button>
        <button onClick={() => go(page - 1)} disabled={page === 1} className={btn} aria-label={`Previous ${unit}`}>‹</button>
        {start > 1 && <span className="px-1 text-slate-500">…</span>}
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => go(p)}
            className={`${btn} ${p === page ? "border-brand bg-brand text-white" : "text-slate-500 hover:text-slate-100"}`}
          >
            {p}
          </button>
        ))}
        {end < totalPages && <span className="px-1 text-slate-500">…</span>}
        <button onClick={() => go(page + 1)} disabled={page === totalPages} className={btn} aria-label={`Next ${unit}`}>›</button>
        <button onClick={() => go(totalPages)} disabled={page === totalPages} className={btn} aria-label="Last page">»</button>
      </div>
    </div>
  );
}
