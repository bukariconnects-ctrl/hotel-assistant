import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hotel AI Assistant",
  description: "AI-powered guest assistant for hotels using RAG",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

// =====