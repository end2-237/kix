import "server-only";
import { createDb, type Db } from "./client";
import * as schema from "./schema";

// Un seul client par process : le rechargement à chaud en dev en ouvrirait un
// par compilation.
const globalForDb = globalThis as unknown as { kixDb?: Db };

export const db: Db = globalForDb.kixDb ?? createDb();
if (process.env.NODE_ENV !== "production") globalForDb.kixDb = db;

export { schema };
export * from "./schema";
