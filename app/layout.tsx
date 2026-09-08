import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Expertise coach",
  description:
    "Tells a student whether their statement is a fact, an insight, or a point of view — without writing it for them.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
