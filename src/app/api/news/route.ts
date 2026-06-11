import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { NewsItem, NEWS_STATUSES } from "@/models/NewsItem";
import { Activity } from "@/models/Activity";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const items = await NewsItem.find().sort({ srNumber: -1 }).lean();
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const title = (body.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "News name is required" }, { status: 400 });

  const status = NEWS_STATUSES.includes(body.status) ? body.status : "pending";

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
    voiceOver: Boolean(body.voiceOver),
    status,
    createdBy: session.user.email,
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
