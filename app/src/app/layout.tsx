import "./globals.css";
import type { Metadata } from "next";
import { Dock } from "@/components/sidebar";
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');if(t==='dark'){document.documentElement.classList.add('dark')}}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-bg-base text-text-primary">
        <DemoBanner />
        <Topbar />
        <main className="flex-1 min-w-0 overflow-y-auto px-6 pt-6 pb-28">
          <div key="page" className="mx-auto w-full max-w-5xl page-enter">{children}</div>
        </main>
        <Dock />
      </body>
    </html>
  );
}
