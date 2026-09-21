"use client";

/**
 * Dernier filet : une erreur survenue dans le layout racine remplace tout le
 * document, styles compris. Il n'y a donc ni police ni jeton de couleur à cet
 * endroit — d'où les styles en dur.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "18px",
          padding: "24px",
          background: "#071a13",
          color: "#f5f1e6",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          textAlign: "center",
        }}
      >
        <span style={{ letterSpacing: "0.22em", fontSize: "13px", color: "#e8c86a" }}>MASTER BREAK</span>
        <h1 style={{ fontSize: "24px", margin: 0 }}>La page n&apos;a pas pu se charger</h1>
        <p style={{ fontSize: "14px", lineHeight: 1.6, color: "#93998d", maxWidth: "26rem", margin: 0 }}>
          Le serveur a rencontré une erreur. Réessaie dans un instant.
        </p>
        <button
          onClick={reset}
          style={{
            height: "48px",
            padding: "0 24px",
            borderRadius: "999px",
            border: "none",
            background: "#d9b450",
            color: "#17120a",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Réessayer
        </button>
        {error.digest ? (
          <p style={{ fontSize: "11px", color: "#6b7268", margin: 0 }}>
            Référence : <code>{error.digest}</code>
          </p>
        ) : null}
      </body>
    </html>
  );
}
