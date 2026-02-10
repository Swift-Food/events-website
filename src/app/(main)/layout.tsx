"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/lib/auth/authContext";
import { CategoriesProvider } from "@/lib/categories-context";
import { SearchModalProvider } from "@/components/search/SearchModalContext";
import { NotificationProvider } from "@/context/NotificationContext";

export default function MainLayout({
 children,
}: Readonly<{
 children: React.ReactNode;
}>) {
 return (
  <AuthProvider>
   <CategoriesProvider>
    <NotificationProvider>
     <SearchModalProvider>
      <div className="relative h-dvh overflow-hidden">
       <div
        className="fixed inset-0 -z-10"
        style={{
         background:
          "linear-gradient(to bottom, #41296e 0%, #000000 15%)",
        }}
       />
       <Navbar />
       <main className="h-dvh overflow-y-auto overscroll-none pt-[56px] md:pt-[68px]">
        {children}
        <Footer />
       </main>
      </div>
     </SearchModalProvider>
    </NotificationProvider>
   </CategoriesProvider>
  </AuthProvider>
 );
}
