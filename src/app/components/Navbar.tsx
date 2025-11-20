import Link from "next/link";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Events" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  return (
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-black/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Swift Luma
        </Link>

        <nav className="hidden gap-6 text-sm font-medium text-zinc-600 sm:flex dark:text-zinc-300">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-zinc-950 dark:hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/reserve"
          className="rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background transition-colors hover:bg-zinc-900 dark:hover:bg-zinc-100 dark:hover:text-black"
        >
          Create Event
        </Link>
      </div>
    </header>
  );
}
