import { PrismaClient } from "@prisma/client";

const withPoolerSafeParams = (databaseUrl?: string): string | undefined => {
  if (!databaseUrl) return databaseUrl;
  try {
    const url = new URL(databaseUrl);
    const isPooler =
      url.hostname.includes("pooler.supabase.com") || String(url.port) === "6543";
    if (!isPooler) return databaseUrl;

    if (!url.searchParams.has("pgbouncer")) url.searchParams.set("pgbouncer", "true");
    if (!url.searchParams.has("statement_cache_size")) {
      url.searchParams.set("statement_cache_size", "0");
    }
    if (!url.searchParams.has("sslmode")) url.searchParams.set("sslmode", "require");

    return url.toString();
  } catch {
    return databaseUrl;
  }
};

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: withPoolerSafeParams(process.env.DATABASE_URL),
    },
  },
});

export default prisma;
