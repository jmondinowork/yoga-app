import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FilterBar from '@/components/courses/FilterBar';

describe('FilterBar', () => {
  const themes = ['Hatha', 'Vinyasa', 'Yin', 'Ashtanga'];
  const onFilterChange = vi.fn();

  it('affiche la barre de recherche', () => {
    render(<FilterBar themes={themes} onFilterChange={onFilterChange} />);
    expect(screen.getByPlaceholderText('Rechercher un cours...')).toBeInTheDocument();
  });

  it('appelle onFilterChange quand la recherche change', () => {
    render(<FilterBar themes={themes} onFilterChange={onFilterChange} />);
    const input = screen.getByPlaceholderText('Rechercher un cours...');
    fireEvent.change(input, { target: { value: 'yoga' } });

    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'yoga' })
    );
  });

  it('affiche le bouton Filtres', () => {
    render(<FilterBar themes={themes} onFilterChange={onFilterChange} />);
    expect(screen.getByText('Filtres')).toBeInTheDocument();
  });

  it('affiche les filtres déroulants quand on clique Filtres', () => {
    render(<FilterBar themes={themes} onFilterChange={onFilterChange} />);
    fireEvent.click(screen.getByText('Filtres'));

    expect(screen.getByText('Thème')).toBeInTheDocument();
    expect(screen.getByText('Niveau')).toBeInTheDocument();
    expect(screen.getByText('Durée')).toBeInTheDocument();
  });

  it('affiche les thèmes dans le select', () => {
    render(<FilterBar themes={themes} onFilterChange={onFilterChange} />);
    fireEvent.click(screen.getByText('Filtres'));

    themes.forEach((t) => {
      expect(screen.getByText(t)).toBeInTheDocument();
    });
  });

  it('affiche les niveaux dans le select', () => {
    render(<FilterBar themes={themes} onFilterChange={onFilterChange} />);
    fireEvent.click(screen.getByText('Filtres'));

    expect(screen.getByText('Tous les niveaux')).toBeInTheDocument();
    expect(screen.getByText('Débutant')).toBeInTheDocument();
    expect(screen.getByText('Intermédiaire')).toBeInTheDocument();
    expect(screen.getByText('Avancé')).toBeInTheDocument();
  });

  it('appelle onFilterChange quand on sélectionne un thème', () => {
    render(<FilterBar themes={themes} onFilterChange={onFilterChange} />);
    fireEvent.click(screen.getByText('Filtres'));

    const select = screen.getByText('Tous les thèmes').closest('select')!;
    fireEvent.change(select, { target: { value: 'Vinyasa' } });

    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ theme: 'Vinyasa' })
    );
  });

  it('affiche le bouton "Effacer les filtres" si un filtre est actif', () => {
    render(<FilterBar themes={themes} onFilterChange={onFilterChange} />);
    fireEvent.click(screen.getByText('Filtres'));

    const select = screen.getByText('Tous les thèmes').closest('select')!;
    fireEvent.change(select, { target: { value: 'Hatha' } });

    expect(screen.getByText('Effacer les filtres')).toBeInTheDocument();
  });

  it('efface tous les filtres quand on clique "Effacer les filtres"', () => {
    render(<FilterBar themes={themes} onFilterChange={onFilterChange} />);
    fireEvent.click(screen.getByText('Filtres'));

    // Sélectionner un thème d'abord
    const select = screen.getByText('Tous les thèmes').closest('select')!;
    fireEvent.change(select, { target: { value: 'Hatha' } });

    // Effacer
    fireEvent.click(screen.getByText('Effacer les filtres'));

    expect(onFilterChange).toHaveBeenLastCalledWith({
      search: '',
      theme: '',
      level: '',
      duration: '',
    });
  });
});
