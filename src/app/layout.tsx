import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "@/styles/globals.css";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
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
  description: "",
  // Apparently keywords meta tag is ignored by Google
  keywords: [
    "luma",
    "eventbrite",
    "event",
    "event discovery",
    "event tickets",
    "event registration",
    "event booking",
    "event hosting",
    "event discovery",
    "local events",
    "upcoming events",
    "things to do",
    "conferences",
    "workshops",
    "hosting",
    "register",
    "buy tickets",
    "get tickets",
    "free tickets",
    "virtual events",
    "classes",
    "webinars",
    "festivals",
    "meetups",
    "society",
    "society event",
    "UCL event",
    "KCL event",
    "LSE event",
    "networking",
    "RSVP",
    "sell tickets",
    "event management",
    "events near me",
    "London events",
    "private event",
    "private event hosting",
    "event ticketing platform",
    "online registration",
    "event organiser tools",
    "event-order",
    "food delivery",
    "UK",
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
    url: "https://prismo.live/",
    siteName: "Prismo",
    title: "Prismo",
    description: "",
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
        <meta name="google-site-verification" content="adpKD3g-CZhZcqQThLRFwNkpl9_BD9tTxZbTJfkHPXE" />
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
            <Footer />
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
