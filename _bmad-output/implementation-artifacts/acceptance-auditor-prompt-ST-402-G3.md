# Acceptance Auditor - Prompt de Revue (ST-402, Groupe 3)

## Contexte
**Rôle:** Acceptance Auditor (auditeur d'acceptation)
**Mission:** Vérifier que le code du Groupe 3 satisfait TOUS les Critères d'Acceptation (AC) définis dans la story ST-402.
**Accès:** Vous avez accès au diff, au spec file de la story, et aux contraintes architecturales.

---

## Story Context (OBLIGATOIRE)

### Spec File: `_bmad-output/implementation-artifacts/5-402-optimiser-l-index-vectoriel.md`

**Tâche 2 - Créer le script de benchmark:**
- Créer un script Node.js qui teste différentes configurations d'index vectoriel
- Le script doit mesurer le temps de réponse pour différentes valeurs du paramètre `lists`
- Le script doit tester au moins 4 configurations différentes: 50, 100, 200, 400
- Le script doit exécuter plusieurs itérations pour chaque configuration
- Le script doit générer un rapport JSON avec les résultats

**Critères d'Acceptation (AC) pour ST-402:**
- **AC1:** Index IVFFlat configuré avec le bon nombre de listes (justifié par benchmark)
- **AC2:** Test de performance avec différents paramètres (lists = 50, 100, 200, 400)
- **AC3:** Temps de réponse < 3s (moyen pour la configuration optimale)
- **AC4:** Documentation des choix d'optimisation

**Contraintes Architecturales:**
- Dimension vectorielle FIXÉE à 384 (leçon de ST-401)
- Utiliser IVFFlat avec vector_l2_ops
- Ne PAS désactiver RLS
- Ne PAS recréer la table

---

## Diff à Analyser (Groupe 3 - Scripts de Benchmark)

### Fichiers:
1. **`scripts/benchmark/benchmark-vector-index.js`** (435 lignes)
2. **`scripts/benchmark/benchmark-vector-index.mock.js`** (252 lignes)
3. **`scripts/benchmark/package.json`** (22 lignes)
4. **`scripts/benchmark/vector-index-benchmark-report.json`** (214 lignes, GENERATED)
5. **`scripts/benchmark/vector-index-benchmark.log`** (62 lignes, GENERATED)

### Extraits clés de benchmark-vector-index.js:

```javascript
// Configuration (lignes 20-26)
const BENCHMARK_CONFIG = {
  listConfigurations: [50, 100, 200, 400],      // ✅ AC2: 4 configs
  testIterations: 5,
  queryLimit: 10,
  warmupQueries: 3,
};

// Création d'index (lignes 70-99)
async function createIndexWithConfig(client, lists) {
  const indexName = `idx_embeddings_vector_bench_${lists}`;
  
  // Supprimer index existant
  const { error: dropError } = await client.rpc('drop_index_if_exists', { index_name: indexName })
    .catch(() => ({ error: null }));
  
  // Créer nouvel index
  const { data, error } = await client.rpc('create_ivfflat_index', {
    table_name: 'embeddings',
    column_name: 'vector',
    index_name: indexName,
    lists: lists
  }).catch(() => ({ data: null, error: { message: 'RPC non disponible' } }));
  
  if (error) {
    log(`❌ Erreur lors de la création de l'index: ${error.message}`, {}, 'red');
    throw error;
  }
  
  return indexName;
}

// Requête de benchmark (lignes 104-130)
async function runBenchmarkQuery(client, indexName, iteration) {
  const startTime = Date.now();
  
  // Générer un embedding de test (vecteur aléatoire de 384 dimensions)
  const testVector = Array.from({ length: 384 }, () => Math.random() * 2 - 1);
  
  // Exécuter la requête avec opérateur L2
  const { data, error } = await client
    .from('embeddings')
    .select('chunk_id, vector <=> array[' + testVector.map((v, i) => `'${v}'`).join(',') + '] as distance')
    .order('distance', { ascending: true })
    .limit(BENCHMARK_CONFIG.queryLimit);
  
  const endTime = Date.now();
  const queryTime = endTime - startTime;  // ✅ Mesure de performance
  
  if (error) {
    return { success: false, time: null, error: error.message, results: 0 };
  }
  
  return { success: true, time: queryTime, results: data ? data.length : 0 };
}

