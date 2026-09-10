"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { CartIcon, HomeIcon, MapIcon, QrIcon, UserIcon } from "@/components/icons";

const items = [
  { href: "/app", label: "Accueil", Icon: HomeIcon },
  { href: "/app/salles", label: "Salles", Icon: MapIcon },
  { href: "/app/shop", label: "Shop", Icon: CartIcon },
  { href: "/app/rewards", label: "Profil", Icon: UserIcon },
];

export function BottomNav() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/app" ? pathname === "/app" : pathname.startsWith(href));
  const [left, right] = [items.slice(0, 2), items.slice(2)];

  return (
    <nav className="pointer-events-auto fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[430px] px-5 pb-4">
      <div className="glass-strong relative flex h-17 items-center justify-between rounded-[24px] px-6">
        {left.map(({ href, label, Icon }) => (
          <NavItem key={href} href={href} label={label} Icon={Icon} active={isActive(href)} />
        ))}

        <Link
          href="/app/pass"
          aria-label="Mon KIX Pass"
          className="-mt-11 grid h-14 w-14 place-items-center rounded-[20px] bg-green text-green-ink shadow-[0_10px_28px_rgba(61,240,138,0.35)] transition hover:brightness-105"
        >
          <QrIcon size={25} />
        </Link>

        {right.map(({ href, label, Icon }) => (
          <NavItem key={href} href={href} label={label} Icon={Icon} active={isActive(href)} />
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
}: {
  href: string;
  label: string;
  Icon: (p: { size?: number }) => React.ReactElement;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex w-12 flex-col items-center gap-1 py-2 text-[9px] transition",
        active ? "text-green" : "text-faint hover:text-dim",
      )}
    >
      <Icon size={21} />
      {label}
    </Link>
  );
}
