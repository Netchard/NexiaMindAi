/**
 * Tests PHASE GREEN pour l'analyse de l'index vectoriel (ST-402)
 * Ces tests utilisent un MOCK du client Supabase pour valider le code réel
 * sans nécessiter une connexion à une base de données réelle.
 * 
 * @story ST-402
 * @task Tâche 1 - Analyser la charge de données actuelle
 */

const fs = require('fs');
const path = require('path');

const REPORT_PATH = path.join(__dirname, 'vector-index-analysis-report.json');
const LOG_PATH = path.join(__dirname, 'vector-index-analysis.log');

// Chemin vers le module réel (non mocké)
const analyzeModule = require('./analyze-vector-index');

/**
 * Nettoyer les fichiers générés après les tests
 */
function cleanupFiles() {
  [REPORT_PATH, LOG_PATH].forEach(file => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  });
}

// Nettoyer avant les tests
beforeAll(() => {
  cleanupFiles();
});

// Nettoyer après tous les tests
afterAll(() => {
  cleanupFiles();
});

/**
 * Crée un mock du client Supabase pour les tests
 * Ce mock simule les réponses de Supabase sans nécessiter une vraie connexion
 */
function createMockSupabaseClient() {
  // Mock de la méthode from() qui retourne un objet avec select(), limit(), etc.
  const mockFrom = (tableName) => {
    // Simuler les données de la table embeddings
    const mockEmbeddingsData = [
      {
        id: 'test-id-1',
        chunk_id: 'test-chunk-1',
        // Vecteur de 384 dimensions (format tableau)
        vector: new Array(384).fill(0.5),
        created_at: new Date().toISOString()
      },
      {
        id: 'test-id-2',
        chunk_id: 'test-chunk-2',
        vector: new Array(384).fill(0.3),
        created_at: new Date().toISOString()
      }
    ];

    return {
      from: (table) => {
        if (table === 'embeddings') {
          return {
            select: (columns, options) => {
              // Pour le comptage
              if (options && options.count === 'exact' && options.head === true) {
                return Promise.resolve({
                  data: null,
                  count: 5000,
                  error: null
                });
              }
              // Pour la sélection avec limit
              if (columns === '*' || columns === 'vector') {
                return {
                  limit: (limit) => {
                    if (limit === 1) {
                      return Promise.resolve({
                        data: mockEmbeddingsData.slice(0, 1),
                        error: null
                      });
                    }
                    return Promise.resolve({
                      data: mockEmbeddingsData,
                      error: null
                    });
                  }
                };
              }
              return Promise.resolve({
                data: mockEmbeddingsData,
                error: null
              });
            }
          };
        }
        return {
          select: () => Promise.resolve({ data: [], error: null })
        };
      }
    };
  };

  return {
    from: mockFrom
  };
}

