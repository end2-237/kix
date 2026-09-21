"use client";

import { useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { useSnackbar } from "@/components/ui/Snackbar";
import { CheckIcon, ClockIcon, LockIcon, TableIcon, UserIcon } from "@/components/icons";
import { closeReservation, seatReservation, setTableStatus } from "@/lib/actions";
import { cn } from "@/lib/cn";
import { f } from "@/lib/format";
import type { FloorTable } from "@/lib/queries";

const tone: Record<string, { ring: string; chip: string; label: string }> = {
  free: { ring: "border-jade/45", chip: "bg-jade/15 text-jade-text", label: "Libre" },
  reserved: { ring: "border-gold/55", chip: "bg-gold/15 text-gold-text", label: "Réservée" },
  occupied: { ring: "border-warn/50", chip: "bg-warn/15 text-warn", label: "En jeu" },
  closed: { ring: "border-line", chip: "bg-surface-2 text-muted", label: "Fermée" },
};

const hhmm = (d: Date) =>
  new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

/**
 * Le plan de salle du comptoir : une tuile par table, l'état en couleur, et les
 * trois gestes du service — installer, libérer, fermer — à portée de pouce.
 */
export function FloorPlan({ floor }: { floor: FloorTable[] }) {
  const { notify } = useSnackbar();
  const [pending, startTransition] = useTransition();

  const run = (label: string, fn: () => Promise<void>) =>
    startTransition(async () => {
      await fn();
      notify(label);
    });

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {floor.map(({ table, now, next }) => {
        const state = tone[table.status] ?? tone.free;
        // Les clients arrivent en avance : le gérant installe la réservation en
        // cours, ou à défaut la prochaine attendue, sans attendre l'heure dite.
        const current = now ?? next;
        return (
          <Card
            key={table.id}
            shape="square"
            className={cn("flex flex-col gap-3 border p-4 transition", state.ring)}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="flex items-center gap-2.5">
                <span className="grid h-10 w-10 place-items-center rounded-none bg-surface-2 text-[13px] font-bold">
                  {table.label}
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-[13px] font-semibold capitalize">{table.kind}</span>
                  <span className="text-[11px] text-muted">
                    {table.seats} places · {table.hourlyRate ? `${f(table.hourlyRate)}/h` : "au jeton"}
                  </span>
                </span>
              </span>
              <span className={cn("label-caps shrink-0 rounded-full px-2.5 py-1 text-[10px]", state.chip)}>
                {state.label}
              </span>
            </div>

            {now ? (
              <div className="flex flex-col gap-1 border-t border-line pt-2.5">
                <span className="flex items-center gap-1.5 text-[12.5px] font-semibold">
                  <UserIcon size={13} /> {now.client}
                </span>
                <span className="text-[11px] text-muted">
                  {hhmm(now.reservation.startsAt)} · {now.reservation.minutes} min ·{" "}
                  {now.reservation.players} joueurs
                  {now.reservation.note ? ` · ${now.reservation.note}` : ""}
                </span>
              </div>
            ) : next ? (
              <div className="flex items-center gap-1.5 border-t border-line pt-2.5 text-[11px] text-muted">
                <ClockIcon size={13} />
                Prochaine : {next.client} à {hhmm(next.reservation.startsAt)}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 border-t border-line pt-2.5 text-[11px] text-dim">
                <TableIcon size={13} />
                Rien de prévu ce soir
              </div>
            )}

            <div className="mt-auto flex flex-wrap gap-2">
              {current?.reservation.status === "confirmed" ? (
                <>
                  <Action
                    onClick={() => run("Client installé", () => seatReservation(current.reservation.id))}
                    pending={pending}
                    tone="gold"
                  >
                    <CheckIcon size={14} /> Installer
                  </Action>
                  <Action
                    onClick={() => run("Noté absent", () => closeReservation(current.reservation.id, "no_show"))}
                    pending={pending}
                  >
                    Absent
                  </Action>
                </>
              ) : null}

              {current?.reservation.status === "seated" ? (
                <Action
                  onClick={() => run("Table libérée", () => closeReservation(current.reservation.id))}
                  pending={pending}
                  tone="jade"
                >
                  <CheckIcon size={14} /> Terminer
                </Action>
              ) : null}

              {table.status === "closed" ? (
                <Action onClick={() => run("Table rouverte", () => setTableStatus(table.id, "free"))} pending={pending} tone="jade">
                  Rouvrir
                </Action>
              ) : (
                <>
                  {table.status === "free" ? (
                    <Action onClick={() => run("Table occupée", () => setTableStatus(table.id, "occupied"))} pending={pending}>
                      Occuper
                    </Action>
                  ) : (
                    <Action onClick={() => run("Table libre", () => setTableStatus(table.id, "free"))} pending={pending}>
                      Libérer
                    </Action>
                  )}
                  <Action onClick={() => run("Table fermée", () => setTableStatus(table.id, "closed"))} pending={pending}>
                    <LockIcon size={13} /> Fermer
                  </Action>
                </>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function Action({
  onClick,
  pending,
  tone: variant,
  children,
}: {
  onClick: () => void;
  pending: boolean;
  tone?: "gold" | "jade";
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={pending}
      className={cn(
        "press flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[12px] transition disabled:opacity-45",
        variant === "gold"
          ? "bg-gold font-semibold text-gold-ink hover:brightness-105"
          : variant === "jade"
            ? "glass-jade font-semibold text-jade-text"
            : "border border-line text-dim hover:bg-surface-2 hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
