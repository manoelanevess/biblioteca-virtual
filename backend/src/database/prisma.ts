import { PrismaPg } from '@prisma/adapter-pg'

import { env } from '../config/env.js'
import { PrismaClient } from '../generated/prisma/client.js'

const globalPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient
}

function criarClientePrisma() {
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL })

  return new PrismaClient({ adapter })
}

export const prisma = globalPrisma.prisma ?? criarClientePrisma()

if (env.NODE_ENV !== 'production') {
  globalPrisma.prisma = prisma
}
