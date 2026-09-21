import { requireRole } from "@/lib/session";

/**
 * La garde vit dans le layout : elle s'exécute avant que le flux HTML ne
 * commence, donc le refus est une vraie redirection HTTP et non un saut côté
 * client une fois la page envoyée.
 */
export default async function GerantLayout({ children }: { children: React.ReactNode }) {
  await requireRole("manager", "admin");
  return children;
}
