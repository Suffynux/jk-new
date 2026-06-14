"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

type Status = "in-progress" | "voice-over" | "video-editing" | "onair" | "done";

type NewsItem = {
  _id: string;
  srNumber: number;
  title: string;
  status: Status;
  progress: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
};

const COLUMNS = [
  { key: "in-progress", label: "In Progress", accent: "border-t-sky-500", badge: "bg-sky-500/15 text-sky-500", bar: "bg-sky-500" },
  { key: "voice-over", label: "Voice Over", accent: "border-t-violet-500", badge: "bg-violet-500/15 text-violet-500", bar: "bg-violet-500" },
  { key: "video-editing", label: "Video / Editing", accent: "border-t-amber-500", badge: "bg-amber-500/15 text-amber-500", bar: "bg-amber-500" },
  { key: "onair", label: "On Air", accent: "border-t-rose-500", badge: "bg-rose-500/15 text-rose-500", bar: "bg-rose-500" },
  { key: "done", label: "Done", accent: "border-t-emerald-500", badge: "bg-emerald-500/15 text-emerald-500", bar: "bg-emerald-500" },
] as const;

const ORDER = COLUMNS.map((c) => c.key) as Status[];
const OVERDUE_MS = 60 * 60 * 1000; // 1 hour

/** Map any value (incl. legacy "pending") to a valid stage so nothing breaks. */
function normalizeStatus(status: string): Status {
  return ORDER.includes(status as Status) ? (status as Status) : "in-progress";
}

function progressForStatus(status: string): number {
  const idx = ORDER.indexOf(normalizeStatus(status));
  return idx < 0 ? 0 : Math.round(((idx + 1) / ORDER.length) * 100);
}

/** A news item is overdue when it isn't Done and has been open for over an hour. */
function isOverdue(item: NewsItem, now: number): boolean {
  if (normalizeStatus(item.status) === "done") return false;
  const start = new Date(item.startedAt ?? item.createdAt).getTime();
  return now - start > OVERDUE_MS;
}

/** Stable key (for sorting/grouping) and a human label for an item's day. */
function dayKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10); // YYYY-MM-DD
}
function dayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

/** Final duration for done items, otherwise live elapsed time since start. */
function elapsed(item: NewsItem, now: number): string {
  if (item.status === "done" && typeof item.durationMs === "number") {
    return formatDuration(item.durationMs);
  }
  if (!item.startedAt) return "—";
  return formatDuration(now - new Date(item.startedAt).getTime());
}

