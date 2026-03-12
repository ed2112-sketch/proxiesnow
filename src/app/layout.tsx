import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ProxiesNow — High Quality Private Proxies",
  description: "Buy private, shared, and SOCKS5 proxies with unlimited bandwidth and 24/7 support.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex min-h-screen flex-col bg-white`}>{children}</body>
    </html>
  );
}
