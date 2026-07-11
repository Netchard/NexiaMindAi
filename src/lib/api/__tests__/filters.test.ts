/**
 * Tests unitaires pour le client API des filtres
 * Fait partie de ST-304 - Implémenter les Filtres de Recherche
 *
 * Contrat réel (revue de code du 2026-07-07) : `{ themes, documentFormats }`,
 * `credentials: 'same-origin'` (pas 'omit' — l'auth passe par cookie de
 * session), et un 401 lève désormais une vraie `FiltersError` au lieu de
 * servir un fallback codé en dur comme si c'était de la donnée réelle.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resetFiltersCache } from '../filters';

const mockFetch = vi.fn();

describe('Filters API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
    // Le cache est un module-level singleton — le réinitialiser entre les
    // tests, sinon un test qui met en cache une réponse valide court-circuite
    // le fetch (et donc la logique d'erreur testée) des tests suivants.
    resetFiltersCache();
  });

  describe('getFilterValues - Succès', () => {
    it('devrait appeler fetch avec la bonne URL, méthode et credentials', async () => {
      const { getFilterValues } = await import('../filters');

      const mockResponse = {
        themes: ['Ged', 'Facture'],
        documentFormats: ['pdf', 'text'],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockResponse),
      });

      await getFilterValues();

      expect(mockFetch).toHaveBeenCalledWith('/api/chat/filters', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        signal: expect.any(AbortSignal),
      });
    });

    it('devrait retourner les données formatées correctement', async () => {
      const { getFilterValues } = await import('../filters');

      const mockResponse = {
        themes: ['Ged', 'Facture', 'Contrat'],
        documentFormats: ['pdf', 'text', 'markdown'],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockResponse),
      });

      const result = await getFilterValues();

      expect(result).toEqual(mockResponse);
    });

    it('devrait mettre en cache les résultats pour les appels suivants', async () => {
      const { getFilterValues } = await import('../filters');

      const mockResponse = {
        themes: ['Ged'],
        documentFormats: ['pdf'],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockResponse),
      });

      const result1 = await getFilterValues();
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(mockResponse);

      const result2 = await getFilterValues();
      expect(mockFetch).toHaveBeenCalledTimes(1); // Toujours 1 appel
      expect(result2).toEqual(mockResponse);
    });
  });

  describe('getFilterValues - Gestion des erreurs', () => {
    it('devrait lancer FiltersError si la réponse est 401 (pas de fallback fictif)', async () => {
      const { getFilterValues, FiltersError } = await import('../filters');

      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: vi.fn().mockResolvedValue({ error: 'Non autorisé' }),
      });

      await expect(getFilterValues()).rejects.toThrow(FiltersError);
      await expect(getFilterValues()).rejects.toMatchObject({
        status: 401,
        message: 'Non autorisé',
      });
    });

    it('devrait lancer FiltersError si la réponse est une autre erreur (500)', async () => {
      const { getFilterValues, FiltersError } = await import('../filters');

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValueOnce({ error: 'Erreur serveur interne' }),
      });

      await expect(getFilterValues()).rejects.toThrow(FiltersError);
    });

    it('devrait retourner les données en cache si l\'appel échoue mais qu\'on a un cache valide', async () => {
      const { getFilterValues } = await import('../filters');

      const mockResponse = {
        themes: ['Ged'],
        documentFormats: ['pdf'],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockResponse),
      });

      await getFilterValues();
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Le cache doit être expiré (TTL 1h) pour que le 2e appel retente le
      // fetch plutôt que de court-circuiter sur le cache encore valide.
      vi.useFakeTimers();
      vi.setSystemTime(Date.now() + 3600001);
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await getFilterValues();
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledTimes(2);
      vi.useRealTimers();
    });

    it('devrait lancer FiltersError si pas de cache et que l\'appel échoue', async () => {
      const { getFilterValues, FiltersError } = await import('../filters');

      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(getFilterValues()).rejects.toThrow(FiltersError);
      await expect(getFilterValues()).rejects.toMatchObject({
        message: expect.stringContaining('Network error'),
        status: 0,
      });
    });
  });

  describe('Cache Management', () => {
    it('devrait invalider le cache avec invalidateFiltersCache', async () => {
      const { getFilterValues, invalidateFiltersCache } = await import('../filters');

      const mockResponse = {
        themes: ['Ged'],
        documentFormats: ['pdf'],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      });

      await getFilterValues();
      expect(mockFetch).toHaveBeenCalledTimes(1);

      invalidateFiltersCache();

      await getFilterValues();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('devrait obtenir l\'état du cache avec getFiltersCacheState', async () => {
      const { getFilterValues, getFiltersCacheState } = await import('../filters');

      const mockResponse = {
        themes: ['Ged'],
        documentFormats: ['pdf'],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      });

      let state = getFiltersCacheState();
      expect(state.hasData).toBe(false);
      expect(state.isValid).toBe(false);

      await getFilterValues();
      state = getFiltersCacheState();
      expect(state.hasData).toBe(true);
      expect(state.isValid).toBe(true);
      expect(state.timestamp).toBeGreaterThan(0);
    });
  });

  describe('convertToFilterOptions', () => {
    it('devrait convertir les données de filtre en options pour les dropdowns', async () => {
      const { convertToFilterOptions } = await import('../filters');

      const filters = {
        themes: ['Ged', 'Facture', 'Contrat'],
        documentFormats: ['pdf', 'text'],
      };

      const result = convertToFilterOptions(filters);

      expect(result.themes).toEqual([
        { value: 'Ged', label: 'Ged' },
        { value: 'Facture', label: 'Facture' },
        { value: 'Contrat', label: 'Contrat' },
      ]);
      expect(result.documentFormats).toEqual([
        { value: 'pdf', label: 'pdf' },
        { value: 'text', label: 'text' },
      ]);
    });

    it('devrait gérer les tableaux vides', async () => {
      const { convertToFilterOptions } = await import('../filters');

      const filters = { themes: [], documentFormats: [] };

      const result = convertToFilterOptions(filters);

      expect(result.themes).toEqual([]);
      expect(result.documentFormats).toEqual([]);
    });
  });

  describe('prefetchFilterValues', () => {
    it('devrait appeler getFilterValues sans attendre le résultat', async () => {
      const { prefetchFilterValues } = await import('../filters');

      const mockResponse = {
        themes: ['Ged'],
        documentFormats: ['pdf'],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      });

      const prefetchPromise = prefetchFilterValues();

      expect(mockFetch).toHaveBeenCalled();

      await prefetchPromise;

      const state = (await import('../filters')).getFiltersCacheState();
      expect(state.hasData).toBe(true);
    });

    it('devrait gérer les erreurs en prefetch sans propager', async () => {
      const { prefetchFilterValues } = await import('../filters');

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(prefetchFilterValues()).resolves.not.toThrow();
    });
  });
});
