import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';

describe('Badge', () => {
  it('affiche le contenu', () => {
    render(<Badge>Premium</Badge>);
    expect(screen.getByText('Premium')).toBeInTheDocument();
  });

  it('applique la variante par défaut', () => {
    const { container } = render(<Badge>Test</Badge>);
    expect(container.firstChild).toHaveClass('bg-primary/50');
  });

  it('applique la variante success', () => {
    const { container } = render(<Badge variant="success">OK</Badge>);
    expect(container.firstChild).toHaveClass('bg-green-100');
  });

  it('applique la variante premium', () => {
    const { container } = render(<Badge variant="premium">VIP</Badge>);
    expect(container.firstChild).toHaveClass('bg-button/10');
  });

  it('accepte des classes personnalisées', () => {
    const { container } = render(<Badge className="mt-2">Test</Badge>);
    expect(container.firstChild).toHaveClass('mt-2');
  });
});

describe('Button', () => {
  it('affiche le contenu', () => {
    render(<Button>Cliquer</Button>);
    expect(screen.getByText('Cliquer')).toBeInTheDocument();
  });

  it('est cliquable', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    screen.getByText('Click').click();
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('désactivé quand disabled', () => {
    render(<Button disabled>Click</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('désactivé quand loading', () => {
    render(<Button loading>Click</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('affiche le spinner quand loading', () => {
    const { container } = render(<Button loading>Click</Button>);
    expect(container.querySelector('.animate-spin')).toBeTruthy();
  });

  it('applique la variante primary par défaut', () => {
    render(<Button>Test</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-button');
  });

  it('applique la variante outline', () => {
    render(<Button variant="outline">Test</Button>);
    expect(screen.getByRole('button')).toHaveClass('border-button');
  });

  it('applique la taille sm', () => {
    render(<Button size="sm">Test</Button>);
    expect(screen.getByRole('button')).toHaveClass('py-1.5');
  });

  it('applique la taille lg', () => {
    render(<Button size="lg">Test</Button>);
    expect(screen.getByRole('button')).toHaveClass('py-3.5');
  });
});

describe('ProgressBar', () => {
  it('affiche le label quand demandé', () => {
    render(<ProgressBar value={50} showLabel />);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('n\'affiche pas le label par défaut', () => {
    render(<ProgressBar value={50} />);
    expect(screen.queryByText('50%')).not.toBeInTheDocument();
  });

  it('clamp la valeur à 0', () => {
    render(<ProgressBar value={-10} showLabel />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('clamp la valeur à 100', () => {
    render(<ProgressBar value={150} showLabel />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('applique la largeur correcte en style', () => {
    const { container } = render(<ProgressBar value={75} />);
    const bar = container.querySelector('[style]');
    expect(bar).toHaveStyle({ width: '75%' });
  });
});