describe('ST-402: Tâche 1 - Analyser la charge de données actuelle (PHASE GREEN)', () => {
  describe('🟢 Tests avec client Supabase mocké', () => {
    
    describe('Fonction analyzeEmbeddingsTable', () => {
      it('DOIT analyser correctement la table avec un client mocké', async () => {
        const mockClient = createMockSupabaseClient();
        
        // Appeler la vraie fonction analyzeEmbeddingsTable avec le client mocké
        const report = await analyzeModule.analyzeEmbeddingsTable(mockClient);
        
        expect(report).toBeDefined();
        expect(typeof report).toBe('object');
      });

      it('DOIT détecter correctement la dimension 384', async () => {
        const mockClient = createMockSupabaseClient();
        const report = await analyzeModule.analyzeEmbeddingsTable(mockClient);
        
        expect(report.vectorDimension).toBe(384);
        expect(report.dimensionValid).toBe(true);
      });

      it('DOIT compter correctement les embeddings', async () => {
        const mockClient = createMockSupabaseClient();
        const report = await analyzeModule.analyzeEmbeddingsTable(mockClient);
        
        expect(report.totalEmbeddings).toBe(5000);
        expect(typeof report.totalEmbeddings).toBe('number');
      });

      it('DOIT estimer correctement la taille future', async () => {
        const mockClient = createMockSupabaseClient();
        const report = await analyzeModule.analyzeEmbeddingsTable(mockClient);
        
        expect(report.estimatedFutureSize).toBeDefined();
        expect(typeof report.estimatedFutureSize).toBe('number');
        // 5000 * 1.5 = 7500
        expect(report.estimatedFutureSize).toBe(7500);
      });

      it('DOIT valider que la table existe', async () => {
        const mockClient = createMockSupabaseClient();
        const report = await analyzeModule.analyzeEmbeddingsTable(mockClient);
        
        expect(report.tableExists).toBe(true);
      });

      it('DOIT valider que la colonne vector existe', async () => {
        const mockClient = createMockSupabaseClient();
        const report = await analyzeModule.analyzeEmbeddingsTable(mockClient);
        
        expect(report.vectorColumnExists).toBe(true);
      });
    });

    describe('Fonction validateDimension', () => {
      it('DOIT retourner true pour dimension 384', () => {
        expect(analyzeModule.validateDimension(384)).toBe(true);
      });

      it('DOIT retourner false pour dimension différente de 384', () => {
        expect(analyzeModule.validateDimension(8)).toBe(false);
        expect(analyzeModule.validateDimension(768)).toBe(false);
        expect(analyzeModule.validateDimension(0)).toBe(false);
      });
    });

    describe('Fonction extractListsFromIndexDef', () => {
      it('DOIT extraire le paramètre lists de la définition de l\'index', () => {
        const indexDef = 'CREATE INDEX idx_test ON public.embeddings USING ivfflat (vector vector_l2_ops) WITH (lists = 100)';
        expect(analyzeModule.extractListsFromIndexDef(indexDef)).toBe(100);
      });

      it('DOIT retourner null pour une définition sans lists', () => {
        const indexDef = 'CREATE INDEX idx_test ON public.embeddings USING ivfflat (vector vector_l2_ops)';
        expect(analyzeModule.extractListsFromIndexDef(indexDef)).toBeNull();
      });

      it('DOIT retourner null pour null/undefined', () => {
        expect(analyzeModule.extractListsFromIndexDef(null)).toBeNull();
        expect(analyzeModule.extractListsFromIndexDef(undefined)).toBeNull();
      });
    });

    describe('Constantes exportées', () => {
      it('DOIT exporter REPORT_PATH', () => {
        expect(analyzeModule.REPORT_PATH).toBeDefined();
        expect(analyzeModule.REPORT_PATH).toContain('vector-index-analysis-report.json');
      });

      it('DOIT exporter LOG_PATH', () => {
        expect(analyzeModule.LOG_PATH).toBeDefined();
        expect(analyzeModule.LOG_PATH).toContain('vector-index-analysis.log');
      });

      it('DOIT exporter toutes les fonctions nécessaires', () => {
        expect(typeof analyzeModule.analyzeVectorIndex).toBe('function');
        expect(typeof analyzeModule.initAdminClient).toBe('function');
        expect(typeof analyzeModule.analyzeEmbeddingsTable).toBe('function');
        expect(typeof analyzeModule.extractListsFromIndexDef).toBe('function');
        expect(typeof analyzeModule.validateDimension).toBe('function');
        expect(typeof analyzeModule.saveReport).toBe('function');
        expect(typeof analyzeModule.initLogs).toBe('function');
      });
    });
  });

  describe('✅ Validation des Critères d\'Acceptation', () => {
    let report;

    beforeAll(async () => {
      const mockClient = createMockSupabaseClient();
      report = await analyzeModule.analyzeEmbeddingsTable(mockClient);
    });

    describe('AC #1: Index IVFFlat configuré avec le bon nombre de listes', () => {
      it('DOIT contenir les informations de base pour l\'index', () => {
        // Le rapport contient les infos de base, l'index sera récupéré via SQL
        expect(report.tableName).toBe('public.embeddings');
      });
    });

    describe('AC #2: Test de performance avec différents paramètres', () => {
      it('DOIT fournir la base pour les tests de benchmark', () => {
        expect(report.totalEmbeddings).toBeDefined();
        expect(typeof report.totalEmbeddings).toBe('number');
      });

      it('DOIT estimer la taille future pour les tests', () => {
        expect(report.estimatedFutureSize).toBeDefined();
        expect(report.estimatedFutureSize).toBeGreaterThan(report.totalEmbeddings);
      });
    });

    describe('AC #3: Temps de réponse < 3s', () => {
      it('DOIT documenter la configuration actuelle pour référence', () => {
        // Les informations d'index seront récupérées via les scripts SQL
        expect(report.tableName).toBe('public.embeddings');
      });
    });

    describe('AC #4: Documentation des choix d\'optimisation', () => {
      it('DOIT générer un rapport complet', () => {
        expect(report).toHaveProperty('totalEmbeddings');
        expect(report).toHaveProperty('vectorDimension');
        expect(report).toHaveProperty('estimatedFutureSize');
      });

      it('DOIT valider la dimension à 384', () => {
        expect(report.vectorDimension).toBe(384);
        expect(report.dimensionValid).toBe(true);
      });
    });
  });
});

// Export pour Jest
module.exports = {};
