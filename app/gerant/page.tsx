"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import {
  ChartIcon,
  CheckIcon,
  ChevronDownIcon,
  CoinIcon,
  GearIcon,
  KixMark,
  QrIcon,
  TableIcon,
  TicketIcon,
} from "@/components/icons";
import { cn } from "@/lib/cn";
import { f, group, venueById } from "@/lib/exports";
import { useKix } from "@/lib/store";

type Passage = {
  id: string;
  name: string;
  detail: string;
  time: string;
  kind: "jeton" | "billet";
  avatar?: string;
  initials?: string;
  fresh?: boolean;
};

const seedPassages: Passage[] = [
  { id: "s1", name: "Ariel N.", detail: "Jeton · table 3", time: "20:41", kind: "jeton", avatar: "/img/p-ariel.jpg" },
  { id: "s2", name: "Yannick T.", detail: "Billet KIX Open · entrée", time: "20:38", kind: "billet", avatar: "/img/p-yannick.jpg" },
  { id: "s3", name: "Blaise K.", detail: "Jeton · table 1", time: "20:31", kind: "jeton", avatar: "/img/p-champion.jpg" },
  { id: "s4", name: "Merline K.", detail: "Code secours 7391 · table 6", time: "20:24", kind: "jeton", initials: "MK" },
];

const navItems = [
  { label: "Scanner", Icon: QrIcon, active: true },
  { label: "Tables", Icon: TableIcon },
  { label: "Jetons", Icon: CoinIcon },
  { label: "Événements", Icon: TicketIcon },
  { label: "Revenus", Icon: ChartIcon },
  { label: "Réglages", Icon: GearIcon },
];

