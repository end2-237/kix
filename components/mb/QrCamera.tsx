"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Spinner } from "@/components/ui/Spinner";

/**
 * L'état de la caméra, tel qu'on peut l'annoncer sans mentir.
 *
 * L'ancienne console affichait « Caméra active » au-dessus d'une photo de
 * table : au comptoir, on ne pouvait pas distinguer un scanner qui marche d'un
 * scanner mort. Chaque cas a maintenant son mot.
 */
export type CameraState = "demarrage" | "active" | "refusee" | "absente" | "insecure" | "eteinte";

export const CAMERA_LABEL: Record<CameraState, string> = {
  demarrage: "démarrage…",
  active: "caméra active",
  refusee: "caméra refusée",
  absente: "pas de caméra",
  insecure: "HTTPS requis",
  eteinte: "caméra éteinte",
};

/** Le détecteur natif de Chrome/Android : rien à télécharger, et c'est le plus rapide. */
type NativeDetector = { detect(source: CanvasImageSource): Promise<{ rawValue: string }[]> };
type DetectorCtor = {
  new (options: { formats: string[] }): NativeDetector;
  getSupportedFormats?(): Promise<string[]>;
};

async function ouvrirDetecteur(): Promise<(canvas: HTMLCanvasElement) => Promise<string | null>> {
  const ctor = (window as unknown as { BarcodeDetector?: DetectorCtor }).BarcodeDetector;
  if (ctor) {
    const formats = (await ctor.getSupportedFormats?.()) ?? ["qr_code"];
    if (formats.includes("qr_code")) {
      const natif = new ctor({ formats: ["qr_code"] });
      return async (canvas) => (await natif.detect(canvas))[0]?.rawValue ?? null;
    }
  }

  // Safari et Firefox n'ont pas le détecteur natif : on charge le décodeur JS
  // à ce moment-là seulement, pour ne pas le mettre dans le paquet de tout le
  // monde.
  const { default: jsQR } = await import("jsqr");
  return async (canvas) => {
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    const { width, height } = canvas;
    const image = ctx.getImageData(0, 0, width, height);
    return jsQR(image.data, width, height, { inversionAttempts: "dontInvert" })?.data ?? null;
  };
}

/**
 * Aperçu caméra qui lit réellement les QR.
 *
 * `onCode` peut être appelé plusieurs fois pour un même QR resté devant
 * l'objectif : on ne relaie donc une valeur qu'une fois par période de repos,
 * sans quoi un client débiterait plusieurs jetons en tendant son téléphone.
 *
 * `paused` suspend le relais sans couper le flux. Éteindre la caméra entre
 * deux scans rallumerait la diode à chaque client et ferait attendre une
 * seconde à chaque fois.
 */
export function QrCamera({
  onCode,
  paused = false,
  onState,
}: {
  onCode: (value: string) => void;
  paused?: boolean;
  onState?: (state: CameraState) => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const dernier = useRef<{ valeur: string; quand: number }>({ valeur: "", quand: 0 });
  const [state, setState] = useState<CameraState>("demarrage");

  // `onCode` change à chaque rendu du parent : le garder dans une référence
  // évite de rouvrir la caméra (et de rallumer la diode) à chaque frappe.
  const rappel = useRef(onCode);
  const rappelEtat = useRef(onState);
  const suspendu = useRef(paused);

  useEffect(() => {
    rappel.current = onCode;
    rappelEtat.current = onState;
    suspendu.current = paused;
  });

  // Poser l'état depuis un effet, synchronement, déclencherait une cascade de
  // rendus : on le renvoie au microtask suivant, avant le même affichage.
  const vivant = useRef(true);
  const poser = useCallback((valeur: CameraState) => {
    queueMicrotask(() => {
      if (!vivant.current) return;
      setState(valeur);
      rappelEtat.current?.(valeur);
    });
  }, []);

  useEffect(() => {
    vivant.current = true;
    return () => {
      vivant.current = false;
    };
  }, []);

  useEffect(() => {
    // `getUserMedia` n'existe pas hors contexte sécurisé : le dire tout de
    // suite vaut mieux qu'un échec silencieux derrière un cadre doré.
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      poser(window.isSecureContext ? "absente" : "insecure");
      return;
    }

    let ouvert = true;
    let flux: MediaStream | undefined;
    let image = 0;
    const node = video.current;

    (async () => {
      try {
        flux = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      } catch (error) {
        if (!ouvert) return;
        const nom = (error as { name?: string }).name;
        poser(nom === "NotAllowedError" || nom === "SecurityError" ? "refusee" : "absente");
        return;
      }

      if (!ouvert || !node) {
        flux.getTracks().forEach((t) => t.stop());
        return;
      }

      node.srcObject = flux;
      await node.play().catch(() => {});
      poser("active");

      const detecter = await ouvrirDetecteur();
      let occupe = false;
      let prochain = 0;

      const boucle = async (temps: number) => {
        image = requestAnimationFrame(boucle);
        // Décoder chaque image est inutile et chauffe le téléphone : cinq fois
        // par seconde suffit largement à attraper un QR qu'on tend.
        if (occupe || temps < prochain) return;
        prochain = temps + 200;

        const toile = canvas.current;
        if (!toile || node.readyState < 2 || node.videoWidth === 0) return;

        occupe = true;
        try {
          toile.width = node.videoWidth;
          toile.height = node.videoHeight;
          toile.getContext("2d", { willReadFrequently: true })?.drawImage(node, 0, 0);
          const valeur = await detecter(toile);
          if (!valeur || !ouvert || suspendu.current) return;

          const maintenant = Date.now();
          const memeQr = valeur === dernier.current.valeur && maintenant - dernier.current.quand < 3000;
          if (memeQr) return;
          dernier.current = { valeur, quand: maintenant };
          rappel.current(valeur);
        } catch {
          /* une image illisible n'est pas une panne : on prend la suivante */
        } finally {
          occupe = false;
        }
      };

      image = requestAnimationFrame(boucle);
    })();

    return () => {
      ouvert = false;
      cancelAnimationFrame(image);
      // Sans cet arrêt explicite, la diode du téléphone reste allumée après la
      // fermeture de la page — le gérant croit être filmé.
      flux?.getTracks().forEach((t) => t.stop());
      if (node) node.srcObject = null;
    };
  }, [poser]);

  return (
    <>
      <video
        ref={video}
        playsInline
        muted
        autoPlay
        aria-label="Aperçu de la caméra"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <canvas ref={canvas} className="hidden" />

      {state === "active" ? null : (
        <div className="absolute inset-0 grid place-items-center bg-bg-2/80 px-6 text-center">
          <div className="flex flex-col items-center gap-2.5">
            {state === "demarrage" ? <Spinner size={22} className="text-gold-text" /> : null}
            <p className="text-[13px] text-dim">
              {state === "demarrage" ? "Ouverture de la caméra…" : null}
              {state === "refusee" ? "Accès caméra refusé. Autorise-le dans le navigateur, puis recharge." : null}
              {state === "absente" ? "Aucune caméra utilisable sur cet appareil." : null}
              {state === "insecure" ? "Le scan exige une connexion HTTPS." : null}
              {state === "eteinte" ? "Caméra en pause." : null}
            </p>
            <p className="text-[12px] text-muted">Le code de secours à 4 chiffres marche toujours.</p>
          </div>
        </div>
      )}
    </>
  );
}
