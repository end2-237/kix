"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { MomoCheckout, type Method } from "@/components/mb/MomoCheckout";
import { Sheet } from "@/components/ui/Sheet";
import { useSnackbar } from "@/components/ui/Snackbar";
import { CheckIcon, ClockIcon, LockIcon, UserIcon } from "@/components/icons";
import { reserveTable } from "@/lib/actions";
import { cn } from "@/lib/cn";
import { f, fcfa } from "@/lib/format";
import type { FloorTable } from "@/lib/queries";

const DURATIONS = [60, 90, 120, 180];

/** 90 → « 1 h 30 », 60 → « 1 h », 45 → « 45 min ». */
function duration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!h) return `${rest} min`;
  return rest ? `${h} h ${rest}` : `${h} h`;
}

/** Créneaux d'une soirée camerounaise : de 17 h à 1 h du matin, par demi-heure. */
function slots(): { iso: string; label: string }[] {
  const out: { iso: string; label: string }[] = [];
  const base = new Date();
  base.setSeconds(0, 0);
  base.setMinutes(base.getMinutes() > 30 ? 60 : 30);

  for (let i = 0; i < 18; i++) {
    const d = new Date(base.getTime() + i * 30 * 60_000);
    if (d.getHours() >= 2 && d.getHours() < 16) continue;
    out.push({
      iso: d.toISOString(),
      label: d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    });
  }
  return out;
}

export function BookTable({ floor, phone }: { floor: FloorTable[]; phone: string }) {
  const { notify } = useSnackbar();
  const router = useRouter();
  const times = useMemo(() => slots(), []);

  const [table, setTable] = useState<FloorTable | null>(null);
  const [startsAt, setStartsAt] = useState(times[0]?.iso ?? new Date().toISOString());
  const [minutes, setMinutes] = useState(90);
  const [players, setPlayers] = useState(2);
  const [note, setNote] = useState("");

  const start = async (phoneNumber: string, method: Method) => {
    if (!table) return { ok: false as const, error: "Choisis une table" };
    const result = await reserveTable(table.table.id, startsAt, minutes, players, phoneNumber, method, note);
    if (!result.ok) return result;
    return { ok: true as const, reference: result.reference, instruction: result.instruction };
  };

  function onPaid() {
    const label = table?.table.label;
    setTable(null);
    notify("Table réservée", { detail: `Table ${label} · ${minutes} min`, tone: "jade" });
    router.refresh();
    router.push("/app/reservations");
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {floor.map((item) => {
          const { table: t, now, next } = item;
          const bookable = t.status !== "closed";
          return (
            <button
              key={t.id}
              onClick={() => bookable && setTable(item)}
              disabled={!bookable}
              data-table={t.label}
              aria-label={`Table ${t.label}`}
              className={cn(
                "press flex flex-col gap-2.5 rounded-card border p-4 text-left transition disabled:opacity-45",
                t.status === "free"
                  ? "border-jade/40 bg-jade/5 hover:bg-jade/10"
                  : t.status === "closed"
                    ? "border-line bg-surface"
                    : "glass hover:bg-surface-2",
              )}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="grid h-10 w-10 place-items-center rounded-none bg-surface-2 text-[13px] font-bold">
                  {t.label}
                </span>
                <span
                  className={cn(
                    "label-caps rounded-full px-2.5 py-1 text-[10px]",
                    t.status === "free"
                      ? "bg-jade/15 text-jade-text"
                      : t.status === "closed"
                        ? "bg-surface-2 text-muted"
                        : "bg-warn/15 text-warn",
                  )}
                >
                  {t.status === "free" ? "Libre" : t.status === "closed" ? "Fermée" : "Occupée"}
                </span>
              </span>

              <span className="flex flex-col gap-0.5">
                <span className="text-[13px] font-semibold capitalize">{t.kind}</span>
                <span className="text-[11px] text-muted">
                  {t.seats} places · {t.hourlyRate ? `${f(t.hourlyRate)}/h` : "au jeton"}
                </span>
              </span>

              <span className="flex items-center gap-1.5 border-t border-line pt-2 text-[11px] text-muted">
                <ClockIcon size={12} />
                {now || t.status === "occupied"
                  ? "Occupée — réserve pour plus tard"
                  : next
                    ? `Libre jusqu'à ${new Date(next.reservation.startsAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
                    : "Libre toute la soirée"}
              </span>

              {bookable ? (
                <span className="mt-1 flex items-center gap-1.5 text-[12px] font-semibold text-gold-text">
                  Réserver · acompte {fcfa(t.deposit)}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <Sheet
        open={Boolean(table)}
        onClose={() => setTable(null)}
        title={table ? `Table ${table.table.label}` : ""}
        className="sm:max-w-[30rem]"
      >
        {table ? (
          <div className="flex flex-col gap-4">
            <Group label="À quelle heure ?">
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                {times.map((t) => (
                  <Pick key={t.iso} active={startsAt === t.iso} onClick={() => setStartsAt(t.iso)}>
                    {t.label}
                  </Pick>
                ))}
              </div>
            </Group>

            <Group label="Combien de temps ?">
              <div className="flex flex-wrap gap-2">
                {DURATIONS.map((m) => (
                  <Pick key={m} active={minutes === m} onClick={() => setMinutes(m)}>
                    {duration(m)}
                  </Pick>
                ))}
              </div>
            </Group>

            <Group label="Combien de joueurs ?">
              <div className="flex flex-wrap gap-2">
                {[2, 3, 4, 6].map((p) => (
                  <Pick key={p} active={players === p} onClick={() => setPlayers(p)}>
                    <UserIcon size={13} /> {p}
                  </Pick>
                ))}
              </div>
            </Group>

            <label className="flex flex-col gap-2">
              <span className="label-caps text-[11px] text-muted">Un mot pour la salle</span>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Table près du bar, anniversaire…"
                className="h-12 rounded-none border border-line bg-surface px-3.5 text-[14px] outline-none focus:border-gold"
              />
            </label>

            <p className="flex items-start gap-2 rounded-none border border-line bg-surface px-3.5 py-3 text-[11.5px] leading-5 text-muted">
              <LockIcon size={13} className="mt-0.5 shrink-0" />
              L&apos;acompte de {fcfa(table.table.deposit)} retient la table et se déduit de ta note à
              l&apos;arrivée. Il reste acquis à la salle en cas d&apos;absence.
            </p>

            <MomoCheckout
              amount={table.table.deposit}
              defaultPhone={phone}
              start={start}
              onPaid={onPaid}
              hint={`Table ${table.table.label} · ${duration(minutes)}`}
              label={`Retenir la table · ${fcfa(table.table.deposit)}`}
            />
          </div>
        ) : null}
      </Sheet>
    </>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="label-caps text-[11px] text-muted">{label}</span>
      {children}
    </div>
  );
}

function Pick({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "press flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] whitespace-nowrap transition",
        active ? "bg-gold font-semibold text-gold-ink" : "glass text-dim hover:text-ink",
      )}
    >
      {active ? <CheckIcon size={13} /> : null}
      {children}
    </button>
  );
}
