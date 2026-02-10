import type { Metadata } from "next";
import { Geist, Inter } from "next/font/google";
import localFont from "next/font/local";
import "@/styles/globals.css";

const geistSans = Geist({
 variable: "--font-geist-sans",
 subsets: ["latin"],
 weight: ["300", "400", "500", "600", "700"],
});

const inter = Inter({
 variable: "--font-inter",
 subsets: ["latin"],
 weight: ["400"],
});

const satoshi = localFont({
 src: [
  {
   path: "../../styles/Satoshi_Complete/Fonts/WEB/fonts/Satoshi-Regular.woff2",
   weight: "400",
   style: "normal",
  },
  {
   path: "../../styles/Satoshi_Complete/Fonts/WEB/fonts/Satoshi-Bold.woff2",
   weight: "700",
   style: "normal",
  },
 ],
 variable: "--font-satoshi",
});

export const metadata: Metadata = {
 title: "Prismo Event Embed",
 robots: {
  index: false,
  follow: false,
 },
};

export default function EmbedLayout({
 children,
}: Readonly<{
 children: React.ReactNode;
}>) {
 return (
  <html lang="en">
   <body
    className={`${inter.variable} ${geistSans.variable} ${satoshi.variable} antialiased`}
    style={{ background: "transparent", margin: 0, padding: 0 }}
   >
    {children}
   </body>
  </html>
 );
}
