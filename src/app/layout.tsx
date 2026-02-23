import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
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
  title: {
    default: "Octav Authless",
    template: "%s | Octav Authless",
  },
  description:
    "Client-side crypto portfolio tracker and tax export tool powered by the Octav API. No backend, no auth — just your API key.",
  icons: {
    icon: "/favicon.svg",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Octav Authless",
    description:
      "Client-side crypto portfolio tracker and tax export tool. Track holdings across 20+ chains, export to 10 tax platforms.",
    siteName: "Octav Authless",
    type: "website",
    images: ["/logo.png"],
  },
  twitter: {
    card: "summary",
    title: "Octav Authless",
    description:
      "Client-side crypto portfolio tracker and tax export tool powered by the Octav API.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
