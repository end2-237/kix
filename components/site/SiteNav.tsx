import Link from "next/link";
import { MasterMark } from "@/components/icons";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const links = [
  { href: "/app/salles", label: "Salles" },
  { href: "/app/shop", label: "Shop" },
  { href: "/app/events", label: "Tournois" },
  { href: "/app/recharge", label: "Tarifs" },
];

export function SiteNav() {
  return (
    <header className="relative z-20 flex items-center justify-between gap-4 border-b border-line px-5 py-4 lg:px-10">
      <nav className="hidden items-center gap-7 text-[13px] text-dim lg:flex">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="relative transition after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-0 after:bg-gold after:transition-all after:duration-300 hover:text-ink hover:after:w-full"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <Link href="/" className="flex items-center gap-2.5 lg:absolute lg:left-1/2 lg:-translate-x-1/2">
        <MasterMark size={26} />
        <span className="text-[13px] font-semibold tracking-[0.22em] uppercase">Master Break Club</span>
      </Link>

      <div className="flex items-center gap-3">
        <span className="hidden text-[13px] text-muted lg:inline">+237 6 77 45 12 08</span>
        <ThemeToggle />
        <Link
          href="/app"
          className="press flex h-11 items-center rounded-full bg-gold px-5 text-[13px] font-semibold text-gold-ink transition hover:brightness-105"
        >
          Ouvrir l&apos;app
        </Link>
      </div>
    </header>
  );
}
