import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FocusLoop",
  description: "Cognitive science-based productivity — detect drift, reset, recover.",
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
