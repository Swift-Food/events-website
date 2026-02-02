import type { Metadata } from "next";
import { Geist, Inter } from "next/font/google";
// import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import Script from "next/script";
import "@/styles/globals.css";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { AuthProvider } from "@/lib/auth/authContext";
import { CategoriesProvider } from "@/lib/categories-context";
import { Toaster } from "sonner";
import { SearchModalProvider } from "@/components/search/SearchModalContext";
import { NotificationProvider } from "@/context/NotificationContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400"],
});

const satoshi = localFont({
  src: [
    {
      path: "../styles/Satoshi_Complete/Fonts/WEB/fonts/Satoshi-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../styles/Satoshi_Complete/Fonts/WEB/fonts/Satoshi-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-satoshi",
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
    google: "l_Ow3tEKxEFcM_rrdvkT77bOFCo4wGhoAGFqA8qCYcA",
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
        className={`${inter.variable} ${geistSans.variable} ${satoshi.variable} antialiased`}
      >
        <AuthProvider>
          <CategoriesProvider>
            <NotificationProvider>
              <SearchModalProvider>
                <div className="flex h-screen flex-col overflow-hidden">
                  <Navbar />
                  <main className="flex-1 overflow-y-auto overscroll-none">
                    {children}
                    <Footer />
                  </main>
                </div>
              </SearchModalProvider>
            </NotificationProvider>
          </CategoriesProvider>
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
