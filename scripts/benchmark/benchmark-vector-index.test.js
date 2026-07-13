/**
 * Tests Jest pour le script de benchmark - ST-402
 * PHASE RED/GREEN: Tests des fonctions pures et validation des guardrails
 * 
 * @story ST-402
 * @task Tâche 2 - Tests du script de benchmark
 */

const {
  calculateStandardDeviation,
  generateSummary,
  validateBenchmarkConfig,
  generateTestVector,
  BENCHMARK_CONFIG
} = require('./benchmark-vector-index');

describe('Groupe 3 - Benchmark Vector Index - Tests RED/GREEN', () => {
  
  describe('PHASE RED: Validation des erreurs et guardrails', () => {
    
    describe('validateBenchmarkConfig() - G3-H-002', () => {
      const originalConfig = { ...BENCHMARK_CONFIG };
      
      afterEach(() => {
        // Réinitialiser la config
        Object.keys(originalConfig).forEach(key => {
          BENCHMARK_CONFIG[key] = originalConfig[key];
        });
      });
      
      test('RED: listConfigurations vide doit échouer', () => {
        BENCHMARK_CONFIG.listConfigurations = [];
        expect(() => validateBenchmarkConfig()).toThrow('listConfigurations doit contenir au moins une valeur');
      });
      
      test('RED: testIterations = 0 doit échouer', () => {
        BENCHMARK_CONFIG.testIterations = 0;
        expect(() => validateBenchmarkConfig()).toThrow('testIterations doit être > 0');
      });
      
      test('RED: testIterations négatif doit échouer', () => {
        BENCHMARK_CONFIG.testIterations = -5;
        expect(() => validateBenchmarkConfig()).toThrow('testIterations doit être > 0');
      });
      
      test('RED: queryLimit = 0 doit échouer', () => {
        BENCHMARK_CONFIG.queryLimit = 0;
        expect(() => validateBenchmarkConfig()).toThrow('queryLimit doit être > 0');
      });
      
      test('RED: queryLimit négatif doit échouer', () => {
        BENCHMARK_CONFIG.queryLimit = -1;
        expect(() => validateBenchmarkConfig()).toThrow('queryLimit doit être > 0');
      });
      
      test('RED: warmupQueries négatif doit échouer', () => {
        BENCHMARK_CONFIG.warmupQueries = -1;
        expect(() => validateBenchmarkConfig()).toThrow('warmupQueries doit être >= 0');
      });
      
      test('RED: listConfigurations avec doublons doit échouer - G3-F-004', () => {
        BENCHMARK_CONFIG.listConfigurations = [50, 100, 100, 200];
        expect(() => validateBenchmarkConfig()).toThrow('listConfigurations contient des valeurs dupliquées');
      });
    });
    
    describe('generateTestVector() - G3-M-001', () => {
      test('RED: doit générer un vecteur de dimension 384', () => {
        const vector = generateTestVector();
        expect(vector.length).toBe(384);
      });
      
      test('RED: doit générer des nombres entre -1 et 1', () => {
        const vector = generateTestVector();
        vector.forEach(val => {
          expect(val).toBeGreaterThanOrEqual(-1);
          expect(val).toBeLessThanOrEqual(1);
        });
      });
      
      test('RED: doit toujours retourner 384 dimensions (leçon ST-401)', () => {
        for (let i = 0; i < 100; i++) {
          const vector = generateTestVector();
          expect(vector.length).toBe(384);
        }
      });
    });
    
    describe('calculateStandardDeviation() - G3-H-008', () => {
      test('RED: tableau vide doit retourner 0', () => {
        expect(calculateStandardDeviation([])).toBe(0);
      });
      
      test('RED: tableau avec une valeur doit retourner 0', () => {
        expect(calculateStandardDeviation([10])).toBe(0);
      });
      
      test('RED: tableau avec valeurs identiques doit retourner 0', () => {
        expect(calculateStandardDeviation([5, 5, 5, 5])).toBe(0);
      });
    });
    
    describe('generateSummary() - G3-M-003', () => {
      test('RED: résultats vides doit retourner successfulConfigurations = 0', () => {
        const summary = generateSummary([]);
        expect(summary.successfulConfigurations).toBe(0);
        expect(summary.failedConfigurations).toBe(0);
        expect(summary.bestConfiguration).toBeNull();
      });
      
      test('RED: toutes configurations échouées doit retourner bestConfiguration = null', () => {
        const results = [
          { error: 'Erreur 1', statistics: { totalQueries: 0 } },
          { error: 'Erreur 2', statistics: { totalQueries: 0 } }
        ];
        const summary = generateSummary(results);
        expect(summary.successfulConfigurations).toBe(0);
        expect(summary.failedConfigurations).toBe(2);
        expect(summary.bestConfiguration).toBeNull();
      });
    });
  });
  
  describe('PHASE GREEN: Fonctionnalités validées', () => {
    
    describe('validateBenchmarkConfig() - G3-H-002', () => {
      const originalConfig = { ...BENCHMARK_CONFIG };
      
      afterEach(() => {
        Object.keys(originalConfig).forEach(key => {
          BENCHMARK_CONFIG[key] = originalConfig[key];
        });
      });
      
      test('GREEN: configuration valide doit passer', () => {
        expect(() => validateBenchmarkConfig()).not.toThrow();
      });
      
      test('GREEN: configuration avec warmupQueries = 0 doit passer', () => {
        BENCHMARK_CONFIG.warmupQueries = 0;
        expect(() => validateBenchmarkConfig()).not.toThrow();
      });
    });
    
    describe('generateTestVector() - G3-CR-003', () => {
      test('GREEN: doit générer un tableau de 384 nombres', () => {
        const vector = generateTestVector();
        expect(Array.isArray(vector)).toBe(true);
        expect(vector.length).toBe(384);
        expect(vector.every(v => typeof v === 'number')).toBe(true);
      });
      
      test('GREEN: vecteurs générés sont différents à chaque appel', () => {
        const vector1 = generateTestVector();
        const vector2 = generateTestVector();
        // Au moins un élément doit être différent
        expect(vector1).not.toEqual(vector2);
      });
    });
    
    describe('calculateStandardDeviation() - G3-H-008', () => {
      test('GREEN: calcul correct pour un ensemble simple', () => {
        // Données: [2, 4, 4, 4, 5, 5, 7, 9]
        // Moyenne: 5
        // Variance: 4
        // Écart-type: 2
        const data = [2, 4, 4, 4, 5, 5, 7, 9];
        const stdDev = calculateStandardDeviation(data);
        expect(stdDev).toBeCloseTo(2, 5);
      });
      
      test('GREEN: calcul correct pour des temps de benchmark simulés', () => {
        const times = [1000, 1100, 900, 1050, 950];
        const stdDev = calculateStandardDeviation(times);
        // Moyenne = 1000, écart-type ≈ 79.06
        expect(stdDev).toBeCloseTo(79.06, 1);
      });
    });
    
    describe('generateSummary() - G3-M-003', () => {
      test('GREEN: doit identifier la configuration la plus rapide', () => {
        const results = [
          {
            lists: 50,
            statistics: { avgTime: 1500, totalQueries: 5 }
          },
          {
            lists: 100,
            statistics: { avgTime: 1200, totalQueries: 5 }
          },
          {
            lists: 200,
            statistics: { avgTime: 1100, totalQueries: 5 }
          }
        ];
        const summary = generateSummary(results);
        expect(summary.successfulConfigurations).toBe(3);
        expect(summary.bestConfiguration.lists).toBe(200);
        expect(summary.bestConfiguration.avgTime).toBe(1100);
      });
      
      test('GREEN: doit générer une recommandation vitesse', () => {
        const results = [
          {
            lists: 200,
            statistics: { avgTime: 1100, totalQueries: 5 },
            results: [{time: 1100}, {time: 1100}, {time: 1100}, {time: 1100}, {time: 1100}]
          }
        ];
        const summary = generateSummary(results);
        const speedRec = summary.recommendations.find(r => r.type === 'vitesse');
        expect(speedRec).toBeDefined();
        expect(speedRec.configuration).toBe(200);
      });
      
      test('GREEN: doit générer une recommandation critère si < 3000ms', () => {
        const results = [
          {
            lists: 200,
            statistics: { avgTime: 1100, totalQueries: 5 },
            results: [{time: 1100}, {time: 1100}, {time: 1100}, {time: 1100}, {time: 1100}]
          }
        ];
        const summary = generateSummary(results);
        const criteriaRec = summary.recommendations.find(r => r.type === 'critère');
        expect(criteriaRec).toBeDefined();
        expect(criteriaRec.configuration).toBe(200);
      });
      
      test('GREEN: ne doit PAS générer de recommandation critère si >= 3000ms', () => {
        const results = [
          {
            lists: 200,
            statistics: { avgTime: 3500, totalQueries: 5 },
            results: [{time: 3500}, {time: 3500}, {time: 3500}, {time: 3500}, {time: 3500}]
          }
        ];
        const summary = generateSummary(results);
        const criteriaRec = summary.recommendations.find(r => r.type === 'critère');
        expect(criteriaRec).toBeUndefined();
      });
      
      test('GREEN: doit générer des recommandations de stabilité', () => {
        const results = [
          {
            lists: 50,
            statistics: { avgTime: 1400, totalQueries: 5 },
            results: [{time: 1390}, {time: 1400}, {time: 1410}, {time: 1395}, {time: 1405}]
          },
          {
            lists: 100,
            statistics: { avgTime: 1200, totalQueries: 5 },
            results: [{time: 1100}, {time: 1300}, {time: 1150}, {time: 1250}, {time: 1200}]
          }
        ];
        const summary = generateSummary(results);
        const stabilityRec = summary.recommendations.find(r => r.type === 'stabilité');
        expect(stabilityRec).toBeDefined();
        // 50 a un écart-type plus faible que 100
        expect(stabilityRec.configuration).toBe(50);
      });
      
      test('GREEN: doit générer une recommandation compromis', () => {
        const results = [
          {
            lists: 200,
            statistics: { avgTime: 1100, totalQueries: 5 },
            results: [{time: 1100}, {time: 1100}, {time: 1100}, {time: 1100}, {time: 1100}]
          }
        ];
        const summary = generateSummary(results);
        const compromiseRec = summary.recommendations.find(r => r.type === 'compromis');
        expect(compromiseRec).toBeDefined();
        expect(compromiseRec.configuration).toBe(200);
      });
    });
  });
  
  describe('G3-CR-007: Alignement entre G1 et G3', () => {
    test('GREEN: la configuration recommandée doit être cohérente avec G1 (200)', () => {
      // Simuler les résultats qui devraient donner 200 comme meilleur
      const results = [
        {
          lists: 50,
          statistics: { avgTime: 1400, totalQueries: 5 },
          results: [{time: 1400}, {time: 1400}, {time: 1400}, {time: 1400}, {time: 1400}]
        },
        {
          lists: 100,
          statistics: { avgTime: 1200, totalQueries: 5 },
          results: [{time: 1200}, {time: 1200}, {time: 1200}, {time: 1200}, {time: 1200}]
        },
        {
          lists: 200,
          statistics: { avgTime: 1100, totalQueries: 5 },
          results: [{time: 1100}, {time: 1100}, {time: 1100}, {time: 1100}, {time: 1100}]
        },
        {
          lists: 400,
          statistics: { avgTime: 1300, totalQueries: 5 },
          results: [{time: 1300}, {time: 1300}, {time: 1300}, {time: 1300}, {time: 1300}]
        }
      ];
      const summary = generateSummary(results);
      // Avec ces données, 200 est la plus rapide (1100ms)
      expect(summary.bestConfiguration.lists).toBe(200);
    });
  });
});
