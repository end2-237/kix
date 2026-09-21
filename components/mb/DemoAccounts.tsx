"use client";

import { useState } from "react";
import { ChevronDownIcon } from "@/components/icons";
import { cn } from "@/lib/cn";

/**
 * Comptes de démonstration. Ils vivent ici plutôt que dans la base : la page de
 * connexion ne doit jamais énumérer les utilisateurs réels.
 */
const accounts = [
  { role: "Client", name: "Ariel N.", phone: "6 77 45 12 08", hint: "Pass, jetons, shop, billets" },
  { role: "Gérant", name: "Serge M.", phone: "6 99 12 03 45", hint: "Master Scan, caisse de la salle" },
  { role: "Direction", name: "Master Break", phone: "6 90 00 00 00", hint: "Catalogue, salles, revenus" },
];

export function DemoAccounts({ password = "masterbreak" }: { password?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3 border-t border-line pt-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-1.5 self-start text-[12px] tracking-[0.1em] text-dim uppercase transition hover:text-ink"
      >
        Comptes de démonstration
        <ChevronDownIcon size={14} className={cn("transition", open && "rotate-180")} />
      </button>

      {open ? (
        <ul className="stagger flex flex-col gap-2">
          {accounts.map((account) => (
            <li
              key={account.phone}
              className="flex items-center gap-3 border border-line bg-surface px-3.5 py-2.5 text-[12.5px]"
            >
              <span className="flex grow flex-col gap-0.5">
                <span className="font-semibold">
                  {account.name} · <span className="tabular-nums text-gold-text">{account.phone}</span>
                </span>
                <span className="text-[11.5px] text-dim">{account.hint}</span>
              </span>
              <span className="label-caps shrink-0 text-[10px] text-muted">{account.role}</span>
            </li>
          ))}
          <li className="text-[11.5px] text-dim">
            Mot de passe commun : <span className="text-gold-text">{password}</span>
          </li>
        </ul>
      ) : null}
    </div>
  );
}
