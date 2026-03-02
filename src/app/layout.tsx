import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Websentation — AI Presentation Generator",
  description:
    "Create stunning zero-dependency HTML presentations from prompts or PowerPoint files. No signup required.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
