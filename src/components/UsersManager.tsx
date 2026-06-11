"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type AppUser = {
  _id: string;
  name: string;
  email: string;
  role: "superadmin" | "member";
  createdAt: string;
};

export default function UsersManager() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"member" | "superadmin">("member");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/users");
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });
    setSaving(false);
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setSuccess(`User ${data.name} created. Share their email & password so they can log in.`);
      setName("");
      setEmail("");
      setPassword("");
      setRole("member");
      load();
    } else {
      setError(data.error || "Failed to create user");
    }
  }

  async function handleDelete(user: AppUser) {
    if (!confirm(`Remove ${user.name} (${user.email})? They will no longer be able to log in.`)) return;
    const res = await fetch(`/api/users/${user._id}`, { method: "DELETE" });
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to delete user");
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="mb-1 text-xl font-bold">Team Users</h1>
      <p className="mb-6 text-sm text-slate-500">
        Create accounts for your team. They can log in, manage news and change statuses — every change is tracked in
        Activity.
      </p>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* User list */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Added</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {users.map((user) => (
                <tr key={user._id} className="bg-slate-950">
                  <td className="px-4 py-3 font-medium">{user.name}</td>
                  <td className="px-4 py-3 text-slate-400">{user.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        user.role === "superadmin"
                          ? "bg-red-500/15 text-red-400"
                          : "bg-slate-700/40 text-slate-300"
                      }`}
                    >
                      {user.role === "superadmin" ? "Super Admin" : "Member"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    {user._id !== session?.user?.id && (
                      <button
                        onClick={() => handleDelete(user)}
                        className="text-xs text-slate-600 transition hover:text-red-400"
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-600">
                    No users yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Create form */}
        <div className="h-fit rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="mb-4 font-semibold">Add New User</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none focus:border-red-500"
            />
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none focus:border-red-500"
            />
            <input
              required
              type="text"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 6 chars)"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none focus:border-red-500"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "member" | "superadmin")}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none focus:border-red-500"
            >
              <option value="member">Member</option>
              <option value="superadmin">Super Admin</option>
            </select>

            {error && <p className="text-sm text-red-400">{error}</p>}
            {success && <p className="text-sm text-emerald-400">{success}</p>}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-red-600 py-2 text-sm font-semibold transition hover:bg-red-500 disabled:opacity-50"
            >
              {saving ? "Creating…" : "Create User"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
