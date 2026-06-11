import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import UsersManager from "@/components/UsersManager";

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "superadmin") redirect("/");

  return (
    <>
      <Navbar />
      <UsersManager />
    </>
  );
}
