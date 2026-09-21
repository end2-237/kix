import type { Config } from "drizzle-kit";
import { loadEnv } from "./db/env";

loadEnv();

export default {
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  schemaFilter: ["mb"],
  dbCredentials: { url: process.env.DATABASE_URL ?? "postgres://postgres@127.0.0.1:5433/masterbreak" },
} satisfies Config;
