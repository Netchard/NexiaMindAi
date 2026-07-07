/**
 * Tests unitaires pour le composant FilterBar
 * Fait partie de ST-304 - Implémenter les Filtres de Recherche
 *
 * Contrat réel du composant (revue de code du 2026-07-07) : 2 filtres,
 * thème et format de document — pas de filtre client ni langage, pas de
 * prop `hideLanguageFilter`, pas de gestion d'erreur interne (le parent
 * src/app/chat/page.tsx gère l'état d'erreur en amont).
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { FilterBar } from '../FilterBar';
import { FilterState } from '@/types/filters';

const mockFilterOptions = {
  themes: [
    { value: 'Ged', label: 'Ged' },
    { value: 'Facture', label: 'Facture' },
  ],
  documentFormats: [
    { value: 'pdf', label: 'PDF' },
    { value: 'markdown', label: 'Markdown' },
  ],
};

const defaultFilterState: FilterState = {
  theme: '',
  documentFormat: '',
};

const defaultProps = {
  filterState: defaultFilterState,
  filterOptions: mockFilterOptions,
  onFilterChange: vi.fn(),
  onReset: vi.fn(),
  isLoading: false,
  className: '',
};

describe('FilterBar - Rendering et Structure', () => {
  it('devrait rendre le composant sans erreur', () => {
    const { container } = render(<FilterBar {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });

  it('devrait afficher le titre "Filtres de recherche"', () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.getByText('Filtres de recherche')).toBeInTheDocument();
  });

  it('devrait rendre les deux dropdowns (Thème, Format)', () => {
    render(<FilterBar {...defaultProps} />);
    // Le label contient aussi une icône ⓘ (span imbriqué) — match partiel, pas exact.
    expect(screen.getByText(/Thème/)).toBeInTheDocument();
    expect(screen.getByText(/Format/)).toBeInTheDocument();
  });

  it('devrait rendre le bouton Réinitialiser', () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.getByRole('button', { name: /Réinitialiser/ })).toBeInTheDocument();
  });

  it('devrait afficher les placeholders par défaut dans les dropdowns', () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.getByText('Tous les thèmes')).toBeInTheDocument();
    expect(screen.getByText('Tous les formats')).toBeInTheDocument();
  });

  it('devrait afficher les options dans chaque dropdown', () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.getByText('Ged')).toBeInTheDocument();
    expect(screen.getByText('Facture')).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(screen.getByText('Markdown')).toBeInTheDocument();
  });
});

describe('FilterBar - Accessibilité (WCAG 2.1 AA)', () => {
  it('devrait avoir un rôle région avec label', () => {
    render(<FilterBar {...defaultProps} />);
    const region = screen.getByRole('region');
    expect(region).toHaveAttribute('aria-label', 'Barre de filtres');
  });

  it('devrait avoir des labels visibles pour chaque dropdown', () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.getByText(/Thème/).tagName).toBe('LABEL');
    expect(screen.getByText(/Format/).tagName).toBe('LABEL');
  });

  it('devrait avoir des aria-labels sur tous les selects', () => {
    render(<FilterBar {...defaultProps} />);
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBe(2);
    selects.forEach((select) => expect(select).toHaveAttribute('aria-label'));
  });

  it('devrait avoir un bouton Réinitialiser avec aria-label', () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.getByRole('button', { name: /Réinitialiser/ })).toHaveAttribute(
      'aria-label',
      'Réinitialiser tous les filtres'
    );
  });
});

describe('FilterBar - Gestion des filtres', () => {
  it('devrait montrer les valeurs sélectionnées dans les dropdowns', () => {
    const filterStateWithValues: FilterState = { theme: 'Ged', documentFormat: 'pdf' };
    render(<FilterBar {...defaultProps} filterState={filterStateWithValues} />);
    const selects = screen.getAllByRole('combobox') as HTMLSelectElement[];
    expect(selects[0].value).toBe('Ged');
    expect(selects[1].value).toBe('pdf');
  });

  it('devrait appeler onFilterChange quand un filtre change', () => {
    const onFilterChangeMock = vi.fn();
    render(<FilterBar {...defaultProps} onFilterChange={onFilterChangeMock} />);
    const themeSelect = screen.getByLabelText('Thème') as HTMLSelectElement;
    fireEvent.change(themeSelect, { target: { value: 'Ged' } });
    expect(onFilterChangeMock).toHaveBeenCalledWith('theme', 'Ged');
  });

  it('devrait appeler onFilterChange pour chaque type de filtre', () => {
    const onFilterChangeMock = vi.fn();
    render(<FilterBar {...defaultProps} onFilterChange={onFilterChangeMock} />);
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'Ged' } });
    expect(onFilterChangeMock).toHaveBeenCalledWith('theme', 'Ged');
    fireEvent.change(selects[1], { target: { value: 'pdf' } });
    expect(onFilterChangeMock).toHaveBeenCalledWith('documentFormat', 'pdf');
  });
});

describe('FilterBar - Bouton Réinitialiser', () => {
  it('devrait appeler onReset quand cliqué', () => {
    const onResetMock = vi.fn();
    const filterStateWithValues: FilterState = { theme: 'Ged', documentFormat: '' };
    render(<FilterBar {...defaultProps} filterState={filterStateWithValues} onReset={onResetMock} />);
    fireEvent.click(screen.getByRole('button', { name: /Réinitialiser/ }));
    expect(onResetMock).toHaveBeenCalledTimes(1);
  });

  it('devrait désactiver le bouton Réinitialiser quand aucun filtre actif', () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.getByRole('button', { name: /Réinitialiser/ })).toBeDisabled();
  });

  it('devrait activer le bouton Réinitialiser quand des filtres sont actifs', () => {
    const filterStateWithValues: FilterState = { theme: 'Ged', documentFormat: '' };
    render(<FilterBar {...defaultProps} filterState={filterStateWithValues} />);
    expect(screen.getByRole('button', { name: /Réinitialiser/ })).not.toBeDisabled();
  });

  it('devrait afficher le compteur de filtres actifs', () => {
    const filterStateWithValues: FilterState = { theme: 'Ged', documentFormat: 'pdf' };
    render(<FilterBar {...defaultProps} filterState={filterStateWithValues} />);
    expect(screen.getByText('2 filtre(s) actif(s)')).toBeInTheDocument();
  });
});

describe('FilterBar - Gestion du chargement', () => {
  it("devrait afficher l'indicateur de chargement", () => {
    render(<FilterBar {...defaultProps} isLoading={true} />);
    expect(screen.getByText('Chargement des valeurs de filtre...')).toBeInTheDocument();
  });

  it('devrait désactiver les dropdowns pendant le chargement', () => {
    render(<FilterBar {...defaultProps} isLoading={true} />);
    screen.getAllByRole('combobox').forEach((select) => expect(select).toBeDisabled());
  });
});

describe('FilterBar - Styles et Apparence', () => {
  it('devrait avoir un conteneur avec les bons styles', () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.getByRole('region')).toHaveStyle({
      width: '100%',
      backgroundColor: '#0E1B2E',
      borderRadius: '12px',
      border: '1px solid #2A3B58',
    });
  });

  it('devrait avoir un bouton Réinitialiser actif avec le style primary', () => {
    const filterStateWithValues: FilterState = { theme: 'Ged', documentFormat: '' };
    render(<FilterBar {...defaultProps} filterState={filterStateWithValues} />);
    expect(screen.getByRole('button', { name: /Réinitialiser/ })).toHaveStyle({
      backgroundColor: '#F4693F',
      color: '#FFFFFF',
    });
  });
});

describe('FilterBar - Intégration et Réinitialisation', () => {
  it('devrait permettre de sélectionner puis réinitialiser un filtre', () => {
    const onFilterChangeMock = vi.fn();
    const onResetMock = vi.fn();

    const { rerender } = render(
      <FilterBar {...defaultProps} onFilterChange={onFilterChangeMock} onReset={onResetMock} />
    );

    expect(screen.getByRole('button', { name: /Réinitialiser/ })).toBeDisabled();

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'Ged' } });
    expect(onFilterChangeMock).toHaveBeenCalledWith('theme', 'Ged');

    // Simuler la mise à jour du state contrôlé par le parent
    rerender(
      <FilterBar
        {...defaultProps}
        filterState={{ theme: 'Ged', documentFormat: '' }}
        onFilterChange={onFilterChangeMock}
        onReset={onResetMock}
      />
    );

    expect(screen.getByRole('button', { name: /Réinitialiser/ })).not.toBeDisabled();
    expect(screen.getByText('1 filtre(s) actif(s)')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Réinitialiser/ }));
    expect(onResetMock).toHaveBeenCalled();
  });
});
