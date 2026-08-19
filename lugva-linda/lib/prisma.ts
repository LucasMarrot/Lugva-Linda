import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '@/lib/env';

// Pool de connexion Supabase — limité à 5 connexions simultanées pour éviter
// les erreurs "too many connections" sur les plans Supabase (max 60 global).
// Les timeouts permettent de libérer rapidement les connexions inactives.
const connectionString = env.DATABASE_URL;
const pool = new Pool({
  connectionString,
  max: 5,                      // Max connexions simultanées par instance
  idleTimeoutMillis: 10_000,   // Fermer les connexions inactives après 10s
  connectionTimeoutMillis: 5_000, // Timeout si toutes les connexions sont occupées
});

// Adaptateur Prisma 7 (obligatoire avec @prisma/adapter-pg)
const adapter = new PrismaPg(pool);

const prismaClientSingleton = () => {
  return new PrismaClient({ adapter });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
