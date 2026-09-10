"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { CartIcon, HomeIcon, MapIcon, QrIcon, UserIcon } from "@/components/icons";
import { useCart } from "@/lib/cart";

const left = [
  { href: "/app", label: "Accueil", Icon: HomeIcon },
  { href: "/app/salles", label: "Salles", Icon: MapIcon },
];
const right = [
  { href: "/app/shop", label: "Shop", Icon: CartIcon },
  { href: "/app/rewards", label: "Profil", Icon: UserIcon },
];

export function BottomNav() {
  const pathname = usePathname();
  const { count } = useCart();
  const isActive = (href: string) => (href === "/app" ? pathname === "/app" : pathname.startsWith(href));

  return (
    <nav className="pointer-events-auto fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[430px] px-5 pb-4">
      <div className="glass-strong relative flex h-17 items-center justify-between rounded-full px-6">
        {left.map((item) => (
          <NavItem key={item.href} {...item} active={isActive(item.href)} />
        ))}

        <Link
          href="/app/pass"
          aria-label="Mon KIX Pass"
          className="-mt-11 grid h-14 w-14 place-items-center rounded-full bg-green text-green-ink shadow-[0_10px_28px_rgba(61,240,138,0.35)] transition hover:brightness-105"
        >
          <QrIcon size={25} />
        </Link>

        {right.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            active={isActive(item.href)}
            badge={item.href === "/app/shop" ? count : 0}
          />
        ))}
      </div>
    </nav>
  );
}

function NavItem({
  href,
  label,
  Icon,
  active,
  badge = 0,
}: {
  href: string;
  label: string;
  Icon: (p: { size?: number }) => React.ReactElement;
  active: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "relative flex w-12 flex-col items-center gap-1 py-2 text-[9px] transition",
        active ? "text-green-text" : "text-faint hover:text-dim",
      )}
    >
      <Icon size={21} />
      {label}
      {badge > 0 ? (
        <span className="absolute top-0.5 right-1 grid h-4 min-w-4 place-items-center rounded-full bg-green px-1 text-[9px] font-semibold text-green-ink">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
