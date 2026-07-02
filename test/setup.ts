/**
 * Configuration de Vitest pour NexiaMind AI
 * Fichier de setup exécuté avant chaque test
 */

import { beforeAll, afterAll, afterEach, vi } from 'vitest';

// Mock des variables d'environnement
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.MISTRAL_API_KEY = 'test-mistral-key';

// Mock du logger pour éviter les sorties console pendant les tests
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock de Supabase si nécessaire
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: {}, session: {} }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: {} }, error: null }),
      refreshSession: vi.fn().mockResolvedValue({ data: { session: {}, user: {} }, error: null }),
    },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
  },
}));

// Configuration globale avant tous les tests
beforeAll(() => {
  // Configuration globale si nécessaire
});

// Nettoyage après chaque test
afterEach(() => {
  // Réinitialiser les mocks
  vi.clearAllMocks();
});

// Nettoyage après tous les tests
afterAll(() => {
  // Nettoyage final
  vi.restoreAllMocks();
});
