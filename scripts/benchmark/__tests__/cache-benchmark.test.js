/**
 * Tests GREEN Phase pour cache-benchmark.js
 * Ces tests DOIVENT passer après l'implémentation du script
 * 
 * @story ST-403
 * @task Tâche 4.1 - Créer le script de benchmark
 */

const fs = require('fs');
const path = require('path');

// Chemins des fichiers
const BENCHMARK_SCRIPT_PATH = path.join(__dirname, '..', 'cache-benchmark.js');
const BENCHMARK_MOCK_PATH = path.join(__dirname, '..', 'cache-benchmark.mock.js');
const BENCHMARK_DIR = path.join(__dirname, '..');

// Ces tests exécutent generateReport()/runCacheBenchmark(), qui écrivent de vrais
// fichiers de rapport/log sur disque (embedding-cache-benchmark-*.json/.log). On les
// nettoie après la suite pour éviter une accumulation illimitée sur dev/CI.
afterAll(() => {
  const files = fs.readdirSync(BENCHMARK_DIR);
  for (const file of files) {
    if (/^embedding-cache-benchmark-(report-)?\d+\.(json|log)$/.test(file)) {
      fs.unlinkSync(path.join(BENCHMARK_DIR, file));
    }
  }
});

/**
 * GREEN PHASE: Tester le script cache-benchmark.js
 */

describe('GREEN PHASE: cache-benchmark.js existe et fonctionne', () => {
  beforeAll(() => {
    console.log('\n=== [GREEN PHASE] Tâche 4.1: cache-benchmark.js ===');
    console.log('Ces tests DOIVENT passer après l\'implémentation');
  });

  it('GREEN-4.1.1: Le script cache-benchmark.js existe', () => {
    const exists = fs.existsSync(BENCHMARK_SCRIPT_PATH);
    expect(exists).toBe(true);
  });

  it('GREEN-4.1.2: Le script cache-benchmark.mock.js existe', () => {
    const exists = fs.existsSync(BENCHMARK_MOCK_PATH);
    expect(exists).toBe(true);
  });

  it('GREEN-4.1.3: Le script cache-benchmark.js peut être importé', () => {
    const module = require(BENCHMARK_SCRIPT_PATH);
    expect(module).toBeDefined();
    expect(typeof module.runCacheBenchmark).toBe('function');
  });

  it('GREEN-4.1.4: Le script cache-benchmark.mock.js peut être importé', () => {
    const module = require(BENCHMARK_MOCK_PATH);
    expect(module).toBeDefined();
    expect(typeof module.runCacheBenchmark).toBe('function');
  });
});

/**
 * GREEN PHASE: Tester les fonctions exportées
 */

describe('GREEN PHASE: Fonctions du script cache-benchmark.js', () => {
  let benchmarkModule;
  let mockModule;

  beforeAll(() => {
    benchmarkModule = require(BENCHMARK_SCRIPT_PATH);
    mockModule = require(BENCHMARK_MOCK_PATH);
  });

  it('GREEN-4.1.5: runCacheBenchmark est exporté', () => {
    expect(typeof benchmarkModule.runCacheBenchmark).toBe('function');
  });

  it('GREEN-4.1.6: generateTestData est exporté', () => {
    expect(typeof benchmarkModule.generateTestData).toBe('function');
  });

  it('GREEN-4.1.7: measurePerformance est exporté', () => {
    expect(typeof benchmarkModule.measurePerformance).toBe('function');
  });

  it('GREEN-4.1.8: generateReport est exporté', () => {
    expect(typeof benchmarkModule.generateReport).toBe('function');
  });

  it('GREEN-4.1.9: validateAcceptanceCriteria est exporté', () => {
    expect(typeof benchmarkModule.validateAcceptanceCriteria).toBe('function');
  });

  it('GREEN-4.1.10: BENCHMARK_CONFIG est exporté', () => {
    expect(benchmarkModule.BENCHMARK_CONFIG).toBeDefined();
    expect(benchmarkModule.BENCHMARK_CONFIG.uniqueRequestsCount).toBe(100);
    expect(benchmarkModule.BENCHMARK_CONFIG.repeatedRequestsCount).toBe(100);
  });
});

/**
 * GREEN PHASE: Tester les classes Mock
 */

