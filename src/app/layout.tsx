import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "@/styles/globals.css";
import Navbar from "../components/layout/Navbar";
import { AuthProvider } from "@/lib/auth/authContext";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});



export const metadata: Metadata = {
  title: "Prismo",
  description:
    "",
  keywords: [
    "luma",
    "eventbrite",
    "event",
    "food delivery",
    "events",
    "UK",
    "event-order",
    "streetfood",
    "street food",
    "delivery",
    "catering",
    "swift",
  ],
  authors: [{ name: "Swift Food Services ltd" }],

  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },

  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "https://swiftfood.uk",
    siteName: "Swift Food",
    title: "Swift Food - Planning made easy, Catering made better.",
    description: "We provide event ordering and delivery of the best local eats in London",
    
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  verification: {
    google: "bu1_vFJg_q2u8Syf9Cith5Q6G_Zld7hqwqLw8gDdtSM", // Add this from Google Search Console
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="beforeInteractive"
        />
        <Script
          src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"
          strategy="beforeInteractive"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
          </div>
        </AuthProvider>
        <Toaster
          position="top-right"
          richColors
          closeButton
          theme="dark" // or "light" based on your theme
        />
      </body>
    </html>
  );
}
