import "./globals.css";
import type { Metadata } from "next";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { DemoBanner } from "@/components/DemoBanner";

export const metadata: Metadata = {
  title: "AI Evaluation Tool",
  description: "AI quality + groundedness lab",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex bg-bg-base text-text-primary">
        <Sidebar />
        <main className="flex-1 min-w-0 flex flex-col">
          <DemoBanner />
          <Topbar />
          <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        </main>
      </body>
    </html>
  );
}