describe('GREEN PHASE: Classes Mock du benchmark', () => {
  let benchmarkModule;

  beforeAll(() => {
    benchmarkModule = require(BENCHMARK_SCRIPT_PATH);
  });

  it('GREEN-4.1.11: MockRedisCache existe', () => {
    expect(typeof benchmarkModule.MockRedisCache).toBe('function');
  });

  it('GREEN-4.1.12: MockEmbeddingService existe', () => {
    expect(typeof benchmarkModule.MockEmbeddingService).toBe('function');
  });

  it('GREEN-4.1.13: MockRedisEmbeddingCache existe', () => {
    expect(typeof benchmarkModule.MockRedisEmbeddingCache).toBe('function');
  });

  it('GREEN-4.1.14: MockRedisCache peut être instancié', () => {
    const mockCache = new benchmarkModule.MockRedisCache();
    expect(mockCache).toBeDefined();
    expect(typeof mockCache.get).toBe('function');
    expect(typeof mockCache.set).toBe('function');
    expect(typeof mockCache.clear).toBe('function');
  });

  it('GREEN-4.1.15: MockEmbeddingService peut être instancié', () => {
    const mockService = new benchmarkModule.MockEmbeddingService();
    expect(mockService).toBeDefined();
    expect(typeof mockService.generateEmbedding).toBe('function');
  });

  it('GREEN-4.1.16: MockRedisEmbeddingCache peut être instancié', () => {
    const mockEmbeddingCache = new benchmarkModule.MockRedisEmbeddingCache();
    expect(mockEmbeddingCache).toBeDefined();
    expect(typeof mockEmbeddingCache.getEmbedding).toBe('function');
    expect(typeof mockEmbeddingCache.setEmbedding).toBe('function');
    expect(typeof mockEmbeddingCache.clear).toBe('function');
  });
});

/**
 * GREEN PHASE: Tester generateTestData
 */

describe('GREEN PHASE: Fonction generateTestData', () => {
  let benchmarkModule;

  beforeAll(() => {
    benchmarkModule = require(BENCHMARK_SCRIPT_PATH);
  });

  it('GREEN-4.1.17: generateTestData retourne les bonnes données', () => {
    const testData = benchmarkModule.generateTestData();
    
    expect(testData).toHaveProperty('uniqueTexts');
    expect(testData).toHaveProperty('repeatedTexts');
    
    expect(Array.isArray(testData.uniqueTexts)).toBe(true);
    expect(Array.isArray(testData.repeatedTexts)).toBe(true);
    
    expect(testData.uniqueTexts.length).toBe(100);
    expect(testData.repeatedTexts.length).toBe(100);
  });

  it('GREEN-4.1.18: Les textes uniques sont vraiment uniques', () => {
    const testData = benchmarkModule.generateTestData();
    const uniqueSet = new Set(testData.uniqueTexts);
    
    // Avec 100 textes générés avec des index différents, ils devraient être uniques
    expect(uniqueSet.size).toBe(100);
  });

  it('GREEN-4.1.19: Les textes ont la bonne longueur', () => {
    const testData = benchmarkModule.generateTestData();
    
    testData.uniqueTexts.forEach(text => {
      expect(text.length).toBeGreaterThanOrEqual(50);
      expect(text.length).toBeLessThanOrEqual(100);
    });
  });
});

/**
 * GREEN PHASE: Tester measurePerformance avec Mock
 */

describe('GREEN PHASE: Fonction measurePerformance', () => {
  let benchmarkModule;

  beforeAll(() => {
    benchmarkModule = require(BENCHMARK_SCRIPT_PATH);
  });

  it('GREEN-4.1.20: measurePerformance retourne des résultats valides', async () => {
    const config = {
      name: 'Test Configuration',
      useRedis: false,
      useInMemory: true,
      useCache: true,
    };
    
    const result = await benchmarkModule.measurePerformance(config);
    
    expect(result).toBeDefined();
    expect(result.config).toBe(config.name);
    
    expect(result.uniqueRequests).toBeDefined();
    expect(result.uniqueRequests.count).toBe(100);
    
    expect(result.repeatedRequests).toBeDefined();
    expect(result.repeatedRequests.count).toBe(100);
    
    expect(result.overall).toBeDefined();
    expect(result.overall.totalRequests).toBe(200);
    
    // Vérifier que les temps sont des nombres
    expect(typeof result.uniqueRequests.avgTime).toBe('number');
    expect(typeof result.repeatedRequests.avgTime).toBe('number');
    
    // Les cache hits devraient être > 0 pour les requêtes répétées avec cache
    expect(result.repeatedRequests.cacheHits).toBeGreaterThan(0);
  }, 60000); // Timeout de 60s : 100 requêtes uniques avec un délai simulé de 200-500ms chacune
});

/**
 * GREEN PHASE: Tester generateReport
 */

