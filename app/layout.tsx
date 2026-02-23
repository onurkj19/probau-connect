import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";

import { AppProviders } from "@/components/providers/app-providers";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://probau.ch"),
  title: {
    default: "ProBau.ch | Swiss Construction Marketplace",
    template: "%s | ProBau.ch",
  },
  description:
    "ProBau.ch is a Swiss SaaS platform connecting Arbeitsgeber with qualified Unternehmer for construction tenders.",
  openGraph: {
    title: "ProBau.ch | Swiss Construction Marketplace",
    description:
      "Professional Swiss marketplace for construction projects, offers, and subscription-based contractor workflows.",
    type: "website",
  },
};

const RootLayout = ({ children }: { children: ReactNode }) => (
  <html lang="en">
    <body className={inter.className}>
      <AppProviders>{children}</AppProviders>
    </body>
  </html>
);

export default RootLayout;
