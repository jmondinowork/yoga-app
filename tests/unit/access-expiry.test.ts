import { describe, it, expect, beforeEach } from 'vitest';
import { prismaMock, resetPrismaMock } from '../mocks/prisma';

import '../mocks/prisma';

import { getCourseRentalExpiry } from '@/lib/helpers/access';

describe('getCourseRentalExpiry', () => {
  beforeEach(() => resetPrismaMock());

  it('retourne la date d\'expiration si location existe', async () => {
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
    prismaMock.purchase.findFirst.mockResolvedValue({ expiresAt });

    const result = await getCourseRentalExpiry('user-1', 'course-1');
    expect(result).toEqual(expiresAt);
  });

  it('retourne null si aucun achat', async () => {
    prismaMock.purchase.findFirst.mockResolvedValue(null);

    const result = await getCourseRentalExpiry('user-1', 'course-1');
    expect(result).toBeNull();
  });

  it('retourne null si achat sans expiresAt (ancien achat)', async () => {
    prismaMock.purchase.findFirst.mockResolvedValue({ expiresAt: null });

    const result = await getCourseRentalExpiry('user-1', 'course-1');
    expect(result).toBeNull();
  });

  it('retourne la location la plus récente', async () => {
    const expiresAt = new Date(Date.now() + 10000);
    prismaMock.purchase.findFirst.mockResolvedValue({ expiresAt });

    await getCourseRentalExpiry('user-1', 'course-1');

    expect(prismaMock.purchase.findFirst).toHaveBeenCalledWith({
      where: { userId: 'user-1', courseId: 'course-1' },
      orderBy: { createdAt: 'desc' },
      select: { expiresAt: true },
    });
  });
});
