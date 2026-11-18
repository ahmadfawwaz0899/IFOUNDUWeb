import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import { AppHeader } from "@/components/app-header";
import { BottomNav, BottomNavFallback } from "@/components/bottom-nav";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "IFoundU — AI Lost & Found",
    template: "%s · IFoundU",
  },
  description:
    "Report items you found, search for things you lost, and let AI match photos to reunite owners with their belongings.",
  applicationName: "IFoundU",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0d17" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-dvh flex-col">
        <AppHeader />
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))]">
          {children}
        </main>
        <Suspense fallback={<BottomNavFallback />}>
          <BottomNav />
        </Suspense>
      </body>
    </html>
  );
}
