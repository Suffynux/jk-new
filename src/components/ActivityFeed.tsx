"use client";

import { useEffect, useState } from "react";
import Pagination from "@/components/Pagination";

type ActivityEntry = {
  _id: string;
  userEmail: string;
  userName: string;
  action: string;
  srNumber?: number;
  newsTitle?: string;
  detail: string;
  createdAt: string;
};

const ACTION_STYLES: Record<string, { label: string; cls: string }> = {
  created: { label: "Created", cls: "bg-emerald-500/15 text-emerald-400" },
  status_changed: { label: "Status", cls: "bg-sky-500/15 text-sky-400" },
  completed: { label: "Completed", cls: "bg-emerald-500/15 text-emerald-400" },
  voiceover_changed: { label: "Voice Over", cls: "bg-purple-500/15 text-purple-400" },
  updated: { label: "Updated", cls: "bg-amber-500/15 text-amber-400" },
  deleted: { label: "Deleted", cls: "bg-red-500/15 text-red-400" },
  user_created: { label: "User Added", cls: "bg-teal-500/15 text-teal-400" },
  user_deleted: { label: "User Removed", cls: "bg-rose-500/15 text-rose-400" },
};

const PAGE_SIZE = 20;

export default function ActivityFeed() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/activity?page=${page}&limit=${PAGE_SIZE}`)
      .then((res) => (res.ok ? res.json() : { entries: [], totalPages: 1, total: 0 }))
      .then((data) => {
        setEntries(data.entries ?? []);
        setTotalPages(data.totalPages ?? 1);
        setTotal(data.total ?? 0);
      })
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-1 text-xl font-bold">Activity Log</h1>
      <p className="mb-6 text-sm text-slate-500">
        Every change  who did it and when. Newest first.
        {total > 0 && <> · {total} total</>}
      </p>

      {loading ? (
        <p className="py-20 text-center text-slate-500">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="py-20 text-center text-slate-600">No activity yet.</p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => {
            const style = ACTION_STYLES[entry.action] ?? { label: entry.action, cls: "bg-slate-700/40 text-slate-300" };
            return (
              <div
                key={entry._id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3"
              >
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.cls}`}>
                  {style.label}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{entry.detail}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    by <span className="font-medium text-slate-400">{entry.userName}</span> ({entry.userEmail})
                  </p>
                </div>
                <span className="whitespace-nowrap text-xs text-slate-500">
                  {new Date(entry.createdAt).toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {!loading && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}
    </main>
  );
}
