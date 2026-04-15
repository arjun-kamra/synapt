import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Synapt",
  description: "Detect attention drift. Reset in seconds. Track what works.",
  openGraph: {
    title: "Synapt",
    description: "Detect attention drift. Reset in seconds. Track what works.",
    siteName: "Synapt",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>
        {children}
      </body>
    </html>
  );
}
