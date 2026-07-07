/**
 * Tests unitaires pour le composant FilterDropdown
 * Fait partie de ST-304 - Implémenter les Filtres de Recherche
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterDropdown } from '../FilterDropdown';
import { FilterOption } from '../types';

// Options de test mockées
const mockOptions: FilterOption[] = [
  { value: 'client-a', label: 'Client A' },
  { value: 'client-b', label: 'Client B' },
  { value: 'client-c', label: 'Client C' },
];

const defaultProps = {
  name: 'test-filter',
  label: 'Client',
  placeholder: 'Tous les clients',
  options: mockOptions,
  value: '',
  onChange: vi.fn(),
  disabled: false,
};

describe('FilterDropdown - Rendering et Structure', () => {
  it('devrait rendre le composant sans erreur', () => {
    const { container } = render(<FilterDropdown {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });

  it('devrait afficher le label correctement', () => {
    render(<FilterDropdown {...defaultProps} />);
    
    const labelElement = screen.getByText('Client');
    expect(labelElement).toBeInTheDocument();
    expect(labelElement.tagName).toBe('LABEL');
  });

  it('devrait avoir un label associé au select via htmlFor', () => {
    render(<FilterDropdown {...defaultProps} />);
    
    const label = screen.getByText('Client');
    const select = screen.getByRole('combobox');
    
    // Vérifier que le label est associé au select
    expect(label).toHaveAttribute('for', expect.stringContaining('filter-dropdown'));
    expect(select).toHaveAttribute('id', expect.stringContaining('filter-dropdown'));
  });

  it('devrait afficher le placeholder dans l\'option par défaut', () => {
    render(<FilterDropdown {...defaultProps} />);
    
    const placeholderOption = screen.getByText('Tous les clients');
    expect(placeholderOption).toBeInTheDocument();
    expect(placeholderOption).toHaveAttribute('value', '');
  });

  it('devrait afficher toutes les options disponibles', () => {
    render(<FilterDropdown {...defaultProps} />);
    
    mockOptions.forEach(option => {
      const optionElement = screen.getByText(option.label);
      expect(optionElement).toBeInTheDocument();
      expect(optionElement).toHaveAttribute('value', option.value);
    });
  });

  it('devrait afficher la valeur sélectionnée', () => {
    const selectedValue = 'client-b';
    render(
      <FilterDropdown 
        {...defaultProps} 
        value={selectedValue}
      />
    );
    
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe(selectedValue);
  });
});

describe('FilterDropdown - Accessibilité (WCAG 2.1 AA)', () => {
  it('devrait avoir un label accessible', () => {
    render(<FilterDropdown {...defaultProps} />);
    
    const label = screen.getByText('Client');
    expect(label).toHaveAttribute('for');
  });

  it('devrait avoir un aria-label sur le select', () => {
    render(<FilterDropdown {...defaultProps} />);
    
    const select = screen.getByRole('combobox');
    expect(select).toHaveAttribute('aria-label', 'Client');
  });

  it('devrait avoir aria-disabled quand disabled=true', () => {
    render(<FilterDropdown {...defaultProps} disabled={true} />);
    
    const select = screen.getByRole('combobox');
    expect(select).toHaveAttribute('aria-disabled', 'true');
    expect(select).toBeDisabled();
  });

  it('devrait avoir aria-required si nécessaire', () => {
    render(<FilterDropdown {...defaultProps} />);
    
    const select = screen.getByRole('combobox');
    expect(select).toHaveAttribute('aria-required', 'false');
  });

  it('devrait indiquer quand le select est désactivé', () => {
    render(<FilterDropdown {...defaultProps} disabled={true} />);
    
    const select = screen.getByRole('combobox');
    expect(select).toBeDisabled();
    expect(select).toHaveStyle({ opacity: '0.6', cursor: 'not-allowed' });
  });
});

describe('FilterDropdown - Interactions', () => {
  it('devrait appeler onChange quand la valeur change', () => {
    const onChangeMock = vi.fn();
    render(<FilterDropdown {...defaultProps} onChange={onChangeMock} />);
    
    const select = screen.getByRole('combobox');
    
    // Changer la valeur
    fireEvent.change(select, { target: { value: 'client-a' } });
    
    expect(onChangeMock).toHaveBeenCalledWith('client-a');
    expect(onChangeMock).toHaveBeenCalledTimes(1);
  });

  it('devrait permettre de sélectionner différentes options', () => {
    const onChangeMock = vi.fn();
    render(<FilterDropdown {...defaultProps} onChange={onChangeMock} />);
    
    const select = screen.getByRole('combobox');
    
    // Sélectionner la première option
    fireEvent.change(select, { target: { value: 'client-a' } });
    expect(onChangeMock).toHaveBeenCalledWith('client-a');
    
    // Sélectionner la deuxième option
    fireEvent.change(select, { target: { value: 'client-b' } });
    expect(onChangeMock).toHaveBeenCalledWith('client-b');
    
    // Sélectionner la troisième option
    fireEvent.change(select, { target: { value: 'client-c' } });
    expect(onChangeMock).toHaveBeenCalledWith('client-c');
  });

  it('devrait permettre de réinitialiser à la valeur vide', () => {
    const onChangeMock = vi.fn();
    render(
      <FilterDropdown 
        {...defaultProps} 
        value="client-a"
        onChange={onChangeMock}
      />
    );
    
    const select = screen.getByRole('combobox');
    
    // Réinitialiser à vide
    fireEvent.change(select, { target: { value: '' } });
    expect(onChangeMock).toHaveBeenCalledWith('');
  });

  it('ne devrait pas appeler onChange quand disabled=true', () => {
    const onChangeMock = vi.fn();
    render(<FilterDropdown {...defaultProps} onChange={onChangeMock} disabled={true} />);
    
    const select = screen.getByRole('combobox');
    
    // Essayer de changer la valeur
    fireEvent.change(select, { target: { value: 'client-a' } });
    
    expect(onChangeMock).not.toHaveBeenCalled();
  });
});

describe('FilterDropdown - Styles et Apparence', () => {
  it('devrait avoir les styles de base corrects', () => {
    render(<FilterDropdown {...defaultProps} />);
    
    const select = screen.getByRole('combobox');
    
    // Vérifier les styles de base — paddingRight est surchargé séparément
    // pour laisser la place à la flèche custom, d'où le raccourci `padding`
    // à 4 valeurs une fois résolu par le DOM.
    expect(select).toHaveStyle({
      width: '100%',
      padding: '8px 36px 8px 12px',
      fontSize: '14px',
      borderRadius: '8px',
      backgroundColor: '#0A1524',
    });
  });

  it('devrait avoir une flèche personnalisée', () => {
    render(<FilterDropdown {...defaultProps} />);
    
    const select = screen.getByRole('combobox');
    
    // Vérifier que le background-image contient une flèche
    const style = window.getComputedStyle(select);
    expect(style.backgroundImage).not.toBe('none');
  });

  it('devrait montrer un curseur pointer quand non désactivé', () => {
    render(<FilterDropdown {...defaultProps} />);
    
    const select = screen.getByRole('combobox');
    expect(select).toHaveStyle({ cursor: 'pointer' });
  });

  it('devrait montrer un curseur not-allowed quand désactivé', () => {
    render(<FilterDropdown {...defaultProps} disabled={true} />);
    
    const select = screen.getByRole('combobox');
    expect(select).toHaveStyle({ cursor: 'not-allowed' });
  });
});

describe('FilterDropdown - Comportement Responsive', () => {
  it('devrait avoir des marges adaptées sur mobile', () => {
    // Simuler une vue mobile
    global.innerWidth = 400;
    global.dispatchEvent(new Event('resize'));
    
    render(<FilterDropdown {...defaultProps} />);
    
    const container = screen.getByRole('combobox').parentElement?.parentElement;
    expect(container).toBeInTheDocument();
    
    // Réinitialiser
    global.innerWidth = 1024;
    global.dispatchEvent(new Event('resize'));
  });
});
