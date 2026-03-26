import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FormationCard from '@/components/courses/FormationCard';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

const baseProps = {
  slug: 'yoga-prenatal',
  title: 'Yoga Prénatal',
  description: 'Une formation complète pour les futures mamans.',
  thumbnail: null,
  price: 49.99,
  videoCount: 12,
  totalDuration: 180,
};

describe('FormationCard', () => {
  it('affiche le titre et la description', () => {
    render(<FormationCard {...baseProps} />);
    expect(screen.getByText('Yoga Prénatal')).toBeInTheDocument();
    expect(screen.getByText('Une formation complète pour les futures mamans.')).toBeInTheDocument();
  });

  it('lien pointe vers /formations/{slug}', () => {
    render(<FormationCard {...baseProps} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/formations/yoga-prenatal');
  });

  it('affiche le prix', () => {
    render(<FormationCard {...baseProps} />);
    expect(screen.getByText('49.99 €')).toBeInTheDocument();
  });

  it('n\'affiche pas de badge prix si null', () => {
    render(<FormationCard {...baseProps} price={null} />);
    expect(screen.queryByText('€')).not.toBeInTheDocument();
  });

  it('affiche le nombre de vidéos (pluriel)', () => {
    render(<FormationCard {...baseProps} />);
    expect(screen.getByText('12 vidéos')).toBeInTheDocument();
  });

  it('affiche "vidéo" au singulier pour 1 vidéo', () => {
    render(<FormationCard {...baseProps} videoCount={1} />);
    expect(screen.getByText('1 vidéo')).toBeInTheDocument();
  });

  it('affiche la durée en heures', () => {
    render(<FormationCard {...baseProps} />);
    expect(screen.getByText('3h')).toBeInTheDocument();
  });

  it('affiche la durée avec minutes', () => {
    render(<FormationCard {...baseProps} totalDuration={95} />);
    expect(screen.getByText('1h35')).toBeInTheDocument();
  });

  it('affiche la durée en minutes si < 60', () => {
    render(<FormationCard {...baseProps} totalDuration={45} />);
    expect(screen.getByText('45min')).toBeInTheDocument();
  });

  it('affiche "Livret PDF" si hasBooklet', () => {
    render(<FormationCard {...baseProps} hasBooklet={true} />);
    expect(screen.getByText('Livret PDF')).toBeInTheDocument();
  });

  it('n\'affiche pas "Livret PDF" par défaut', () => {
    render(<FormationCard {...baseProps} />);
    expect(screen.queryByText('Livret PDF')).not.toBeInTheDocument();
  });
});