// Génération du résumé (lignes 256-332)
function generateSummary(results) {
  const summary = {
    totalConfigurations: results.length,
    successfulConfigurations: 0,
    failedConfigurations: 0,
    bestConfiguration: null,
    recommendations: []
  };
  
  const successfulResults = results.filter(r => !r.error && r.statistics.totalQueries > 0);
  summary.successfulConfigurations = successfulResults.length;
  summary.failedConfigurations = results.length - successfulResults.length;
  
  if (successfulResults.length > 0) {
    const sortedBySpeed = [...successfulResults].sort((a, b) => a.statistics.avgTime - b.statistics.avgTime);
    summary.bestConfiguration = {
      lists: sortedBySpeed[0].lists,
      avgTime: sortedBySpeed[0].statistics.avgTime,
      description: 'Configuration la plus rapide'
    };
    
    // Recommandations: vitesse, stabilité, compromis, critère < 3s
    summary.recommendations.push({ type: 'vitesse', ... });
    summary.recommendations.push({ type: 'stabilité', ... });
    summary.recommendations.push({ type: 'compromis', ... });
    
    // ✅ AC3: Vérification du critère < 3s
    const fastEnough = successfulResults.find(r => r.statistics.avgTime < 3000);
    if (fastEnough) {
      summary.recommendations.push({
        type: 'critère',
        configuration: fastEnough.lists,
        avgTime: fastEnough.statistics.avgTime,
        description: 'Respecte le critère < 3s'
      });
    }
  }
  
  return summary;
}
```

### Extraits de benchmark-vector-index.mock.js:

```javascript
// Génération de résultats MOCK (lignes 35-75)
function generateMockBenchmarkResults() {
  const results = [];
  
  for (const lists of BENCHMARK_CONFIG.listConfigurations) {
    const baseTime = 1500 - (lists * 2);  // Plus lists = plus rapide (inverse de la réalité)
    
    const resultTimes = [];
    for (let i = 0; i < BENCHMARK_CONFIG.testIterations; i++) {
      const variation = 1 + (Math.random() * 0.2 - 0.1);
      resultTimes.push(Math.max(100, Math.round(baseTime * variation)));
    }
    
    // ... calcul des statistiques
    results.push({ lists, indexName, results: resultTimes.map(...), statistics: {...} });
  }
  
  return results;
}
```

### Fichiers générés (artefacts):
```json
// vector-index-benchmark-report.json
{
  "benchmarkDate": "2026-07-12T15:17:26.859Z",
  "configuration": { "listConfigurations": [50, 100, 200, 400], ... },
  "environment": { "mock": true },
  "results": [
    { "lists": 50, "statistics": { "avgTime": 1386.2 } },
    { "lists": 100, "statistics": { "avgTime": 1264 } },
    { "lists": 200, "statistics": { "avgTime": 1118.4 } },
    { "lists": 400, "statistics": { "avgTime": 680.4 } }
  ],
  "summary": {
    "bestConfiguration": { "lists": 400, "avgTime": 680.4 },
    "recommendations": [
      { "type": "vitesse", "configuration": 400, "avgTime": 680.4 },
      { "type": "stabilité", "configuration": 400, ... },
      { "type": "compromis", "configuration": 400, ... },
      { "type": "critère", "configuration": 50, "avgTime": 1386.2, "description": "Respecte le critère < 3s" }
    ]
  }
}
```

---

## 🎯 Mapping AC → Code

### AC2: Test de performance avec différents paramètres
**Exigence:** Tester avec différentes valeurs de `lists`
**Implémentation:**
- ✅ `BENCHMARK_CONFIG.listConfigurations = [50, 100, 200, 400]` (ligne 22)
- ✅ Boucle `for (const lists of BENCHMARK_CONFIG.listConfigurations)` (ligne 225)
- ✅ `benchmarkConfiguration(client, lists)` appelé pour chaque (ligne 227)

**Questions:**
1. Les 4 configurations sont-elles testées ?
2. Les résultats sont-ils mesurés et enregistrés ?
3. Le test couvre-t-il AC2 complètement ?

### AC3: Temps de réponse < 3s
**Exigence:** La configuration optimale doit avoir un temps de réponse moyen < 3000ms
**Implémentation:**
- ✅ `const startTime = Date.now();` (ligne 105)
- ✅ `const queryTime = endTime - startTime;` (ligne 118)
- ✅ `statistics.avgTime` calculé (ligne 186)
- ✅ Vérification `r.statistics.avgTime < 3000` (ligne 320)

**Questions:**
1. La mesure du temps est-elle correcte ?
2. La vérification < 3s est-elle implémentée ?
3. Les résultats MOCK respectent-ils ce critère ?

### AC1: Index IVFFlat configuré avec le bon nombre de listes (justifié par benchmark)
**Exigence:** La valeur de `lists` doit être justifiée par les résultats de benchmark
**Implémentation:**
- ✅ `summary.bestConfiguration` identifie la meilleure config (ligne 273-277)
- ✅ Recommandations basées sur vitesse, stabilité, compromis (lignes 286-317)

**Questions:**
1. La configuration optimale est-elle clairement identifiée ?
2. Les recommandations sont-elles basées sur des données mesurées ?
3. Le rapport documente-t-il suffisamment pour justifier le choix ?

---

## 📋 Checklist de Vérification

### Pour AC2 (Test de performance avec différents paramètres):
- [ ] Le script teste au moins 4 configurations différentes
- [ ] Les configurations incluent 50, 100, 200, 400
- [ ] Chaque configuration est testée avec plusieurs itérations
- [ ] Les résultats sont mesurés (temps de réponse)
- [ ] Les résultats sont enregistrés dans un rapport
- [ ] Le rapport contient suffisamment d'informations pour comparer les configurations

### Pour AC3 (Temps de réponse < 3s):
- [ ] Le temps de chaque requête est mesuré
- [ ] Le temps moyen par configuration est calculé
- [ ] Il existe une vérification explicite que le temps < 3000ms
- [ ] Les résultats montrent qu'au moins une configuration respecte ce critère
- [ ] La configuration optimale a un temps < 3s

### Pour la qualité du code:
- [ ] Le code gère correctement les erreurs
- [ ] Les dépendances (RPC) existent ou sont créées
- [ ] Les artefacts générés ne sont pas commités
- [ ] Les tests (si présents) couvrent les AC

---

## 📝 Instructions de Sortie

### Format du Rapport:

```markdown
# Acceptance Auditor — Résultats (ST-402, Groupe 3)

