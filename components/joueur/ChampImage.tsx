"use client";

import { useRef, useState } from "react";
import { Photo } from "@/components/ui/Photo";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";

/**
 * La photo d'un groupe.
 *
 * Même chemin que le champ image des fiches — téléverser, ou coller une
 * adresse — mais sans l'habillage de l'administration : ici c'est un joueur
 * qui choisit la photo de sa bande sur son téléphone.
 */
export function ChampImage({ name, defaultValue = "" }: { name: string; defaultValue?: string }) {
  const fichier = useRef<HTMLInputElement>(null);
  const [valeur, setValeur] = useState(defaultValue);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string>();

  const apercu = valeur.startsWith("/") || /^https?:\/\/\S+$/i.test(valeur) ? valeur : "";

  async function deposer(f: File) {
    setErreur(undefined);
    setEnvoi(true);
    try {
      const corps = new FormData();
      corps.set("fichier", f);
      corps.set("dossier", "groupes");
      const res = await fetch("/api/upload", { method: "POST", body: corps });
      const lu = (await res.json()) as { ok: boolean; url?: string; error?: string };
      if (!lu.ok || !lu.url) setErreur(lu.error ?? "Dépôt impossible.");
      else setValeur(lu.url);
    } catch {
      setErreur("Le serveur n'a pas répondu.");
    } finally {
      setEnvoi(false);
      if (fichier.current) fichier.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="label-caps text-[10px]">Photo du groupe</span>
      <div className="flex items-start gap-3">
        <label
          className={cn(
            "press relative grid h-16 w-16 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-full border border-line bg-surface text-center",
            envoi && "pointer-events-none",
          )}
        >
          {apercu ? (
            <Photo key={apercu} src={apercu} alt="" fill sizes="64px" className="object-cover" />
          ) : (
            <span className="px-1 text-[9.5px] leading-tight text-muted">Photo</span>
          )}
          {envoi ? (
            <span className="absolute inset-0 grid place-items-center bg-bg/75">
              <Spinner size={16} className="text-gold-text" />
            </span>
          ) : null}
          <input
            ref={fichier}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void deposer(f);
            }}
          />
        </label>

        <div className="flex min-w-0 grow flex-col gap-1">
          <input
            name={name}
            value={valeur}
            onChange={(e) => setValeur(e.target.value)}
            placeholder="https://… ou touche le rond"
            spellCheck={false}
            className="h-11 rounded-full border border-line bg-surface px-4 text-[12.5px] text-ink placeholder:text-faint"
          />
          {erreur ? <span className="text-[11.5px] text-warn">{erreur}</span> : null}
        </div>
      </div>
    </div>
  );
}
