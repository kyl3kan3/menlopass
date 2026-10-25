import type { Metadata } from "next";
import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const font = Inter({ subsets: ["latin"] });
const periDisplay = Inter_Tight({ subsets: ["latin"], weight: "800", variable: "--font-peri-display" });
const periLabel = JetBrains_Mono({ subsets: ["latin"], weight: "600", variable: "--font-peri-label" });

export const metadata: Metadata = {
  title: "App Store Screenshots",
  description: "Design and export App Store + Google Play screenshots.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${font.className} ${periDisplay.variable} ${periLabel.variable}`}>{children}</body>
    </html>
  );
}
