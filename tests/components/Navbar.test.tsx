import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Navbar from '@/components/layout/Navbar';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
}));

vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}));

describe('Navbar', () => {
  it('affiche le logo "Prana Motion Yoga"', () => {
    render(<Navbar />);
    expect(screen.getByText('Prana Motion Yoga')).toBeInTheDocument();
  });

  it('affiche les liens de navigation publics', () => {
    render(<Navbar />);
    expect(screen.getAllByText('Cours').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Formations').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Tarifs').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('À propos').length).toBeGreaterThanOrEqual(1);
  });

  it('affiche "Se connecter" et "Commencer" quand pas de user', () => {
    render(<Navbar />);
    expect(screen.getAllByText('Se connecter').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Commencer').length).toBeGreaterThanOrEqual(1);
  });

  it('affiche "Mon espace" quand user connecté', () => {
    render(<Navbar user={{ name: 'John', email: 'john@test.com', role: 'USER' }} />);
    expect(screen.getAllByText('Mon espace').length).toBeGreaterThanOrEqual(1);
  });

  it('n\'affiche pas le bouton Admin pour un USER', () => {
    render(<Navbar user={{ name: 'John', email: 'john@test.com', role: 'USER' }} />);
    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
  });

  it('affiche le bouton Admin pour un ADMIN', () => {
    render(<Navbar user={{ name: 'Admin', email: 'admin@test.com', role: 'ADMIN' }} />);
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('ne montre pas "Se connecter" quand user connecté', () => {
    render(<Navbar user={{ name: 'John', email: 'john@test.com', role: 'USER' }} />);
    expect(screen.queryByText('Se connecter')).not.toBeInTheDocument();
  });
});
