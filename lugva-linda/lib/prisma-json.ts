import { Prisma } from '@prisma/client';

export const toNullableJsonInput = <T>(
  value: T | null | undefined,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput => {
  if (value === null || value === undefined) {
    return Prisma.DbNull;
  }

  return value as Prisma.InputJsonValue;
};
