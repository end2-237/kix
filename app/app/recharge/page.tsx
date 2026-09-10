"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ScreenHeader } from "@/components/kix/AppHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, CheckIcon, LockIcon } from "@/components/icons";
import { cn } from "@/lib/cn";
import { fcfa, f, packs, venueById, type Pack } from "@/lib/exports";
import { useKix, type PaymentMethod } from "@/lib/store";

type Status = "idle" | "pending" | "done";

export default function RechargePage() {
  const { buyPack } = useKix();
  const venue = venueById("break-akwa");
  const [pack, setPack] = useState<Pack>(packs[1]);
  const [method, setMethod] = useState<PaymentMethod>("momo");
  const [status, setStatus] = useState<Status>("idle");

  const credited = pack.tokens + (pack.bonus ? 2 : 0);

  function pay() {
    setStatus("pending");
    // Démo : on simule l'aller-retour du webhook Mobile Money.
    window.setTimeout(() => {
      buyPack(pack, venue.id, method);
      setStatus("done");
    }, 1800);
  }

  if (status === "done") {
    return (
      <>
        <ScreenHeader title="Paiement confirmé" />
        <Card tone="green" className="mt-6 flex flex-col items-center gap-4 px-5 py-8 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-[20px] bg-green text-green-ink">
            <CheckIcon size={30} />
          </span>
          <div className="flex flex-col gap-1.5">
            <h2 className="text-[22px]">{credited} jetons crédités</h2>
            <p className="text-[13px] text-dim">
              Payé {fcfa(pack.price)} par {method === "om" ? "Orange Money" : "MTN MoMo"} · {venue.name}
            </p>
          </div>
          <Link
            href="/app/pass"
            className="flex h-12 items-center gap-2 rounded-2xl bg-green px-5 text-sm font-semibold text-green-ink"
          >
            Ouvrir mon KIX Pass
            <ArrowRightIcon size={16} />
          </Link>
        </Card>
      </>
    );
  }

  return (
    <>
      <ScreenHeader title="Recharger mes jetons" />

      <Card className="flex items-center gap-3 p-3">
        <Image
          src={venue.image}
          alt={venue.name}
          width={52}
          height={52}
          className="h-13 w-13 rounded-[13px] object-cover"
        />
        <div className="flex grow flex-col gap-0.5">
          <span className="label-caps">Salle sélectionnée</span>
          <span className="text-sm font-semibold">
            {venue.name} · {venue.city}
          </span>
        </div>
        <span className="rounded-xl bg-white/8 px-3 py-2 text-xs text-dim">Changer</span>
      </Card>

      <div className="flex flex-col gap-2.5">
        <h2 className="text-base">Choisis ton pack</h2>
        {packs.map((p) => {
          const active = p.id === pack.id;
          return (
            <button
              key={p.id}
              onClick={() => setPack(p)}
              className={cn(
                "relative flex items-center gap-3.5 rounded-[18px] px-4 py-3.5 text-left transition",
                active
                  ? "glass-green border-[1.5px] border-green shadow-[0_0_26px_rgba(61,240,138,0.18)]"
                  : "glass hover:bg-white/8",
              )}
            >
              <span
                className={cn(
                  "grid h-6 w-6 shrink-0 place-items-center rounded-full",
                  active ? "bg-green text-green-ink" : "border-[1.6px] border-white/28",
                )}
              >
                {active ? <CheckIcon size={12} /> : null}
              </span>
              <span className="flex grow flex-col gap-0.5">
                <span className="text-[15px] font-semibold">
                  {p.tokens === 1 ? "1 jeton" : `Pack ${p.tokens} jetons`}
                </span>
                <span className={cn("text-xs", p.bonus ? "text-violet-soft" : "text-muted")}>
                  {p.bonus ?? p.hint}
                </span>
              </span>
              <span className={cn("font-display text-[17px]", active && "text-green")}>{f(p.price)}</span>
              {p.badge ? (
                <span className="absolute -top-2 right-3.5 rounded-full bg-green px-2.5 py-0.5 text-[9px] font-semibold tracking-[0.08em] text-green-ink uppercase">
                  {p.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2.5">
        <h2 className="text-base">Paiement Mobile Money</h2>
        <div className="flex gap-2.5">
          <MethodTile
            active={method === "om"}
            onClick={() => setMethod("om")}
            code="OM"
            name="Orange Money"
          />
          <MethodTile
            active={method === "momo"}
            onClick={() => setMethod("momo")}
            code="MoMo"
            name="MTN MoMo"
          />
        </div>
        <label className="glass flex h-13 items-center gap-3 rounded-2xl px-4">
          <span className="text-sm text-muted">+237</span>
          <span className="h-6 w-px bg-white/12" />
          <input
            type="tel"
            inputMode="tel"
            defaultValue="6 77 45 12 08"
            aria-label="Numéro Mobile Money"
            className="grow bg-transparent text-[15px] tracking-[0.04em] outline-none placeholder:text-faint"
          />
          <CheckIcon size={17} className="text-green" />
        </label>
      </div>

      <Card tone="dashed" className="flex items-center justify-between px-4 py-3.5">
        <span className="flex flex-col gap-0.5">
          <span className="text-xs text-muted">Total à payer</span>
          <span className="text-[11px] text-muted">Frais de service inclus</span>
        </span>
        <span className="font-display text-[22px]">{fcfa(pack.price)}</span>
      </Card>

      <div className="mt-1 flex flex-col gap-2.5">
        <Button size="lg" onClick={pay} disabled={status === "pending"} className="w-full">
          {status === "pending" ? "Demande envoyée…" : `Payer ${fcfa(pack.price)}`}
          {status === "pending" ? null : <ArrowRightIcon size={18} />}
        </Button>
        <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted">
          <LockIcon size={12} />
          {status === "pending"
            ? "Valide la demande sur ton téléphone"
            : "Confirme la demande MoMo sur ton téléphone"}
        </p>
      </div>
    </>
  );
}

function MethodTile({
  active,
  onClick,
  code,
  name,
}: {
  active: boolean;
  onClick: () => void;
  code: string;
  name: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex grow items-center gap-2.5 rounded-2xl px-3.5 py-3 text-left transition",
        active ? "border-[1.5px] border-green/55 bg-green/10" : "glass hover:bg-white/8",
      )}
    >
      <span
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-[10px] text-[10px] font-semibold",
          active ? "bg-green/20 text-green" : "bg-white/10 text-ink",
        )}
      >
        {code}
      </span>
      <span className="flex flex-col">
        <span className="text-[13px] font-medium">{name}</span>
        <span className={cn("text-[11px]", active ? "text-green" : "text-muted")}>
          {active ? "Sélectionné" : "6 9x xx xx xx"}
        </span>
      </span>
    </button>
  );
}
