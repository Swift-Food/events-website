import Link from "next/link";
import Image from "next/image";
import { Instagram, Youtube, Linkedin } from "lucide-react";

// TikTok icon component (not available in lucide)
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-background">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-row items-center gap-6 sm:flex-row sm:justify-between">
          {/* Logo and Brand */}
          <Link
            href="/"
            className="flex items-center gap-1 text-lg font-semibold tracking-tight"
          >
            <Image
              src="/logo.svg"
              alt="Prismo logo"
              width={20}
              height={20}
              className="invert"
            />
            <span
              className="font-normal text-zinc-400"
              style={{ fontFamily: "var(--font-satoshi), sans-serif" }}
            >
              PRISMO
            </span>
          </Link>

          {/* Links */}
          <nav className="flex flex-wrap justify-center gap-6 text-sm text-zinc-400">
            <Link href="/" className="transition-colors hover:text-white">
              Discover
            </Link>
            <Link
              href="/event-creation"
              className="transition-colors hover:text-white"
            >
              Create
            </Link>
            <Link
              href="/terms/ticket"
              className="transition-colors hover:text-white"
            >
              Terms
            </Link>
          </nav>
          {/* Social Media Links */}
          <div className="flex justify-center items-center gap-4">
            <a
              href="https://www.linkedin.com/company/prismolive/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 transition-colors hover:text-white"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-5 w-5" />
            </a>
            <a
              href="https://www.instagram.com/prismo.live/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 transition-colors hover:text-white"
              aria-label="Instagram"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a
              href="https://www.tiktok.com/@prismo.live"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 transition-colors hover:text-white"
              aria-label="TikTok"
            >
              <TikTokIcon className="h-5 w-5" />
            </a>
            <a
              href="https://www.youtube.com/@prismolive"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 transition-colors hover:text-white"
              aria-label="YouTube"
            >
              <Youtube className="h-5 w-5" />
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 text-center text-xs text-zinc-500">
          <p>&copy; {new Date().getFullYear()} Prismo. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
