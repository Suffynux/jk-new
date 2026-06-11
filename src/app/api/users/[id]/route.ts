import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { Activity } from "@/models/Activity";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "superadmin") {
    return NextResponse.json({ error: "Only the super admin can delete users" }, { status: 403 });
  }

  const { id } = await params;
  if (id === session.user.id) {
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
  }

  await dbConnect();
  const user = await User.findByIdAndDelete(id);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await Activity.create({
    userEmail: session.user.email,
    userName: session.user.name,
    action: "user_deleted",
    detail: `Deleted user ${user.name} (${user.email})`,
  });

  return NextResponse.json({ ok: true });
}
