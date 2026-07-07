/**
 * Tests unitaires pour l'endpoint GET /api/chat/filters
 * Validation du contrat API défini dans la story (revu le 2026-07-07 :
 * `{ themes, documentFormats }`, pas `{ clients, documentTypes, languages }`)
 *
 * Le client Supabase (`@supabase/supabase-js`) est mocké : sans ça, ce test
 * déclenche un vrai appel réseau vers l'URL factice de test/setup.ts et reste
 * en attente indéfiniment (timeout de 10s observé avant cette correction —
 * revue de code ST-304).
 *
 * [2026-07-08] Le mock ne dépend que des alias PostgREST (`theme:...`,
 * `format:...`), pas des colonnes source réelles — inchangé même après le
 * rebranchement de "Thème" sur `metadata.client` et de "Format" sur
 * `documents.type` (voir src/app/api/chat/filters/route.ts).
 */

import { describe, it, expect, vi } from 'vitest';

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ from: mockFrom })),
}));

function buildQueryBuilder(result: { data: any; error: any }) {
  const builder: any = {
    select: vi.fn(() => builder),
    not: vi.fn(() => builder),
    then: (onFulfilled: any) => Promise.resolve(onFulfilled(result)),
  };
  return builder;
}

function mockRequest(headers: Record<string, string> = {}): any {
  return {
    method: 'GET',
    headers: new Headers(headers),
    nextUrl: { pathname: '/api/chat/filters' },
  };
}

describe('GET /api/chat/filters - Validation du Contrat API', () => {
  it('devrait exporter la fonction GET', async () => {
    const { GET } = await import('../route');
    expect(typeof GET).toBe('function');
  });

  it('devrait retourner la structure de réponse correcte selon le contrat API', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'chunks') {
        return buildQueryBuilder({ data: [{ theme: 'Ged' }, { theme: 'Facture' }], error: null });
      }
      return buildQueryBuilder({ data: [{ format: 'pdf' }, { format: 'text' }], error: null });
    });

    const { GET } = await import('../route');
    const response = await GET(mockRequest({ 'x-user-id': 'test_user_123' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('themes');
    expect(data).toHaveProperty('documentFormats');
    expect(Array.isArray(data.themes)).toBe(true);
    expect(Array.isArray(data.documentFormats)).toBe(true);
    expect(data.themes).toEqual(['Ged', 'Facture']);
    expect(data.documentFormats).toEqual(['pdf', 'text']);
  });

  it('devrait rejeter les requêtes sans userId dans les headers', async () => {
    const { GET } = await import('../route');

    const response = await GET(mockRequest());
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toContain('Non autorisé');
  });

  it('devrait retourner des tableaux vides si les requêtes Supabase échouent, sans planter', async () => {
    mockFrom.mockImplementation(() => buildQueryBuilder({ data: null, error: { message: 'DB error' } }));

    const { GET } = await import('../route');
    const response = await GET(mockRequest({ 'x-user-id': 'test_user_123' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.themes).toEqual([]);
    expect(data.documentFormats).toEqual([]);
  });
});
