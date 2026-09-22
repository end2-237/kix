"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";

/**
 * Le champ image des fiches.
 *
 * On y tapait un chemin vers `public/img` : ajouter une salle supposait donc
 * un déploiement, et tout le monde finissait par réutiliser les six mêmes
 * photos livrées avec le code. On téléverse maintenant, et c'est l'adresse
 * déposée qui part en base — le champ texte reste dessous, parce qu'une URL
 * déjà connue doit pouvoir être collée sans détour.
 */
export function ImageField({
  label = "Image",
  name,
  defaultValue,
  dossier,
  className,
}: {
  label?: string;
  name: string;
  defaultValue?: string | null;
  /** Range les dépôts par famille : salles, produits, cours… */
  dossier: string;
  className?: string;
}) {
  const champ = useId();
  const fichier = useRef<HTMLInputElement>(null);
  const [valeur, setValeur] = useState(defaultValue ?? "");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string>();

  async function deposer(f: File) {
    setErreur(undefined);
    setEnvoi(true);
    try {
      const corps = new FormData();
      corps.set("fichier", f);
      corps.set("dossier", dossier);
      const res = await fetch("/api/upload", { method: "POST", body: corps });
      const lu = (await res.json()) as { ok: boolean; url?: string; error?: string };
      if (!lu.ok || !lu.url) {
        setErreur(lu.error ?? "Dépôt impossible.");
        return;
      }
      setValeur(lu.url);
    } catch {
      setErreur("Le serveur n'a pas répondu. Réessaie.");
    } finally {
      setEnvoi(false);
      // Sans ceci, renvoyer deux fois le même fichier ne déclenche rien :
      // la valeur de l'input n'aurait pas changé.
      if (fichier.current) fichier.current.value = "";
    }
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-[11px] tracking-[0.1em] text-muted uppercase">{label}</span>

      <div className="flex items-start gap-3">
        <label
          htmlFor={champ}
          className={cn(
            "press relative grid h-20 w-20 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-card border border-line bg-surface text-center transition hover:border-gold/50",
            envoi && "pointer-events-none",
          )}
        >
          {valeur ? (
            <Image src={valeur} alt="" fill sizes="80px" className="object-cover" unoptimized />
          ) : (
            <span className="px-1 text-[10px] leading-tight text-muted">Choisir une image</span>
          )}

          {envoi ? (
            <span className="absolute inset-0 grid place-items-center bg-bg/75">
              <Spinner size={18} className="text-gold-text" />
            </span>
          ) : null}
        </label>

        <input
          ref={fichier}
          id={champ}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void deposer(f);
          }}
        />

        <div className="flex min-w-0 grow flex-col gap-1.5">
          {/* C'est ce champ que le formulaire envoie : le téléversement ne
              fait que le remplir. Une URL déjà connue se colle donc ici. */}
          <input
            name={name}
            value={valeur}
            onChange={(e) => setValeur(e.target.value)}
            placeholder="/img/hall-dark.jpg ou une adresse complète"
            className="h-11 rounded-none border border-line bg-surface px-3 text-[12.5px] text-ink outline-none focus:border-gold"
          />
          <span className="text-[11px] text-muted">
            {envoi ? "Envoi en cours…" : "JPEG, PNG, WebP, AVIF ou GIF — 5 Mo maximum."}
          </span>
          {erreur ? <span className="text-[11.5px] text-warn">{erreur}</span> : null}
        </div>
      </div>
    </div>
  );
}
