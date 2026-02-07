import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scrum Update Generator",
  description: "Lightning-fast Jira scrum update with Claude AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
