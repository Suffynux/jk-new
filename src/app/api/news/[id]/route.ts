import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { NewsItem, NEWS_STATUSES } from "@/models/NewsItem";
import { Activity } from "@/models/Activity";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  "in-progress": "In Progress",
  done: "Done",
};

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
      detail: `Moved "${item.title}" from ${STATUS_LABELS[item.status]} to ${STATUS_LABELS[body.status]}`,
    });
    item.status = body.status;
  }

  if (body.voiceOver !== undefined && Boolean(body.voiceOver) !== item.voiceOver) {
    item.voiceOver = Boolean(body.voiceOver);
    logs.push({
      action: "voiceover_changed",
      detail: `Marked voice over as ${item.voiceOver ? "filled" : "not filled"} for "${item.title}"`,
    });
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
