"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "var(--color-slate-900)",
            color: "var(--color-slate-100)",
            border: "1px solid var(--color-slate-700)",
            fontSize: "14px",
          },
          success: { iconTheme: { primary: "var(--color-brand)", secondary: "#fff" } },
        }}
      />
    </SessionProvider>
  );
}
