"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type NewsItem = {
  _id: string;
  srNumber: number;
  title: string;
  voiceOver: boolean;
  status: "pending" | "in-progress" | "done";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

const COLUMNS = [
  { key: "pending", label: "Pending", accent: "border-t-amber-500", badge: "bg-amber-500/15 text-amber-400" },
  { key: "in-progress", label: "In Progress", accent: "border-t-sky-500", badge: "bg-sky-500/15 text-sky-400" },
  { key: "done", label: "Done", accent: "border-t-emerald-500", badge: "bg-emerald-500/15 text-emerald-400" },
] as const;

type StatusKey = (typeof COLUMNS)[number]["key"];

export default function Dashboard() {
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === "superadmin";

  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<StatusKey | null>(null);

  // Add form state
  const [newTitle, setNewTitle] = useState("");
  const [newSr, setNewSr] = useState("");
  const [newVoiceOver, setNewVoiceOver] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/news");
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function patchItem(id: string, body: Record<string, unknown>) {
    // optimistic update
    setItems((prev) => prev.map((it) => (it._id === id ? { ...it, ...body } : it)));
    const res = await fetch(`/api/news/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to update");
      load();
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
      body: JSON.stringify({
        title: newTitle,
        srNumber: newSr ? Number(newSr) : undefined,
        voiceOver: newVoiceOver,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setShowModal(false);
      setNewTitle("");
      setNewSr("");
      setNewVoiceOver(false);
      load();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to create");
    }
  }

  function handleDrop(status: StatusKey) {
    setDragOverCol(null);
    if (!dragId) return;
    const item = items.find((it) => it._id === dragId);
    setDragId(null);
    if (item && item.status !== status) patchItem(item._id, { status });
  }

  const nextSr = items.length ? Math.max(...items.map((i) => i.srNumber)) + 1 : 1;

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">News Board</h1>
          <p className="text-sm text-slate-500">{items.length} records</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-800 bg-slate-900 p-0.5">
            {(["kanban", "list"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition ${
                  view === v ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
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
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold transition hover:bg-red-500"
          >
            + Add News
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {error}
          <button onClick={() => setError("")} className="ml-4 text-red-300">✕</button>
        </div>
      )}

      {loading ? (
        <p className="py-20 text-center text-slate-500">Loading…</p>
      ) : view === "kanban" ? (
        /* ───────────── Kanban view ───────────── */
        <div className="grid gap-4 md:grid-cols-3">
          {COLUMNS.map((col) => {
            const colItems = items.filter((it) => it.status === col.key);
            return (
              <div
                key={col.key}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverCol(col.key);
                }}
                onDragLeave={() => setDragOverCol((c) => (c === col.key ? null : c))}
                onDrop={() => handleDrop(col.key)}
                className={`rounded-xl border border-slate-800 border-t-4 bg-slate-900/60 ${col.accent} ${
                  dragOverCol === col.key ? "ring-2 ring-red-500/50" : ""
                }`}
              >
                <div className="flex items-center justify-between px-4 py-3">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">{col.label}</h2>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${col.badge}`}>{colItems.length}</span>
                </div>
                <div className="flex min-h-[120px] flex-col gap-2 px-3 pb-3">
                  {colItems.map((item) => (
                    <div
                      key={item._id}
                      draggable
                      onDragStart={() => setDragId(item._id)}
                      onDragEnd={() => setDragId(null)}
                      className={`group cursor-grab rounded-lg border border-slate-800 bg-slate-900 p-3 shadow transition hover:border-slate-600 active:cursor-grabbing ${
                        dragId === item._id ? "opacity-40" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-slate-500">#{item.srNumber}</span>
                        {isSuperAdmin && (
                          <button
                            onClick={() => deleteItem(item._id, item.title)}
                            className="text-xs text-slate-600 opacity-0 transition hover:text-red-400 group-hover:opacity-100"
                            title="Delete"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      <p className="mt-1 text-sm font-medium leading-snug">{item.title}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <VoiceOverToggle
                          checked={item.voiceOver}
                          onChange={(v) => patchItem(item._id, { voiceOver: v })}
                        />
                        <div className="flex gap-1">
                          {col.key !== "pending" && (
                            <MoveBtn label="←" title="Move back" onClick={() => patchItem(item._id, { status: prevStatus(col.key) })} />
                          )}
                          {col.key !== "done" && (
                            <MoveBtn label="→" title="Move forward" onClick={() => patchItem(item._id, { status: nextStatus(col.key) })} />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {colItems.length === 0 && (
                    <p className="py-6 text-center text-xs text-slate-600">Drop cards here</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ───────────── List view ───────────── */
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Sr #</th>
                <th className="px-4 py-3">News Name</th>
                <th className="px-4 py-3">Voice Over</th>
                <th className="px-4 py-3">Video Status</th>
                <th className="px-4 py-3">Created By</th>
                <th className="px-4 py-3">Date</th>
                {isSuperAdmin && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {items.map((item) => (
                <tr key={item._id} className="bg-slate-950 transition hover:bg-slate-900/50">
                  <td className="px-4 py-3 font-bold text-slate-400">#{item.srNumber}</td>
                  <td className="px-4 py-3 font-medium">{item.title}</td>
                  <td className="px-4 py-3">
                    <VoiceOverToggle
                      checked={item.voiceOver}
                      onChange={(v) => patchItem(item._id, { voiceOver: v })}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={item.status}
                      onChange={(e) => patchItem(item._id, { status: e.target.value })}
                      className={`rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs font-semibold outline-none ${
                        item.status === "done"
                          ? "text-emerald-400"
                          : item.status === "in-progress"
                          ? "text-sky-400"
                          : "text-amber-400"
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{item.createdBy}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                  {isSuperAdmin && (
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => deleteItem(item._id, item.title)}
                        className="text-xs text-slate-600 transition hover:text-red-400"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-600">
                    No news records yet. Click “+ Add News” to create your first one.
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-lg font-bold">Add News</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">News Name *</label>
                <input
                  autoFocus
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none focus:border-red-500"
                  placeholder="e.g. Flood update — Srinagar highway"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Sr Number</label>
                <input
                  type="number"
                  min={1}
                  value={newSr}
                  onChange={(e) => setNewSr(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none focus:border-red-500"
                  placeholder={`Auto (#${nextSr})`}
                />
                <p className="mt-1 text-xs text-slate-500">Leave empty to auto-assign the next number.</p>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-800/50 px-3 py-2.5">
                <span className="text-sm font-medium text-slate-300">Voice over filled?</span>
                <VoiceOverToggle checked={newVoiceOver} onChange={setNewVoiceOver} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-500 disabled:opacity-50"
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

function prevStatus(s: StatusKey): StatusKey {
  return s === "done" ? "in-progress" : "pending";
}
function nextStatus(s: StatusKey): StatusKey {
  return s === "pending" ? "in-progress" : "done";
}

function MoveBtn({ label, title, onClick }: { label: string; title: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="rounded-md border border-slate-700 px-2 py-0.5 text-xs text-slate-400 transition hover:border-slate-500 hover:text-white"
    >
      {label}
    </button>
  );
}

function VoiceOverToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2"
      title="Voice over filled?"
    >
      <span
        className={`relative h-5 w-9 rounded-full transition ${checked ? "bg-emerald-500" : "bg-slate-700"}`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
            checked ? "left-[18px]" : "left-0.5"
          }`}
        />
      </span>
      <span className={`text-xs font-medium ${checked ? "text-emerald-400" : "text-slate-500"}`}>VO</span>
    </button>
  );
}
