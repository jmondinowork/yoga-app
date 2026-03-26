import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PurchaseButton from '@/components/courses/PurchaseButton';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock window.location
const mockLocation = { href: '' };
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('PurchaseButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = 'http://localhost:3000/cours/yoga';
    global.fetch = vi.fn();
  });

  it('affiche le texte enfant', () => {
    render(
      <PurchaseButton type="course" itemId="c-1">
        Acheter
      </PurchaseButton>
    );
    expect(screen.getByText('Acheter')).toBeInTheDocument();
  });

  it('redirige vers /connexion si 401', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Non connecté' }),
    });

    render(
      <PurchaseButton type="course" itemId="c-1">
        Acheter
      </PurchaseButton>
    );

    fireEvent.click(screen.getByText('Acheter'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('/connexion')
      );
    });
  });

  it('affiche une erreur si la requête échoue', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Déjà acheté' }),
    });

    render(
      <PurchaseButton type="course" itemId="c-1">
        Acheter
      </PurchaseButton>
    );

    fireEvent.click(screen.getByText('Acheter'));

    await waitFor(() => {
      expect(screen.getByText('Déjà acheté')).toBeInTheDocument();
    });
  });

  it('redirige vers l\'URL de succès', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ url: 'http://localhost:3000/cours/yoga?success=true' }),
    });

    render(
      <PurchaseButton type="course" itemId="c-1">
        Acheter
      </PurchaseButton>
    );

    fireEvent.click(screen.getByText('Acheter'));

    await waitFor(() => {
      expect(mockLocation.href).toBe('http://localhost:3000/cours/yoga?success=true');
    });
  });

  it('envoie le bon payload pour un abonnement', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ url: '/success' }),
    });

    render(
      <PurchaseButton type="subscription" planId="monthly">
        S&apos;abonner
      </PurchaseButton>
    );

    fireEvent.click(screen.getByText("S'abonner"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/stripe/checkout',
        expect.objectContaining({
          body: JSON.stringify({ type: 'subscription', planId: 'monthly' }),
        })
      );
    });
  });

  it('envoie le bon payload pour un cours', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ url: '/success' }),
    });

    render(
      <PurchaseButton type="course" itemId="c-1">
        Acheter
      </PurchaseButton>
    );

    fireEvent.click(screen.getByText('Acheter'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/stripe/checkout',
        expect.objectContaining({
          body: JSON.stringify({ type: 'course', courseId: 'c-1' }),
        })
      );
    });
  });
});
