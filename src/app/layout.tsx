import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AtomCerts - Professional Certificate Generator",
  description: "Create, manage, and verify professional certificates with ease. Trusted by organizations worldwide.",
  keywords: ["certificate", "generator", "verification", "professional", "education"],
  authors: [{ name: "AtomCerts Team" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "AtomCerts",
    description: "Professional certificate management system",
    url: "https://atomcerts.com",
    siteName: "AtomCerts",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AtomCerts",
    description: "Professional certificate management system",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
