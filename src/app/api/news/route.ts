import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { NewsItem, NEWS_STATUSES, progressForStatus } from "@/models/NewsItem";
import { Activity } from "@/models/Activity";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const items = await NewsItem.find().sort({ srNumber: -1 }).lean();
  return NextResponse.json(items);
}

// Delete every news record — super admin only.
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "superadmin") {
    return NextResponse.json({ error: "Only the super admin can delete all news" }, { status: 403 });
  }

  await dbConnect();
  const { deletedCount } = await NewsItem.deleteMany({});

  try {
    await Activity.create({
      userEmail: session.user.email,
      userName: session.user.name,
      action: "deleted",
      detail: `Cleared the board — deleted all ${deletedCount} news record${deletedCount === 1 ? "" : "s"}`,
    });
  } catch (err) {
    console.error("Failed to write activity log", err);
  }

  return NextResponse.json({ ok: true, deletedCount });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const title = (body.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "News name is required" }, { status: 400 });

  // News enters the pipeline at "in-progress" and the clock starts now.
  // It only stops (durationMs is recorded) when the item is marked "done".
  const status = NEWS_STATUSES.includes(body.status) ? body.status : "in-progress";
  const now = new Date();
  const completedAt = status === "done" ? now : undefined;

  await dbConnect();

  let srNumber = Number(body.srNumber);
  if (!srNumber || Number.isNaN(srNumber)) {
    const last = await NewsItem.findOne().sort({ srNumber: -1 }).lean<{ srNumber: number }>();
    srNumber = (last?.srNumber ?? 0) + 1;
  } else {
    const exists = await NewsItem.findOne({ srNumber }).lean();
    if (exists) return NextResponse.json({ error: `Sr number ${srNumber} already exists` }, { status: 400 });
  }

  const item = await NewsItem.create({
    srNumber,
    title,
    status,
    createdBy: session.user.email,
    createdByName: session.user.name,
    progress: progressForStatus(status),
    startedAt: now,
    completedAt,
    durationMs: completedAt ? completedAt.getTime() - now.getTime() : undefined,
  });

  await Activity.create({
    userEmail: session.user.email,
    userName: session.user.name,
    action: "created",
    srNumber,
    newsTitle: title,
    detail: `Created news "${title}" (Sr #${srNumber})`,
  });

  return NextResponse.json(item, { status: 201 });
}
