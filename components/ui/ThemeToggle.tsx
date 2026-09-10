"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";

type Theme = "dark" | "light";

/* Le thème vit sur <html data-theme>, écrit très tôt par le script inline du
   layout. Ce petit store le rend lisible par React sans flash au chargement. */
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = (): Theme => (document.documentElement.dataset.theme === "light" ? "light" : "dark");
const getServerSnapshot = (): Theme => "dark";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    window.localStorage.setItem("kix.theme", theme);
  } catch {
    // stockage indisponible : le thème reste valable pour la session
  }
  for (const listener of listeners) listener();
}

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <button
      onClick={() => applyTheme(theme === "light" ? "dark" : "light")}
      aria-label={theme === "light" ? "Passer en thème sombre" : "Passer en thème clair"}
      className={cn(
        "glass press group grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink transition hover:bg-surface-2 hover:text-green-text",
        className,
      )}
    >
      <span className="transition-transform duration-500 group-hover:rotate-45">
      {theme === "light" ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <path d="M20 14.5A8.2 8.2 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.6v2.2M12 19.2v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.6 12h2.2M19.2 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6" />
        </svg>
      )}
      </span>
    </button>
  );
}
