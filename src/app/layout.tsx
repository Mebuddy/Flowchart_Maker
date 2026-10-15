import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flowcraft — AI-Powered Text-to-Flowchart Studio",
  description:
    "Transform natural language descriptions into interactive, editable, exportable flowcharts with automated ELK.js layout and Gemini AI.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased select-none">{children}</body>
    </html>
  );
}
