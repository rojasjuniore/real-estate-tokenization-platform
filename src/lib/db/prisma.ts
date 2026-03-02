import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Converts BigInt and Decimal values to Numbers in an object for JSON serialization.
 * BigInt cannot be serialized to JSON directly, so we convert to Number.
 * Prisma Decimal objects are also converted to numbers.
 * Note: This may lose precision for values > Number.MAX_SAFE_INTEGER
 */
export function serializeBigInt<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return Number(obj) as unknown as T;

  // Handle Prisma Decimal type (has toNumber method)
  if (typeof obj === 'object' && obj !== null && 'toNumber' in obj && typeof (obj as { toNumber: () => number }).toNumber === 'function') {
    return (obj as { toNumber: () => number }).toNumber() as unknown as T;
  }

  // Handle Date objects - keep as is
  if (obj instanceof Date) return obj;

  if (Array.isArray(obj)) return obj.map(serializeBigInt) as unknown as T;

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeBigInt(value);
    }
    return result as T;
  }
  return obj;
}

export default prisma;
