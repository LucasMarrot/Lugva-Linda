import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

// 1. On configure le pool de connexion avec ton lien Supabase
const connectionString = `${process.env.DATABASE_URL}`
const pool = new Pool({ connectionString })

// 2. On crée l'adaptateur Prisma
const adapter = new PrismaPg(pool)

// 3. On injecte l'adaptateur dans le client (c'est la règle stricte de Prisma 7)
const prismaClientSingleton = () => {
  return new PrismaClient({ adapter })
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>
} & typeof global

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
