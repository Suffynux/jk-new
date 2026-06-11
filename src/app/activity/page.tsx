import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import ActivityFeed from "@/components/ActivityFeed";

export default async function ActivityPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <>
      <Navbar />
      <ActivityFeed />
    </>
  );
}
