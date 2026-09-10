import Image from "next/image";
import Link from "next/link";
import { QrCode } from "@/components/kix/QrCode";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  CartIcon,
  CheckIcon,
  KixMark,
  QrIcon,
  TargetIcon,
  TicketIcon,
} from "@/components/icons";

const navLinks = [
  { href: "/app/salles", label: "Salles" },
  { href: "/app/shop", label: "KIX Shop" },
  { href: "/app/events", label: "Événements" },
  { href: "/app/recharge", label: "Tarifs" },
];

const modules = [
  {
    icon: <QrIcon size={19} />,
    tone: "green" as const,
    title: "KIX Pass",
    text: "Jetons achetés à distance, QR unique par partie, code de secours hors ligne.",
    href: "/app/pass",
  },
  {
    icon: <TargetIcon size={19} />,
    tone: "green" as const,
    title: "KIX Scan",
    text: "Le gérant scanne, le jeton tombe. Moins d'une seconde, même en 3G.",
    href: "/gerant",
  },
  {
    icon: <CartIcon size={19} />,
    tone: "violet" as const,
    title: "KIX Shop",
    text: "Puffs, e-liquides, queues et craies livrés à Douala ou retirés en salle.",
    href: "/app/shop",
  },
  {
    icon: <TicketIcon size={19} />,
    tone: "violet" as const,
    title: "KIX Events",
    text: "Billetterie de tournois, pass scannés à l'entrée, classement à la clé.",
    href: "/app/events",
  },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      <div className="halo halo-green -top-56 -left-30 h-175 w-175" />
      <div className="halo halo-violet top-30 -right-45 h-160 w-160" />

      <header className="relative flex h-20 items-center justify-between border-b border-white/7 px-5 lg:px-18">
        <div className="flex items-center gap-11">
          <Link href="/" className="flex items-center gap-2.5">
            <KixMark size={32} />
            <span className="font-display text-[21px] tracking-[0.16em]">KIX</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-dim lg:flex">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="transition hover:text-ink">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <ButtonLink href="/gerant" variant="glass" size="sm" className="hidden sm:inline-flex">
            <QrIcon size={16} />
            Espace gérant
          </ButtonLink>
          <ButtonLink href="/app" size="sm">
            Ouvrir l&apos;app
          </ButtonLink>
        </div>
      </header>

      <main className="relative px-5 pt-12 pb-16 lg:px-18 lg:pt-12">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:gap-15">
          <div className="flex w-full flex-col gap-6 lg:w-155 lg:shrink-0">
            <span className="flex w-fit items-center gap-2.5 rounded-full border border-green/32 bg-green/12 px-3.5 py-2 text-xs tracking-[0.04em] text-green">
              <span className="h-1.5 w-1.5 rounded-full bg-green shadow-[0_0_8px_rgba(61,240,138,0.9)]" />
              Douala &amp; Yaoundé · [12] salles partenaires
            </span>

            <h1 className="text-[42px] leading-[1.02] lg:text-[62px]">
              Le billard, la vape
              <br />
              et la nuit — dans
              <br />
              <span className="text-green">une seule app.</span>
            </h1>

            <p className="max-w-130 text-base leading-7 text-dim text-pretty lg:text-[17px]">
              Achète tes jetons depuis ton téléphone, scanne ton QR à la table, commande tes puffs et
              prends tes billets de tournoi. Paiement Orange Money et MTN MoMo, crédit instantané.
            </p>

            <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center">
              <ButtonLink href="/app/recharge" size="lg">
                Acheter mes jetons
                <QrIcon size={18} />
              </ButtonLink>
              <ButtonLink href="/gerant" variant="glass" size="lg">
                Devenir salle partenaire
              </ButtonLink>
            </div>

            <dl className="mt-2 flex flex-wrap gap-x-10 gap-y-5 border-t border-white/8 pt-6">
              {[
                { value: "[4 300]", label: "jetons scannés / mois" },
                { value: "< 2 s", label: "pour débiter un jeton" },
                { value: "OM · MoMo", label: "paiement mobile natif" },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col gap-1.5">
                  <dt className="font-display text-[26px]">{stat.value}</dt>
                  <dd className="text-[13px] text-muted">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative min-h-100 w-full grow lg:min-h-113">
            <div className="absolute inset-0 overflow-hidden rounded-[28px] border border-white/9">
              <Image
                src="/img/hero-player.jpg"
                alt="Joueur de billard dans une salle de Douala"
                fill
                sizes="(max-width: 1024px) 100vw, 640px"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(11,11,13,0.30),rgba(11,11,13,0.90))]" />
            </div>

            <Card className="absolute top-8 left-6 flex w-67 flex-col items-center gap-3.5 rounded-[26px] bg-night-2/80 p-5 backdrop-blur-xl lg:top-11 lg:left-11">
              <div className="flex w-full items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="label-caps">KIX Pass</span>
                  <span className="font-display text-xl text-green">07 jetons</span>
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-green/15 px-2.5 py-1.5 text-[10px] text-green">
                  <span className="h-1.5 w-1.5 rounded-full bg-green" />
                  Prêt
                </span>
              </div>
              <div className="rounded-[18px] bg-white p-2.5">
                <QrCode value="kix://jeton/4826" size={150} />
              </div>
              <span className="text-xs text-dim">
                Code de secours · <span className="font-display tracking-[0.14em] text-ink">4826</span>
              </span>
            </Card>

            <Card className="absolute right-6 bottom-14 flex items-center gap-3 rounded-card border-green/45 bg-night-2/85 px-4 py-3.5 backdrop-blur-xl lg:right-8">
              <span className="grid h-10 w-10 place-items-center rounded-[13px] bg-green text-green-ink">
                <CheckIcon size={20} />
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-[13px] font-semibold">Jeton débité · Table 3</span>
                <span className="text-[11px] text-muted">Le Break Akwa · il y a 2 s</span>
              </span>
            </Card>
          </div>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:mt-18 lg:grid-cols-4">
          {modules.map((module) => (
            <Link
              key={module.title}
              href={module.href}
              className="glass flex flex-col gap-2.5 rounded-[22px] p-5 transition hover:bg-white/8"
            >
              <span
                className={
                  module.tone === "green"
                    ? "grid h-10 w-10 place-items-center rounded-[13px] border border-green/30 bg-green/15 text-green"
                    : "grid h-10 w-10 place-items-center rounded-[13px] border border-violet/30 bg-violet/15 text-violet-soft"
                }
              >
                {module.icon}
              </span>
              <span className="text-[15px] font-semibold">{module.title}</span>
              <span className="text-[13px] leading-5 text-muted">{module.text}</span>
            </Link>
          ))}
        </div>
      </main>

      <footer className="relative border-t border-white/7 px-5 py-8 lg:px-18">
        <div className="flex flex-col gap-3 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>KIX · Douala, Cameroun · prix et salles donnés à titre d&apos;exemple</span>
          <span className="flex gap-5">
            <Link href="/app" className="hover:text-dim">
              L&apos;app
            </Link>
            <Link href="/gerant" className="hover:text-dim">
              Espace gérant
            </Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
