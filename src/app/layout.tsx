import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "JK-News Records",
  description: "News & report workflow tracker for the studio",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.className} min-h-screen bg-slate-950 text-slate-100 antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
