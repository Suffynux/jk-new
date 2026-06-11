import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { Activity } from "@/models/Activity";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await dbConnect();
  const users = await User.find().select("-passwordHash").sort({ createdAt: 1 }).lean();
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "superadmin") {
    return NextResponse.json({ error: "Only the super admin can create users" }, { status: 403 });
  }

  const body = await req.json();
  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  await dbConnect();
  const exists = await User.findOne({ email });
  if (exists) return NextResponse.json({ error: "A user with this email already exists" }, { status: 400 });

  const user = await User.create({
    name,
    email,
    passwordHash: await bcrypt.hash(password, 10),
    role: body.role === "superadmin" ? "superadmin" : "member",
  });

  await Activity.create({
    userEmail: session.user.email,
    userName: session.user.name,
    action: "user_created",
    detail: `Created user ${name} (${email})`,
  });

  return NextResponse.json({ _id: user._id, name: user.name, email: user.email, role: user.role }, { status: 201 });
}
