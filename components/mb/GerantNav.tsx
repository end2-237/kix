"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BoltIcon, ChartIcon, QrIcon, TableIcon } from "@/components/icons";
import { cn } from "@/lib/cn";

const items = [
  { href: "/gerant", label: "Scanner", Icon: QrIcon },
  { href: "/gerant/salle", label: "Salle", Icon: TableIcon },
  { href: "/gerant/live", label: "Matchs", Icon: BoltIcon },
  { href: "/gerant/service", label: "Service", Icon: ChartIcon },
];

/** Même navigation aux deux formats : colonne à gauche, onglets en bas. */
export function GerantNav({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/gerant" ? pathname === href : pathname.startsWith(href));

  if (mobile) {
    return (
      <nav className="glass-strong fixed inset-x-3 bottom-3 z-30 flex items-center justify-around rounded-full px-2 py-2 lg:hidden">
        {items.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "press flex h-11 grow items-center justify-center gap-2 rounded-full text-[12px] transition",
              isActive(href) ? "bg-gold/15 font-semibold text-gold-text" : "text-dim",
            )}
          >
            <Icon size={17} />
            {label}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav className="flex flex-col gap-1">
      {items.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "press flex h-11 items-center gap-3 rounded-full px-4 text-sm transition",
            isActive(href)
              ? "border border-gold/30 bg-gold/12 font-semibold text-gold-text"
              : "text-dim hover:bg-surface-2 hover:text-ink",
          )}
        >
          <Icon size={18} />
          {label}
        </Link>
      ))}
    </nav>
  );
}
