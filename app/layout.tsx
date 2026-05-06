import type { Metadata } from "next";
import { Overpass } from "next/font/google";
import "./globals.css";

const overpass = Overpass({
  variable: "--font-overpass",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Watchedlist",
  description: "A mobile-first movie history app.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${overpass.variable} h-full antialiased`}>
      <body className="min-h-full bg-white text-black">{children}</body>
    </html>
  );
}
