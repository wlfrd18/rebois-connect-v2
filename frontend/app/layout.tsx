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

export const metadata = {
  title: "Rebois Connect — Reboisez la planète, ensemble",
  description: "La plateforme qui connecte propriétaires fonciers, mécènes et structures de reforestation pour restaurer les écosystèmes dégradés à travers le monde.",
  openGraph: {
    title: "Rebois Connect — Reboisez la planète, ensemble",
    description: "Investissez dans la reforestation. Certifiez votre impact CO₂.",
    url: "https://rebois-connect-v2.vercel.app",
    siteName: "Rebois Connect",
    images: [
      {
        url: "https://rebois-connect-v2.vercel.app/logo.png",
        width: 500,
        height: 500,
        alt: "Rebois Connect",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Rebois Connect",
    description: "Reboisez la planète, ensemble.",
    images: ["https://rebois-connect-v2.vercel.app/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