*Vérification du diff contre les Acceptance Criteria de ST-402.*

---

## AC par AC

### AC2: Test de performance avec différents paramètres

**Verdict:** [✅ SATISFAIT / ⚠️ PARTIEL / ❌ NON SATISFAIT]

**Preuve:** [Citer le code qui satisfait l'AC]

**Gaps identifiés:** [Lister ce qui manque]

**Sévérité:** [CRITIQUE / HAUTE / MOYENNE / FAIBLE]

---

### AC3: Temps de réponse < 3s

**Verdict:** [✅ SATISFAIT / ⚠️ PARTIEL / ❌ NON SATISFAIT]

**Preuve:** [Citer le code qui mesure et vérifie le temps]

**Gaps identifiés:** [Lister ce qui manque]

**Sévérité:** [CRITIQUE / HAUTE / MOYENNE / FAIBLE]

---

### AC1: Justification par benchmark (lien avec Groupe 3)

**Verdict:** [✅ SATISFAIT / ⚠️ PARTIEL / ❌ NON SATISFAIT]

**Preuve:** [Citer comment les résultats justifient la valeur de lists]

**Gaps identifiés:** [Lister ce qui manque]

**Sévérité:** [CRITIQUE / HAUTE / MOYENNE / FAIBLE]

---

## Problèmes de Conformité aux Standards

| Standard | Verdict | Constat |
|----------|---------|---------|
| Cycle RED/GREEN/Refactor | [✅/⚠️/❌] | [Commentaire] |
| Tests MOCK sans BDD | [✅/⚠️/❌] | [Commentaire] |
| Framework Jest | [✅/⚠️/❌] | [Commentaire] |

---

## Résumé Final

| AC | Statut | Preuve | Blocage |
|----|--------|--------|---------|
| AC1 (justifié par benchmark) | [✅/⚠️/❌] | [Preuve] | [Oui/Non] |
| AC2 (test multi-config) | [✅/⚠️/❌] | [Preuve] | [Oui/Non] |
| AC3 (temps < 3s) | [✅/⚠️/❌] | [Preuve] | [Oui/Non] |

**Conclusion:** [Le Groupe 3 peut/ne peut pas être accepté. Expliquer pourquoi.]
```

---

## 🎯 Questions Spécifiques à Répondre

1. **AC2 est-il complètement satisfait par le code du Groupe 3 ?**
   - Le script teste-t-il les 4 configurations requises ?
   - Les résultats sont-ils suffisamment documentés ?

2. **AC3 est-il satisfait ?**
   - Le temps est-il mesuré correctement ?
   - La vérification < 3s est-elle implémentée ?
   - Les résultats montrent-ils des temps < 3s ?

3. **Les artefacts générés posent-ils problème ?**
   - Les fichiers JSON et LOG sont-ils dans .gitignore ?
   - Les données sont-elles réelles ou MOCK ?

4. **La logique de benchmark est-elle correcte ?**
   - La baseTime dans le MOCK est-elle réaliste ? (1500 - lists*2 semble contre-intuitif)
   - Les recommandations sont-elles basées sur des critères clairs ?

5. **Y a-t-il des problèmes avec les RPC ?**
   - `drop_index_if_exists` et `create_ivfflat_index` existent-elles ?
   - Que se passe-t-il si elles n'existent pas ?

---

## ⚡ Règles Acceptance Auditor

1. **Être précis** : Chaque verdict doit être justifié par une preuve du code
2. **Vérifier chaque AC** : Aucun AC ne doit être oublié
3. **Identifier les gaps** : Même si l'AC est partiellement satisfait, lister ce qui manque
4. **Prioriser les blocages** : Identifier ce qui empêche l'acceptation
5. **Proposer des solutions** : Pour chaque gap, suggérer comment le corriger

**Commencez votre analyse maintenant.**
