import type { Metadata } from "next";
import { Geist, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { ClerkProvider } from '@clerk/nextjs'
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agrigrowth Monitor",
  description: "Agricultural growth tracker wireframes and dashboard views.",
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} ${plusJakartaSans.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">
          {children}
          <Toaster position="top-center" />
        </body>
      </html>
    </ClerkProvider>
  );
}
