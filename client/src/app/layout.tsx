import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ojyks",
  description: "Ojyks Card Game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <head>
        <meta name="theme-color" content="#0f172b" />
      </head>
      <body>
        {children}
        {process.env.NEXT_PUBLIC_VERSION && (
          <div
            style={{
              position: "fixed",
              bottom: "0.5rem",
              right: "0.5rem",
              fontSize: "0.625rem",
              opacity: 0.4,
              pointerEvents: "none",
              fontFamily: "monospace",
            }}
          >
            v{process.env.NEXT_PUBLIC_VERSION}
          </div>
        )}
      </body>
    </html>
  );
}
