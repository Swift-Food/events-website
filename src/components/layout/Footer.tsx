import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-background">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
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
            <span className="font-normal text-zinc-400">PRISMO</span>
          </Link>

          {/* Links */}
          <nav className="flex flex-wrap justify-center gap-6 text-sm text-zinc-400">
            <Link href="/events" className="transition-colors hover:text-white">
              Events
            </Link>
            <Link href="/calendars" className="transition-colors hover:text-white">
              Calendars
            </Link>
            <Link href="/event-creation" className="transition-colors hover:text-white">
              Create Event
            </Link>
            <Link href="/event-management" className="transition-colors hover:text-white">
              Manage
            </Link>
            <Link href="/terms/organizer" className="transition-colors hover:text-white">
              Organizer Terms
            </Link>
            <Link href="/terms/ticket" className="transition-colors hover:text-white">
              Ticket Terms
            </Link>
          </nav>
        </div>

        {/* Copyright */}
        <div className="mt-6 text-center text-xs text-zinc-500">
          <p>&copy; {new Date().getFullYear()} Prismo. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
