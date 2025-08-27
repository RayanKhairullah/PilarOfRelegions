import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Laporan Sholat Siswa",
  description: "Sistem pelaporan sholat harian siswa",
  icons: {
    icon: [
      { url: "/logo.svg", sizes: "512x512", type: "image/svg" },
    ],
    apple: "/logo.svg",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <body className={`${inter.className} bg-neutral-900 text-neutral-100`}>{children}</body>
    </html>
  );
}
