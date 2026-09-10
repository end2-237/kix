"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useSnackbar } from "@/components/ui/Snackbar";
import { ArrowRightIcon, CheckIcon, LockIcon } from "@/components/icons";
import { purchasePack } from "@/lib/actions";
import { cn } from "@/lib/cn";
import { f, fcfa } from "@/lib/format";
import type { Pack, Venue } from "@/db";

type Status = "idle" | "pending" | "done";

export function RechargeForm({ packs, venues }: { packs: Pack[]; venues: Venue[] }) {
  const { notify } = useSnackbar();
  const [pending, startTransition] = useTransition();
  const [pack, setPack] = useState<Pack>(packs.find((p) => p.badge) ?? packs[0]);
  const [venue, setVenue] = useState<Venue>(venues[0]);
  const [method, setMethod] = useState<"om" | "momo">("momo");
  const [status, setStatus] = useState<Status>("idle");
  const [credited, setCredited] = useState(0);

  function pay() {
    setStatus("pending");
    // Le paiement Mobile Money est simulé : on attend la confirmation « côté
    // téléphone » puis on crédite, comme le fera le webhook OM / MoMo.
    window.setTimeout(() => {
      startTransition(async () => {
        const result = await purchasePack(pack.id, venue.id, method);
        if (!result.ok) {
          setStatus("idle");
          notify("Paiement refusé", { detail: result.error, tone: "amber" });
          return;
        }
        setCredited(result.credited);
        setStatus("done");
        notify(`${result.credited} jetons crédités`, { detail: `Solde : ${result.balance} jetons` });
      });
    }, 1500);
  }

  if (status === "done") {
    return (
      <Card tone="green" shape="panel" className="mt-4 flex flex-col items-center gap-4 px-5 py-9 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-green text-green-ink">
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
          className="flex h-12 items-center gap-2 rounded-full bg-green px-5 text-sm font-semibold text-green-ink"
        >
          Ouvrir mon KIX Pass
          <ArrowRightIcon size={16} />
        </Link>
      </Card>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2.5">
        <h2 className="text-base">Où joues-tu ce soir ?</h2>
        <div className="-mx-5 flex gap-2.5 overflow-x-auto px-5 pb-1">
          {venues.map((v) => (
            <button
              key={v.id}
              onClick={() => setVenue(v)}
              className={cn(
                "flex w-52 shrink-0 items-center gap-2.5 rounded-card p-2.5 text-left transition",
                v.id === venue.id ? "glass-green border-[1.5px] border-green" : "glass hover:bg-surface-2",
              )}
            >
              <Image
                src={v.image}
                alt={v.name}
                width={44}
                height={44}
                className="h-11 w-11 rounded-full object-cover"
              />
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[13px] font-semibold">{v.name}</span>
                <span className="text-[11px] text-muted">Jeton {f(v.tokenPrice)}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <h2 className="text-base">Choisis ton pack</h2>
        {packs.map((p) => {
          const active = p.id === pack.id;
          return (
            <button
              key={p.id}
              onClick={() => setPack(p)}
              className={cn(
                "relative flex items-center gap-3.5 rounded-card px-4 py-3.5 text-left transition",
                active
                  ? "glass-green border-[1.5px] border-green shadow-[0_0_26px_rgba(61,240,138,0.16)]"
                  : "glass hover:bg-surface-2",
              )}
            >
              <span
                className={cn(
                  "grid h-6 w-6 shrink-0 place-items-center rounded-full",
                  active ? "bg-green text-green-ink" : "border-[1.6px] border-line-strong",
                )}
              >
                {active ? <CheckIcon size={12} /> : null}
              </span>
              <span className="flex grow flex-col gap-0.5">
                <span className="text-[15px] font-semibold">
                  {p.tokens === 1 ? "1 jeton" : `Pack ${p.tokens} jetons`}
                </span>
                <span className={cn("text-xs", p.bonus > 0 ? "text-violet-text" : "text-muted")}>
                  {p.bonus > 0 ? `+ ${p.bonus} jetons offerts` : p.hint}
                </span>
              </span>
              <span className={cn("text-[17px] font-bold", active && "text-green-text")}>{f(p.price)}</span>
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
          <MethodTile active={method === "om"} onClick={() => setMethod("om")} code="OM" name="Orange Money" />
          <MethodTile active={method === "momo"} onClick={() => setMethod("momo")} code="MoMo" name="MTN MoMo" />
        </div>
        <label className="glass flex h-13 items-center gap-3 rounded-full px-4">
          <span className="text-sm text-muted">+237</span>
          <span className="h-6 w-px bg-line" />
          <input
            type="tel"
            inputMode="tel"
            defaultValue="6 77 45 12 08"
            aria-label="Numéro Mobile Money"
            className="w-full grow bg-transparent text-[15px] tracking-[0.04em] outline-none placeholder:text-faint"
          />
          <CheckIcon size={17} className="text-green-text" />
        </label>
      </div>

      <Card tone="dashed" shape="square" className="flex items-center justify-between px-4 py-3.5">
        <span className="flex flex-col gap-0.5">
          <span className="text-xs text-muted">Total à payer</span>
          <span className="text-[11px] text-muted">Frais de service inclus</span>
        </span>
        <span className="text-[22px] font-bold tracking-[-0.03em]">{fcfa(pack.price)}</span>
      </Card>

      <div className="mt-1 flex flex-col gap-2.5">
        <Button size="lg" onClick={pay} disabled={status === "pending" || pending} className="w-full">
          {status === "pending" || pending ? "Demande envoyée…" : `Payer ${fcfa(pack.price)}`}
          {status === "pending" || pending ? null : <ArrowRightIcon size={18} />}
        </Button>
        <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted">
          <LockIcon size={12} />
          {status === "pending"
            ? "Valide la demande sur ton téléphone"
            : "Confirme la demande Mobile Money sur ton téléphone"}
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
        "flex grow items-center gap-2.5 rounded-card px-3.5 py-3 text-left transition",
        active ? "border-[1.5px] border-green/55 bg-green/10" : "glass hover:bg-surface-2",
      )}
    >
      <span
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-full text-[10px] font-semibold",
          active ? "bg-green/20 text-green-text" : "bg-surface-2 text-ink",
        )}
      >
        {code}
      </span>
      <span className="flex flex-col">
        <span className="text-[13px] font-medium">{name}</span>
        <span className={cn("text-[11px]", active ? "text-green-text" : "text-muted")}>
          {active ? "Sélectionné" : "6 9x xx xx xx"}
        </span>
      </span>
    </button>
  );
}
