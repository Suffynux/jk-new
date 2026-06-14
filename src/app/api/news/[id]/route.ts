import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { NewsItem, NEWS_STATUSES, STATUS_LABELS, progressForStatus } from "@/models/NewsItem";
import { Activity } from "@/models/Activity";

function formatDuration(ms: number): string {
  const totalMinutes = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  await dbConnect();
  const item = await NewsItem.findById(id);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const logs: { action: string; detail: string }[] = [];

  if (body.status !== undefined && body.status !== item.status) {
    if (!NEWS_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    logs.push({
      action: "status_changed",
      detail: `Moved "${item.title}" from ${STATUS_LABELS[item.status as keyof typeof STATUS_LABELS]} to ${STATUS_LABELS[body.status as keyof typeof STATUS_LABELS]}`,
    });
    item.status = body.status;
    item.progress = progressForStatus(body.status);

    // Make sure the clock has a start (older records may predate this field).
    if (!item.startedAt) item.startedAt = item.createdAt ?? new Date();

    if (body.status === "done") {
      const completedAt = new Date();
      item.completedAt = completedAt;
      item.durationMs = completedAt.getTime() - new Date(item.startedAt).getTime();
      logs.push({
        action: "completed",
        detail: `"${item.title}" went On Air → Done in ${formatDuration(item.durationMs)}`,
      });
    } else {
      // Re-opened: stop counting the previous run; it will be recomputed on Done.
      item.completedAt = undefined;
      item.durationMs = undefined;
    }
  }

  if (body.title !== undefined && body.title.trim() && body.title.trim() !== item.title) {
    logs.push({
      action: "updated",
      detail: `Renamed "${item.title}" to "${body.title.trim()}"`,
    });
    item.title = body.title.trim();
  }

  await item.save();

  if (logs.length) {
    await Activity.insertMany(
      logs.map((log) => ({
        userEmail: session.user.email,
        userName: session.user.name,
        action: log.action,
        srNumber: item.srNumber,
        newsTitle: item.title,
        detail: log.detail,
      }))
    );
  }

  return NextResponse.json(item);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "superadmin") {
    return NextResponse.json({ error: "Only the super admin can delete news" }, { status: 403 });
  }

  const { id } = await params;
  await dbConnect();
  const item = await NewsItem.findByIdAndDelete(id);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await Activity.create({
    userEmail: session.user.email,
    userName: session.user.name,
    action: "deleted",
    srNumber: item.srNumber,
    newsTitle: item.title,
    detail: `Deleted news "${item.title}" (Sr #${item.srNumber})`,
  });

  return NextResponse.json({ ok: true });
}
