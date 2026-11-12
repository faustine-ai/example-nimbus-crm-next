import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { ColorSync } from "@/components/theme/color-sync";
import { Toaster } from "@/components/ui/sonner";
import { COLOR_INIT_SCRIPT, DEFAULT_COLOR_ID } from "@/lib/theme";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Nimbus CRM",
    template: "%s · Nimbus CRM",
  },
  description:
    "A lightweight CRM: contacts, companies, a drag-and-drop deal pipeline, invoices, tasks, notes and a live activity feed.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The inline script sets data-color before React hydrates, hence suppressHydrationWarning.
    <html lang="en" data-color={DEFAULT_COLOR_ID} className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Apply the saved primary color before the first paint to avoid a color flash. */}
        <script dangerouslySetInnerHTML={{ __html: COLOR_INIT_SCRIPT }} />
      </head>
      <body className="font-sans">
        {children}
        <Toaster />
        <ColorSync />
      </body>
    </html>
  );
}