export default function Dashboard() {
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === "superadmin";

  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<Status | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // Filters
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<"all" | Status>("all");

  // Add form state
  const [newTitle, setNewTitle] = useState("");
  const [newSr, setNewSr] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/news");
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Keep live timers fresh (updates "X min" without a page reload).
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  async function patchItem(id: string, body: Record<string, unknown>) {
    const optimistic =
      typeof body.status === "string"
        ? { ...body, progress: progressForStatus(body.status as Status) }
        : body;
    setItems((prev) => prev.map((it) => (it._id === id ? { ...it, ...optimistic } : it)));
    const res = await fetch(`/api/news/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const updated = await res.json();
      setItems((prev) => prev.map((it) => (it._id === id ? { ...it, ...updated } : it)));
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to update");
      load();
    }
  }

  async function deleteAll() {
    if (!items.length) return;
    if (!confirm(`Delete ALL ${items.length} news records? This cannot be undone.`)) return;
    if (!confirm("Are you absolutely sure? Every record on the board will be permanently removed.")) return;
    const res = await fetch("/api/news", { method: "DELETE" });
    if (res.ok) {
      setItems([]);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to delete all");
    }
  }

  async function deleteItem(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/news/${id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev) => prev.filter((it) => it._id !== id));
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to delete");
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/news", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle, srNumber: newSr ? Number(newSr) : undefined }),
    });
    setSaving(false);
    if (res.ok) {
      setShowModal(false);
      setNewTitle("");
      setNewSr("");
      load();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to create");
    }
  }

  function handleDrop(status: Status) {
    setDragOverCol(null);
    if (!dragId) return;
    const item = items.find((it) => it._id === dragId);
    setDragId(null);
    if (item && item.status !== status) patchItem(item._id, { status });
  }

  const nextSr = items.length ? Math.max(...items.map((i) => i.srNumber)) + 1 : 1;
  const doneCount = items.filter((i) => normalizeStatus(i.status) === "done").length;

  // Search + stage filter, applied to both views.
  const visibleItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      if (stageFilter !== "all" && normalizeStatus(it.status) !== stageFilter) return false;
      if (!q) return true;
      return it.title.toLowerCase().includes(q) || String(it.srNumber).includes(q);
    });
  }, [items, query, stageFilter]);

  // List view: group by creation day, newest day first.
  const groupedByDay = useMemo(() => {
    const map = new Map<string, { label: string; items: NewsItem[] }>();
    for (const it of visibleItems) {
      const key = dayKey(it.createdAt);
      if (!map.has(key)) map.set(key, { label: dayLabel(it.createdAt), items: [] });
      map.get(key)!.items.push(it);
    }
    return [...map.entries()]
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([key, g]) => ({ key, ...g }));
  }, [visibleItems]);

  const overdueCount = visibleItems.filter((i) => isOverdue(i, now)).length;
  const colSpan = isSuperAdmin ? 7 : 6;

  return (
    <main className="mx-auto max-w-7xl px-3 py-5 sm:px-4 sm:py-6">
      {/* Toolbar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold sm:text-xl">News Board</h1>
          <p className="text-sm text-slate-500">
            {items.length} records · {doneCount} done
            {overdueCount > 0 && (
              <span className="font-semibold text-red-500"> · {overdueCount} overdue</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-300 bg-slate-900 p-0.5 dark:border-slate-800">
            {(["kanban", "list"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition ${
                  view === v ? "bg-brand text-white" : "text-slate-500 hover:text-slate-100"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              setShowModal(true);
              setError("");
            }}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            + Add News
          </button>
          {isSuperAdmin && items.length > 0 && (
            <button
              onClick={deleteAll}
              title="Delete all news records"
              className="rounded-lg border border-red-500/50 px-3 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-500/10"
            >
              <span className="hidden sm:inline">Delete all</span>
              <span className="sm:hidden">🗑</span>
            </button>
          )}
        </div>
      </div>

      {/* Search + stage filter */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">⌕</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by news name or Sr #…"
            className="w-full rounded-lg border border-slate-300 bg-slate-900 py-2 pl-8 pr-3 text-sm outline-none focus:border-brand dark:border-slate-800"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300"
            >
              ✕
            </button>
          )}
        </div>
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value as "all" | Status)}
          className="rounded-lg border border-slate-300 bg-slate-900 px-3 py-2 text-sm font-medium outline-none focus:border-brand dark:border-slate-800"
        >
          <option value="all">All stages</option>
          {COLUMNS.map((c) => (
            <option key={c.key} value={c.key}>{c.label}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-500">
          {error}
          <button onClick={() => setError("")} className="ml-4">✕</button>
        </div>
      )}

      {loading ? (
        <p className="py-20 text-center text-slate-500">Loading…</p>
      ) : view === "kanban" ? (
        /* ───────────── Kanban view — swipeable on mobile, 5-col grid on desktop ───────────── */
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-5 md:gap-3 md:overflow-visible">
          {COLUMNS.map((col) => {
            const colItems = visibleItems.filter((it) => normalizeStatus(it.status) === col.key);
            return (
              <div
                key={col.key}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverCol(col.key);
                }}
                onDragLeave={() => setDragOverCol((c) => (c === col.key ? null : c))}
                onDrop={() => handleDrop(col.key)}
                className={`w-[82%] shrink-0 snap-start rounded-xl border border-slate-200 border-t-4 bg-slate-900/60 dark:border-slate-800 sm:w-[300px] md:w-auto ${col.accent} ${
                  dragOverCol === col.key ? "ring-2 ring-brand/50" : ""
                }`}
              >
                <div className="flex items-center justify-between px-3 py-3">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">{col.label}</h2>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${col.badge}`}>{colItems.length}</span>
                </div>
                <div className="flex min-h-[100px] flex-col gap-2 px-2.5 pb-3">
                  {colItems.map((item) => (
                    <div
                      key={item._id}
                      draggable
                      onDragStart={() => setDragId(item._id)}
                      onDragEnd={() => setDragId(null)}
                      className={`group rounded-lg border bg-slate-900 p-3 shadow-sm transition md:cursor-grab md:active:cursor-grabbing ${
                        isOverdue(item, now)
                          ? "border-red-500/60 bg-red-500/5"
                          : "border-slate-200 hover:border-slate-400 dark:border-slate-800 dark:hover:border-slate-600"
                      } ${dragId === item._id ? "opacity-40" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-slate-500">#{item.srNumber}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-500">⏱ {elapsed(item, now)}</span>
                          {isSuperAdmin && (
                            <button
                              onClick={() => deleteItem(item._id, item.title)}
                              className="text-xs text-slate-500 transition hover:text-red-500 md:opacity-0 md:group-hover:opacity-100"
                              title="Delete"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="mt-1 text-sm font-medium leading-snug">{item.title}</p>

                      <ProgressBar value={item.progress || progressForStatus(item.status)} bar={col.bar} />

                      <div className="mt-2.5 flex items-center justify-between">
                        <span className="text-xs text-slate-500">{item.progress || progressForStatus(item.status)}%</span>
                        <div className="flex gap-1">
                          {prevStatus(col.key) && (
                            <MoveBtn label="←" title="Move back" onClick={() => patchItem(item._id, { status: prevStatus(col.key) })} />
                          )}
                          {nextStatus(col.key) && (
                            <MoveBtn label="→" title="Move forward" onClick={() => patchItem(item._id, { status: nextStatus(col.key) })} />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {colItems.length === 0 && (
                    <p className="py-6 text-center text-xs text-slate-600">No cards</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ───────────── List view — grouped by day ───────────── */
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-3">Sr #</th>
                <th className="px-3 py-3">News Name</th>
                <th className="px-3 py-3">Stage</th>
                <th className="px-3 py-3 hidden sm:table-cell">Progress</th>
                <th className="px-3 py-3">Time</th>
                <th className="px-3 py-3 hidden md:table-cell">Created By</th>
                {isSuperAdmin && <th className="px-3 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {groupedByDay.map((group) => {
                const dayOverdue = group.items.filter((i) => isOverdue(i, now)).length;
                return (
                  <Fragment key={group.key}>
                    <tr className="bg-slate-900/80">
                      <td colSpan={colSpan} className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                            📅 {group.label}
                          </span>
                          <span className="rounded-full bg-slate-700/40 px-2 py-0.5 text-xs font-semibold text-slate-400">
                            {group.items.length}
                          </span>
                          {dayOverdue > 0 && (
                            <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-500">
                              {dayOverdue} overdue
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                    {group.items.map((item) => {
                      const overdue = isOverdue(item, now);
                      return (
                        <tr
                          key={item._id}
                          className={`transition ${
                            overdue
                              ? "border-l-4 border-l-red-500 bg-red-500/10 hover:bg-red-500/15"
                              : "bg-slate-950 hover:bg-slate-900/50"
                          }`}
                        >
                          <td className={`px-3 py-3 font-bold ${overdue ? "text-red-500" : "text-slate-500"}`}>
                            #{item.srNumber}
                          </td>
                          <td className="px-3 py-3 font-medium">{item.title}</td>
                          <td className="px-3 py-3">
                            <select
                              value={normalizeStatus(item.status)}
                              onChange={(e) => patchItem(item._id, { status: e.target.value })}
                              className="rounded-lg border border-slate-300 bg-slate-900 px-2 py-1 text-xs font-semibold outline-none dark:border-slate-700"
                            >
                              {COLUMNS.map((c) => (
                                <option key={c.key} value={c.key}>{c.label}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-3 hidden sm:table-cell">
                            <div className="flex items-center gap-2">
                              <ProgressBar value={item.progress || progressForStatus(item.status)} bar="bg-brand" compact />
                              <span className="text-xs text-slate-500">{item.progress || progressForStatus(item.status)}%</span>
                            </div>
                          </td>
                          <td className={`px-3 py-3 ${overdue ? "font-semibold text-red-500" : "text-slate-500"}`}>
                            ⏱ {elapsed(item, now)}
                          </td>
                          <td className="px-3 py-3 text-slate-500 hidden md:table-cell">{item.createdBy}</td>
                          {isSuperAdmin && (
                            <td className="px-3 py-3 text-right">
                              <button
                                onClick={() => deleteItem(item._id, item.title)}
                                className="text-xs text-slate-500 transition hover:text-red-500"
                              >
                                Delete
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </Fragment>
                );
              })}
              {groupedByDay.length === 0 && (
                <tr>
                  <td colSpan={colSpan} className="px-4 py-10 text-center text-slate-600">
                    {items.length === 0
                      ? "No news records yet. Tap “+ Add News” to create your first one."
                      : "No news match your search."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ───────────── Add modal ───────────── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-md rounded-t-2xl border border-slate-200 bg-slate-900 p-6 shadow-2xl dark:border-slate-800 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-lg font-bold">Add News</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-400">News Name *</label>
                <input
                  autoFocus
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-slate-800 px-3 py-2 text-sm outline-none focus:border-brand dark:border-slate-700"
                  placeholder="e.g. Flood update — Srinagar highway"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-400">Sr Number</label>
                <input
                  type="number"
                  min={1}
                  value={newSr}
                  onChange={(e) => setNewSr(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-slate-800 px-3 py-2 text-sm outline-none focus:border-brand dark:border-slate-700"
                  placeholder={`Auto (#${nextSr})`}
                />
                <p className="mt-1 text-xs text-slate-500">Leave empty to auto-assign the next number.</p>
              </div>
              <p className="rounded-lg border border-slate-200 bg-slate-800/50 px-3 py-2 text-xs text-slate-500 dark:border-slate-800">
                The timer starts now and the news enters the <b>In Progress</b> stage.
              </p>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-500 hover:bg-slate-800 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

function prevStatus(s: Status): Status | null {
  const idx = ORDER.indexOf(s);
  return idx > 0 ? ORDER[idx - 1] : null;
}
function nextStatus(s: Status): Status | null {
  const idx = ORDER.indexOf(s);
  return idx < ORDER.length - 1 ? ORDER[idx + 1] : null;
}

function ProgressBar({ value, bar, compact }: { value: number; bar: string; compact?: boolean }) {
  return (
    <div className={`${compact ? "w-20" : "mt-2 w-full"} h-1.5 overflow-hidden rounded-full bg-slate-700/40`}>
      <div className={`h-full rounded-full transition-all ${bar}`} style={{ width: `${value}%` }} />
    </div>
  );
}

function MoveBtn({ label, title, onClick }: { label: string; title: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="rounded-md border border-slate-300 px-2 py-0.5 text-xs text-slate-500 transition hover:border-brand hover:text-brand dark:border-slate-700"
    >
      {label}
    </button>
  );
}