export default function GerantPage() {
  const { tokens, consumeCode } = useKix();
  const venue = venueById("break-akwa");
  const [code, setCode] = useState("");
  const [passages, setPassages] = useState<Passage[]>(seedPassages);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [debited, setDebited] = useState(128);

  function validate(raw: string) {
    const result = consumeCode(raw);
    if (!result.ok) {
      setFeedback({
        ok: false,
        text: result.reason === "format" ? "Code à 4 chiffres attendu" : `Code ${raw} inconnu ou déjà utilisé`,
      });
      return;
    }
    setDebited((n) => n + 1);
    setPassages((list) => [
      {
        id: result.token.id,
        name: "Ariel N.",
        detail: `Jeton · code ${result.token.code}`,
        time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        kind: "jeton",
        avatar: "/img/p-ariel.jpg",
        fresh: true,
      },
      ...list,
    ]);
    setFeedback({ ok: true, text: `Jeton débité · il reste ${tokens.length - 1} jetons au client` });
    setCode("");
  }

  return (
    <div className="flex min-h-dvh">
      {/* barre latérale : poste de caisse en salle */}
      <aside className="hidden w-62 shrink-0 flex-col gap-6 border-r border-white/7 bg-white/3 p-4 lg:flex">
        <Link href="/" className="flex items-center gap-2.5 px-2">
          <KixMark />
          <span className="flex flex-col gap-px">
            <span className="font-display text-base tracking-[0.14em]">KIX SCAN</span>
            <span className="text-[11px] text-muted">Espace gérant</span>
          </span>
        </Link>

        <div className="glass flex items-center gap-2.5 rounded-2xl p-3">
          <Image src={venue.image} alt={venue.name} width={36} height={36} className="h-9 w-9 rounded-[11px] object-cover" />
          <span className="flex grow flex-col gap-0.5">
            <span className="text-[13px] font-semibold">{venue.name}</span>
            <span className="text-[11px] text-muted">{venue.tables} tables · {venue.area}</span>
          </span>
          <ChevronDownIcon size={14} className="text-muted" />
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map(({ label, Icon, active }) => (
            <span
              key={label}
              className={cn(
                "flex h-11 items-center gap-3 rounded-[14px] px-3 text-sm",
                active ? "border border-green/30 bg-green/12 font-semibold text-green" : "text-dim",
              )}
            >
              <Icon size={18} />
              {label}
            </span>
          ))}
        </nav>

        <div className="glass mt-auto flex items-center gap-2.5 rounded-2xl p-3">
          <Image src="/img/p-gerant.jpg" alt="Serge M." width={36} height={36} className="h-9 w-9 rounded-[11px] object-cover" />
          <span className="flex flex-col gap-0.5">
            <span className="text-[13px] font-semibold">Serge M.</span>
            <span className="text-[11px] text-green">Poste 1 · en ligne</span>
          </span>
        </div>
      </aside>

      <main className="flex grow flex-col gap-5 p-5 lg:p-7">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 lg:flex-col lg:items-start lg:gap-1">
            <span className="lg:hidden">
              <KixMark size={28} />
            </span>
            <h1 className="text-xl lg:text-[26px]">Bonsoir Serge</h1>
            <p className="hidden text-[13px] text-muted lg:block">
              Samedi 03 octobre · service en cours · {venue.name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 rounded-full border border-green/32 bg-green/12 px-3 py-2 text-[11px] text-green">
              <span className="h-1.5 w-1.5 rounded-full bg-green shadow-[0_0_8px_rgba(61,240,138,0.9)]" />
              En ligne
            </span>
            <span className="hidden h-11 items-center rounded-[14px] bg-green px-4 text-[13px] font-semibold text-green-ink lg:flex">
              Ouvrir un tournoi
            </span>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          <Kpi label="Jetons débités" value={String(debited)} hint="+12 % vs hier" hintTone="green" />
          <Kpi label="Recette du jour" value={f(debited * 400)} hint="Versement lundi" tone="green" />
          <Kpi label="Tables occupées" value={`${venue.tables - venue.freeTables + 4} / ${venue.tables}`} hint="2 libres · table 5, 7" />
          <Kpi label="Billets scannés" value="74" hint="KIX Open · 128 inscrits" tone="violet" />
        </div>

        <div className="grid gap-4 lg:grow lg:grid-cols-2">
          <Card className="flex flex-col gap-4 rounded-panel p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[17px]">Scanner un QR</h2>
              <span className="flex items-center gap-2 rounded-full border border-green/30 bg-green/12 px-3 py-1.5 text-[11px] text-green">
                <span className="h-1.5 w-1.5 rounded-full bg-green" />
                Caméra active
              </span>
            </div>

            <div className="relative min-h-64 grow overflow-hidden rounded-[20px] border border-white/8 bg-[#08080A]">
              <Image
                src="/img/table-blue.jpg"
                alt="Aperçu caméra"
                fill
                sizes="(max-width: 1024px) 100vw, 520px"
                className="object-cover opacity-25 saturate-50"
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(61,240,138,0.10),rgba(8,8,10,0.92)_70%)]" />
              <Viewfinder />
              <p className="absolute inset-x-0 bottom-4 text-center text-[13px] text-dim">
                Le jeton est débité dès que le code est lu
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <span className="text-[13px] whitespace-nowrap text-muted">Code secours</span>
              <div className="relative flex grow gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={cn(
                      "grid h-13 grow place-items-center rounded-[14px] border bg-night/60 font-display text-[21px]",
                      code.length === i ? "border-[1.5px] border-green text-green" : "border-white/12 text-ink",
                    )}
                  >
                    {code[i] ?? "–"}
                  </span>
                ))}
                <input
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 4));
                    setFeedback(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && validate(code)}
                  inputMode="numeric"
                  autoComplete="off"
                  aria-label="Code de secours à 4 chiffres"
                  className="absolute inset-0 w-full cursor-pointer rounded-[14px] bg-transparent text-transparent caret-transparent outline-none"
                />
              </div>
              <button
                onClick={() => validate(code)}
                className="flex h-13 items-center justify-center rounded-[14px] bg-green px-6 text-sm font-semibold text-green-ink transition hover:brightness-105"
              >
                Valider
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => (tokens[0] ? validate(tokens[0].code) : setFeedback({ ok: false, text: "Le client n'a plus de jeton" }))}
                className="glass flex h-11 items-center gap-2 rounded-[14px] px-4 text-[13px] text-dim transition hover:bg-white/10"
              >
                <QrIcon size={16} />
                Simuler un scan
              </button>
              {feedback ? (
                <span
                  className={cn(
                    "flex items-center gap-2 rounded-[14px] px-3.5 py-2.5 text-[13px]",
                    feedback.ok
                      ? "border border-green/40 bg-green/12 text-green"
                      : "border border-amber/40 bg-amber/12 text-amber",
                  )}
                >
                  {feedback.ok ? <CheckIcon size={14} /> : null}
                  {feedback.text}
                </span>
              ) : null}
            </div>
          </Card>

          <Card className="flex flex-col gap-3.5 rounded-panel p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[17px]">Derniers passages</h2>
              <span className="text-xs text-green">Exporter</span>
            </div>

            <div className="flex flex-col gap-2.5">
              {passages.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-3.5 py-3",
                    p.fresh ? "border border-green/30 bg-green/10" : "bg-white/4",
                  )}
                >
                  {p.avatar ? (
                    <Image src={p.avatar} alt={p.name} width={38} height={38} className="h-10 w-10 rounded-xl object-cover" />
                  ) : (
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-night-2 text-xs font-semibold text-dim">
                      {p.initials}
                    </span>
                  )}
                  <span className="flex grow flex-col gap-0.5">
                    <span className="text-[13px] font-semibold">{p.name}</span>
                    <span className="text-[11px] text-muted">{p.detail}</span>
                  </span>
                  <span className="text-xs text-muted">{p.time}</span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1.5 text-[11px]",
                      p.kind === "billet" ? "bg-violet/16 text-violet-soft" : "bg-white/8 text-dim",
                    )}
                  >
                    {p.kind === "billet" ? "Pass validé" : "Débité"}
                  </span>
                </div>
              ))}
            </div>

            <Card tone="dashed" className="mt-auto flex items-center justify-between px-4 py-3.5">
              <span className="flex flex-col gap-0.5">
                <span className="text-xs text-muted">Commission KIX du jour</span>
                <span className="text-[11px] text-muted">10 % des jetons vendus en ligne</span>
              </span>
              <span className="font-display text-xl">{group(Math.round(debited * 400 * 0.1))} F</span>
            </Card>
          </Card>
        </div>
      </main>
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
  tone = "neutral",
  hintTone,
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "neutral" | "green" | "violet";
  hintTone?: "green";
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 rounded-card px-4 py-4",
        tone === "green" ? "glass-green" : tone === "violet" ? "glass-violet" : "glass",
      )}
    >
      <span className="text-xs text-muted">{label}</span>
      <span
        className={cn(
          "font-display text-[26px] lg:text-[28px]",
          tone === "green" ? "text-green" : tone === "violet" ? "text-violet-soft" : "text-ink",
        )}
      >
        {value}
      </span>
      <span className={cn("text-[11px]", hintTone === "green" ? "text-green" : "text-muted")}>{hint}</span>
    </div>
  );
}

function Viewfinder() {
  return (
    <>
      <svg
        width="188"
        height="188"
        viewBox="0 0 176 176"
        fill="none"
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -mt-24 -ml-24"
      >
        <path d="M4 46V16a12 12 0 0 1 12-12h30" stroke="#3DF08A" strokeWidth="4" strokeLinecap="round" />
        <path d="M130 4h30a12 12 0 0 1 12 12v30" stroke="#3DF08A" strokeWidth="4" strokeLinecap="round" />
        <path d="M172 130v30a12 12 0 0 1-12 12h-30" stroke="#3DF08A" strokeWidth="4" strokeLinecap="round" />
        <path d="M46 172H16a12 12 0 0 1-12-12v-30" stroke="#3DF08A" strokeWidth="4" strokeLinecap="round" />
      </svg>
      <div className="absolute top-1/2 left-1/2 -ml-22 h-0.5 w-44 bg-linear-to-r from-transparent via-green to-transparent shadow-[0_0_16px_rgba(61,240,138,0.8)]" />
    </>
  );
}
