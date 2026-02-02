"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
const IconLinkedIn = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.94 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM3.24 8.5h3.5V21h-3.5V8.5ZM9.86 8.5h3.36v1.7h.05a3.68 3.68 0 0 1 3.32-1.82c3.55 0 4.21 2.34 4.21 5.38V21h-3.5v-6.4c0-1.52-.03-3.49-2.13-3.49-2.13 0-2.45 1.67-2.45 3.38V21h-3.5V8.5h.64Z" />
  </svg>
);

const IconInstagram = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const IconTikTok = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M16.6 5.82A4.28 4.28 0 0 1 13.4 2h-3.1v13.67a2.6 2.6 0 0 1-2.6 2.57 2.6 2.6 0 0 1-2.6-2.57 2.6 2.6 0 0 1 2.6-2.57c.28 0 .56.05.82.13V9.96a6.06 6.06 0 0 0-.82-.06A5.82 5.82 0 0 0 2 15.72 5.82 5.82 0 0 0 7.7 21.5a5.82 5.82 0 0 0 5.82-5.78V9.34A7.44 7.44 0 0 0 17.9 11V7.66a4.28 4.28 0 0 1-1.3-1.84Z" />
  </svg>
);

const IconYouTube = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.84.55 9.38.55 9.38.55s7.54 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.81ZM9.55 15.57V8.43L15.82 12l-6.27 3.57Z" />
  </svg>
);

export default function Footer() {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  return (
    <footer
      className={
        isLanding
          ? "border-t border-zinc-900/10"
          : "relative z-10 border-t border-white/10 backdrop-blur-md"
      }
    >
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo and Links */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <Link href="/">
              <Image
                src="/logo.svg"
                alt="Prismo logo"
                width={32}
                height={32}
                className={`sm:w-5 sm:h-5 ${isLanding ? "" : "invert"}`}
              />
            </Link>
            <nav
              className={`flex items-center gap-4 sm:gap-6 text-sm ${
                isLanding ? "text-zinc-800" : "text-zinc-400"
              }`}
            >
              <Link
                href="/"
                className={`transition-colors ${isLanding ? "hover:text-black" : "hover:text-white"}`}
              >
                Discover
              </Link>
              <Link
                href="/event-creation"
                className={`transition-colors ${isLanding ? "hover:text-black" : "hover:text-white"}`}
              >
                Create
              </Link>
              <Link
                href="/terms/ticket"
                className={`transition-colors ${isLanding ? "hover:text-black" : "hover:text-white"}`}
              >
                Terms
              </Link>
            </nav>
          </div>
          {/* Social Media Links */}
          <div className="flex items-center gap-4">
            <a
              href="https://www.linkedin.com/company/prismolive/"
              target="_blank"
              rel="noopener noreferrer"
              className={`transition-colors ${isLanding ? "text-zinc-600 hover:text-zinc-900" : "text-zinc-400 hover:text-white"}`}
              aria-label="LinkedIn"
            >
              <IconLinkedIn className="h-[18px] w-[18px]" />
            </a>
            <a
              href="https://www.instagram.com/prismo.live/"
              target="_blank"
              rel="noopener noreferrer"
              className={`transition-colors ${isLanding ? "text-zinc-600 hover:text-zinc-900" : "text-zinc-400 hover:text-white"}`}
              aria-label="Instagram"
            >
              <IconInstagram className="h-[18px] w-[18px]" />
            </a>
            <a
              href="https://www.tiktok.com/@prismo.live"
              target="_blank"
              rel="noopener noreferrer"
              className={`transition-colors ${isLanding ? "text-zinc-600 hover:text-zinc-900" : "text-zinc-400 hover:text-white"}`}
              aria-label="TikTok"
            >
              <IconTikTok className="h-[16px] w-[16px]" />
            </a>
            <a
              href="https://www.youtube.com/@prismolive"
              target="_blank"
              rel="noopener noreferrer"
              className={`transition-colors ${isLanding ? "text-zinc-600 hover:text-zinc-900" : "text-zinc-400 hover:text-white"}`}
              aria-label="YouTube"
            >
              <IconYouTube className="h-[18px] w-[18px]" />
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div
          className={`mt-6 text-center text-xs ${isLanding ? "text-zinc-700" : "text-zinc-500"}`}
        >
          <p>&copy; {new Date().getFullYear()} Prismo. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
