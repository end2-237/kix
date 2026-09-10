export async function register() {
  // Le runtime Edge n'a ni système de fichiers ni SQLite : rien à préparer.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { bootstrapDatabase } = await import("./db/bootstrap");
  await bootstrapDatabase();
}