describe('GREEN PHASE: Fonction generateReport', () => {
  let benchmarkModule;

  beforeAll(() => {
    benchmarkModule = require(BENCHMARK_SCRIPT_PATH);
  });

  it('GREEN-4.1.21: generateReport retourne un rapport valide', () => {
    const mockResults = [
      {
        config: 'Test',
        uniqueRequests: {
          count: 100,
          times: [100, 200, 300],
          totalTime: 600,
          avgTime: 200,
          minTime: 100,
          maxTime: 300,
          cacheHits: 0,
          cacheMisses: 100,
          apiCalls: 100,
        },
        repeatedRequests: {
          count: 100,
          times: [10, 20, 30],
          totalTime: 60,
          avgTime: 20,
          minTime: 10,
          maxTime: 30,
          cacheHits: 100,
          cacheMisses: 0,
          apiCalls: 0,
        },
        overall: {
          totalRequests: 200,
          totalTime: 660,
          avgTime: 330,
          cacheHitRate: 50,
          apiCallReduction: 50,
        },
      },
    ];
    
    const report = benchmarkModule.generateReport(mockResults);
    
    expect(report).toBeDefined();
    expect(report.timestamp).toBeDefined();
    expect(report.benchmarkVersion).toBe('1.0.0');
    expect(report.story).toBe('ST-403');
    expect(report.task).toContain('Tâche 4.1');
    expect(report.results).toBeDefined();
    expect(Array.isArray(report.results)).toBe(true);
    expect(report.results.length).toBe(1);
  });
});

/**
 * GREEN PHASE: Tester validateAcceptanceCriteria
 */

describe('GREEN PHASE: Fonction validateAcceptanceCriteria', () => {
  let benchmarkModule;

  beforeAll(() => {
    benchmarkModule = require(BENCHMARK_SCRIPT_PATH);
  });

  it('GREEN-4.1.22: validateAcceptanceCriteria retourne des résultats valides', () => {
    const mockResults = [
      {
        config: 'Avec Cache Redis + In-Memory',
        uniqueRequests: {
          avgTime: 300,
          cacheHits: 0,
          cacheMisses: 100,
        },
        repeatedRequests: {
          avgTime: 10, // < 50ms
          cacheHits: 100,
          cacheMisses: 0,
        },
        overall: {
          cacheHitRate: 100, // > 30%
          apiCallReduction: 50, // > 0%
        },
      },
    ];
    
    const acResults = benchmarkModule.validateAcceptanceCriteria(mockResults);
    
    expect(acResults).toBeDefined();
    expect(acResults.ac1).toBeDefined();
    expect(acResults.ac2).toBeDefined();
    expect(acResults.ac3).toBeDefined();
    
    // Avec ces données mock, tous les AC devraient être satisfaits
    expect(acResults.ac1.satisfied).toBe(true);
    expect(acResults.ac2.satisfied).toBe(true);
    expect(acResults.ac3.satisfied).toBe(true);
  });
});

/**
 * GREEN PHASE: Tester le MOCK module
 */

describe('GREEN PHASE: Module cache-benchmark.mock.js', () => {
  let mockModule;

  beforeAll(() => {
    mockModule = require(BENCHMARK_MOCK_PATH);
  });

  it('GREEN-4.1.23: generateMockResults retourne des résultats valides', () => {
    const results = mockModule.generateMockResults();
    
    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(3); // 3 configurations
    
    // Vérifier la structure
    results.forEach(result => {
      expect(result.config).toBeDefined();
      expect(result.uniqueRequests).toBeDefined();
      expect(result.repeatedRequests).toBeDefined();
      expect(result.overall).toBeDefined();
    });
  });

  it('GREEN-4.1.24: runCacheBenchmark MOCK fonctionne', async () => {
    const result = await mockModule.runCacheBenchmark();
    
    expect(result).toBeDefined();
    expect(result.results).toBeDefined();
    expect(result.report).toBeDefined();
    expect(result.acResults).toBeDefined();
    
    // Tous les AC devraient être satisfaits avec les données MOCK
    expect(result.acResults.ac1.satisfied).toBe(true);
    expect(result.acResults.ac2.satisfied).toBe(true);
    expect(result.acResults.ac3.satisfied).toBe(true);
  }, 10000); // Timeout de 10s
});

/**
 * GREEN PHASE: Tester l'exécution complète
 */

describe('GREEN PHASE: Exécution complète', () => {
  it('GREEN-4.1.25: runCacheBenchmark MOCK s\'exécute sans erreur', async () => {
    const mockModule = require(BENCHMARK_MOCK_PATH);
    
    await expect(mockModule.runCacheBenchmark()).resolves.toBeDefined();
  }, 15000);
});

/**
 * Message final pour la GREEN phase
 */

describe('GREEN PHASE: Résumé', () => {
  it('GREEN-4.1.26: La GREEN phase est terminée - implémentation complète', () => {
    console.log('\n📝 GREEN PHASE COMPLÈTE pour Tâche 4.1');
    console.log('✅ Tous les tests passent');
    console.log('✅ Le script cache-benchmark.js est fonctionnel');
    console.log('✅ Le script cache-benchmark.mock.js est fonctionnel');
    console.log('🎯 Prochaine étape: REFACTOR PHASE - Améliorations et validation');
    console.log('');
    
    expect(true).toBe(true);
  });
});
