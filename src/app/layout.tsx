import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "FormGod AI – Instant Workout Form Corrector",
  description:
    "Fix your exercise form instantly with AI-powered real-time pose analysis. Get scored 0-100 with specific coaching tips for squats, bench press, deadlifts, and more.",
  keywords: [
    "workout form checker",
    "exercise form AI",
    "squat form analysis",
    "gym form corrector",
    "pose estimation fitness",
  ],
  manifest: "/manifest.json",
  openGraph: {
    title: "FormGod AI – Fix Your Form Instantly",
    description:
      "AI-powered real-time workout form analysis. Get scored and coached on every rep.",
    type: "website",
    siteName: "FormGod AI",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
