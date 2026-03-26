import { describe, it, expect, beforeEach } from 'vitest';
import { prismaMock, resetPrismaMock } from '../mocks/prisma';
import { canAccessCourse, canAccessFormation, hasActiveSubscription } from '@/lib/helpers/access';

describe('canAccessCourse', () => {
  beforeEach(() => resetPrismaMock());

  it('retourne false si le cours n\'existe pas', async () => {
    prismaMock.course.findUnique.mockResolvedValue(null);
    expect(await canAccessCourse('user-1', 'nonexistent')).toBe(false);
  });

  it('retourne false si pas d\'userId', async () => {
    prismaMock.course.findUnique.mockResolvedValue({ includedInSubscription: true });
    expect(await canAccessCourse(undefined, 'course-1')).toBe(false);
  });

  it('retourne true si le cours est dans l\'abo et l\'utilisateur a un abo actif', async () => {
    prismaMock.course.findUnique.mockResolvedValue({ includedInSubscription: true });
    prismaMock.subscription.findUnique.mockResolvedValue({ status: 'ACTIVE' });
    expect(await canAccessCourse('user-1', 'course-1')).toBe(true);
  });

  it('retourne false si le cours est dans l\'abo mais l\'abo est annulé', async () => {
    prismaMock.course.findUnique.mockResolvedValue({ includedInSubscription: true });
    prismaMock.subscription.findUnique.mockResolvedValue({ status: 'CANCELED' });
    prismaMock.purchase.findFirst.mockResolvedValue(null);
    expect(await canAccessCourse('user-1', 'course-1')).toBe(false);
  });

  it('retourne true si l\'utilisateur a acheté le cours directement', async () => {
    prismaMock.course.findUnique.mockResolvedValue({ includedInSubscription: false });
    prismaMock.purchase.findFirst.mockResolvedValue({ id: 'purchase-1' });
    expect(await canAccessCourse('user-1', 'course-1')).toBe(true);
  });

  it('retourne false si le cours n\'est pas dans l\'abo et pas acheté', async () => {
    prismaMock.course.findUnique.mockResolvedValue({ includedInSubscription: false });
    prismaMock.purchase.findFirst.mockResolvedValue(null);
    expect(await canAccessCourse('user-1', 'course-1')).toBe(false);
  });

  it('retourne true si le cours est dans l\'abo + acheté + abo actif (doublon)', async () => {
    prismaMock.course.findUnique.mockResolvedValue({ includedInSubscription: true });
    prismaMock.subscription.findUnique.mockResolvedValue({ status: 'ACTIVE' });
    expect(await canAccessCourse('user-1', 'course-1')).toBe(true);
    // Vérifie qu'il n'y a pas eu de vérification purchase inutile
    expect(prismaMock.purchase.findFirst).not.toHaveBeenCalled();
  });
});

describe('canAccessFormation', () => {
  beforeEach(() => resetPrismaMock());

  it('retourne false sans userId', async () => {
    expect(await canAccessFormation(undefined, 'formation-1')).toBe(false);
  });

  it('retourne true si l\'utilisateur a acheté la formation', async () => {
    prismaMock.purchase.findFirst.mockResolvedValue({ id: 'purchase-1' });
    expect(await canAccessFormation('user-1', 'formation-1')).toBe(true);
  });

  it('retourne false si l\'utilisateur n\'a pas acheté la formation', async () => {
    prismaMock.purchase.findFirst.mockResolvedValue(null);
    expect(await canAccessFormation('user-1', 'formation-1')).toBe(false);
  });
});

describe('hasActiveSubscription', () => {
  beforeEach(() => resetPrismaMock());

  it('retourne true si l\'abo est actif', async () => {
    prismaMock.subscription.findUnique.mockResolvedValue({ status: 'ACTIVE' });
    expect(await hasActiveSubscription('user-1')).toBe(true);
  });

  it('retourne false si l\'abo est annulé', async () => {
    prismaMock.subscription.findUnique.mockResolvedValue({ status: 'CANCELED' });
    expect(await hasActiveSubscription('user-1')).toBe(false);
  });

  it('retourne false si pas d\'abo', async () => {
    prismaMock.subscription.findUnique.mockResolvedValue(null);
    expect(await hasActiveSubscription('user-1')).toBe(false);
  });

  it('retourne false si l\'abo est PAST_DUE', async () => {
    prismaMock.subscription.findUnique.mockResolvedValue({ status: 'PAST_DUE' });
    expect(await hasActiveSubscription('user-1')).toBe(false);
  });
});
