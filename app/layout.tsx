import type { Metadata, Viewport } from "next";
import { DoubtSolver } from "@/components/DoubtSolver";
import "katex/dist/katex.min.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "A Tutor for Every Learner",
  description:
    "An AI tutor that finds your exact gap, teaches it in your language, and proves you improved.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#4f46e5",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <DoubtSolver />
      </body>
    </html>
  );
}
