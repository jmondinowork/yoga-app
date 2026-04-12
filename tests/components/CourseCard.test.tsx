import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CourseCard from '@/components/courses/CourseCard';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

const baseProps = {
  slug: 'yoga-doux',
  title: 'Yoga doux pour le matin',
  thumbnail: null,
  duration: 30,
  theme: 'Hatha',
};

describe('CourseCard', () => {
  it('affiche le titre et le thème', () => {
    render(<CourseCard {...baseProps} />);
    expect(screen.getByText('Yoga doux pour le matin')).toBeInTheDocument();
    expect(screen.getByText('Hatha')).toBeInTheDocument();
  });

  it('affiche la durée', () => {
    render(<CourseCard {...baseProps} />);
    expect(screen.getByText('30 min')).toBeInTheDocument();
  });

  it('lien pointe vers /cours/{slug}', () => {
    render(<CourseCard {...baseProps} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/cours/yoga-doux');
  });

  it('affiche la barre de progression si progress > 0', () => {
    render(<CourseCard {...baseProps} progress={75} />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('n\'affiche pas la barre de progression si progress = 0', () => {
    render(<CourseCard {...baseProps} progress={0} />);
    expect(screen.queryByText('0%')).not.toBeInTheDocument();
  });

  it('affiche l\'icône de verrouillage si isLocked', () => {
    const { container } = render(<CourseCard {...baseProps} isLocked={true} />);
    // L'overlay Lock est affiché
    expect(container.querySelector('.backdrop-blur-\\[2px\\]')).toBeTruthy();
  });

  it('affiche la miniature quand fournie', () => {
    render(<CourseCard {...baseProps} thumbnail="https://example.com/img.jpg" />);
    const img = screen.getByAltText('Yoga doux pour le matin');
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toContain('example.com');
  });
});
