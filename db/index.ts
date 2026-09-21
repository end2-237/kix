import "server-only";
import { createDb, type Db } from "./client";
import * as schema from "./schema";

// Un seul pool par process : le rechargement à chaud en ouvrirait un par
// compilation.
const globalForDb = globalThis as unknown as { mbDb?: Db };

export const db: Db = globalForDb.mbDb ?? createDb();
if (process.env.NODE_ENV !== "production") globalForDb.mbDb = db;

export { schema };
export * from "./schema";
