"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { CheckIcon } from "@/components/icons";
import { cn } from "@/lib/cn";

type Snack = { id: number; message: string; detail?: string; tone: "green" | "violet" | "amber" };

type SnackbarApi = {
  /** Affiche un message court en bas de l'écran (2,6 s). */
  notify: (message: string, options?: { detail?: string; tone?: Snack["tone"] }) => void;
};

const SnackbarContext = createContext<SnackbarApi | null>(null);

export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const [snacks, setSnacks] = useState<Snack[]>([]);
  const seq = useRef(0);

  const notify = useCallback<SnackbarApi["notify"]>((message, options) => {
    const id = ++seq.current;
    setSnacks((list) => [...list, { id, message, detail: options?.detail, tone: options?.tone ?? "green" }]);
    window.setTimeout(() => setSnacks((list) => list.filter((s) => s.id !== id)), 2600);
  }, []);

  const api = useMemo(() => ({ notify }), [notify]);

  return (
    <SnackbarContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-[430px] flex-col gap-2 px-5 pb-40 sm:max-w-[520px] sm:pb-6"
      >
        {snacks.map((snack) => (
          <div
            key={snack.id}
            className={cn(
              "snackbar-in glass-strong flex items-center gap-3 rounded-full py-2.5 pr-5 pl-2.5 shadow-[var(--kix-shadow)]",
              snack.tone === "green" && "border-green/45",
              snack.tone === "violet" && "border-violet/45",
              snack.tone === "amber" && "border-amber/45",
            )}
          >
            <span
              className={cn(
                "grid h-8 w-8 shrink-0 place-items-center rounded-full",
                snack.tone === "green" && "bg-green text-green-ink",
                snack.tone === "violet" && "bg-violet text-white",
                snack.tone === "amber" && "bg-amber text-green-ink",
              )}
            >
              <CheckIcon size={16} />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-[13px] font-medium">{snack.message}</span>
              {snack.detail ? <span className="truncate text-[11px] text-muted">{snack.detail}</span> : null}
            </span>
          </div>
        ))}
      </div>
    </SnackbarContext.Provider>
  );
}

export function useSnackbar(): SnackbarApi {
  const ctx = useContext(SnackbarContext);
  if (!ctx) throw new Error("useSnackbar doit être utilisé dans <SnackbarProvider>");
  return ctx;
}
