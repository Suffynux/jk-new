"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import ThemeToggle from "@/components/ThemeToggle";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Board" },
    { href: "/activity", label: "Activity" },
    ...(session?.user?.role === "superadmin" ? [{ href: "/users", label: "Users" }] : []),
  ];

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200 bg-slate-950/90 backdrop-blur dark:border-slate-800">
      <div className="mx-auto max-w-7xl px-3 sm:px-4">
        <div className="flex items-center justify-between gap-2 py-2.5">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <Image
              src="/updatedLogo.png"
              alt="JK News"
              width={120}
              height={48}
              priority
              className="h-9 w-auto sm:h-10"
            />
            <span className="hidden text-base font-bold tracking-tight sm:inline">
              <span className="text-brand">News</span>{" "}
              <span className="text-gold">Records</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden gap-1 md:flex">
            {links.map((link) => (
              <NavLink key={link.href} {...link} active={pathname === link.href} />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">{session?.user?.name}</p>
              <p className="text-xs text-slate-500">
                {session?.user?.role === "superadmin" ? "Super Admin" : "Member"}
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-600 transition hover:border-brand hover:text-brand dark:border-slate-700 dark:text-slate-300"
            >
              <span className="hidden sm:inline">Sign out</span>
              <span className="sm:hidden" aria-label="Sign out">⎋</span>
            </button>
          </div>
        </div>

        {/* Mobile nav links */}
        <div className="flex gap-1 pb-2 md:hidden">
          {links.map((link) => (
            <NavLink key={link.href} {...link} active={pathname === link.href} className="flex-1 text-center" />
          ))}
        </div>
      </div>
    </nav>
  );
}

function NavLink({
  href,
  label,
  active,
  className = "",
}: {
  href: string;
  label: string;
  active: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
        active
          ? "bg-brand text-white"
          : "text-slate-500 hover:bg-slate-900 hover:text-slate-100"
      } ${className}`}
    >
      {label}
    </Link>
  );
}
