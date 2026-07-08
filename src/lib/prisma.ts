import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

const prismaBase =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaBase

const READ_OPS = [
  'findUnique',
  'findFirst',
  'findMany',
  'count',
  'aggregate',
  'groupBy',
  'findFirstOrThrow',
  'findUniqueOrThrow',
] as const

const WRITE_OPS = [
  'create',
  'createMany',
  'update',
  'updateMany',
  'delete',
  'deleteMany',
  'upsert',
] as const

function readFallback(op: string): unknown {
  switch (op) {
    case 'findUnique':
    case 'findFirst':
    case 'findFirstOrThrow':
    case 'findUniqueOrThrow':
      return null
    case 'findMany':
    case 'groupBy':
      return []
    case 'count':
      return 0
    case 'aggregate':
      return {}
    default:
      return null
  }
}

function buildInterceptor(op: string) {
  return ({ args, query }: { args: unknown; query: (args: unknown) => Promise<unknown> }) =>
    query(args).catch((e: unknown) => {
      const msg = (e as Error)?.message || String(e)
      console.error(`[DB] ${op} failed: ${msg}`)
      if ((READ_OPS as readonly string[]).includes(op)) return readFallback(op)
      throw e
    })
}

const ALL_OPS = [...READ_OPS, ...WRITE_OPS]
const interceptors: Record<string, ReturnType<typeof buildInterceptor>> = {}
for (const op of ALL_OPS) interceptors[op] = buildInterceptor(op)

const origQueryRaw = prismaBase.$queryRaw.bind(prismaBase)
const origExecuteRaw = prismaBase.$executeRaw.bind(prismaBase)

const _extended = prismaBase.$extends({
  query: {
    $allModels: interceptors,
  },
  client: {
    $queryRaw<T = unknown>(...args: unknown[]) {
      return (origQueryRaw as Function)(...args).catch((e: unknown) => {
        console.error(`[DB] $queryRaw failed: ${(e as Error)?.message || e}`)
        return [] as unknown as Promise<T>
      })
    },
    $executeRaw(...args: unknown[]) {
      return (origExecuteRaw as Function)(...args).catch((e: unknown) => {
        console.error(`[DB] $executeRaw failed: ${(e as Error)?.message || e}`)
        return 0
      })
    },
  },
})

const prisma = _extended as unknown as typeof prismaBase

export { prismaBase as prismaRaw };
export default prisma;
