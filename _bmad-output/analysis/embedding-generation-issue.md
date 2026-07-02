# Analyse du Problème de Génération d'Embeddings

**Date**: 2026-07-01
**Problème**: Échec de la génération d'embeddings lors de l'indexation Supabase
**Fichiers Concernés**: `src/lib/rag/embeddings.ts`, `src/lib/supabase/storage/indexer.ts`

## Symptômes

D'après les logs fournis, le problème se manifeste par:

```
2026-07-01 22:40:01 info: Génération de l'embedding pour le chunk 0
2026-07-01 22:40:01 error: Échec de la génération batch d'embeddings [object Object]
2026-07-01 22:40:01 error: Échec du traitement du chunk 0 pour Mon-1.pdf
```

## Causes Probables

### 1. Problème d'API Mistral

**Indications:**
- Le message `[object Object]` suggère une erreur non correctement formatée
- L'échec se produit lors de l'appel à `generateEmbeddings`
- Les chunks sont sauvegardés avec succès, mais l'embedding échoue

**Vérifications nécessaires:**
- La clé API Mistral est-elle correctement configurée ?
- L'URL de l'API est-elle correcte ?
- Le modèle spécifié existe-t-il ?
- Y a-t-il des problèmes de quota ou de rate limiting ?

### 2. Problème de Configuration

**Vérifications nécessaires:**
- Vérifier que `process.env.MISTRAL_API_KEY` est défini
- Vérifier que l'URL de base est correcte (`https://api.mistral.ai/v1`)
- Vérifier que le modèle `mistral-embed` est disponible

### 3. Problème de Gestion d'Erreur

**Problèmes identifiés:**
- La méthode `handleApiError` ne gérait pas correctement les erreurs non-Axios
- Les messages d'erreur n'étaient pas suffisamment détaillés
- Le logging des erreurs API n'était pas complet

## Corrections Apportées

### 1. Amélioration de la Gestion d'Erreur

**Dans `src/lib/rag/embeddings.ts`:**

```typescript
// Avant
return new EmbeddingError(
  error instanceof Error ? error.message : 'Erreur inconnue',
  undefined,
  'unknown_error'
);

// Après
let errorMessage = 'Erreur inconnue';
if (error instanceof Error) {
  errorMessage = error.message;
} else if (typeof error === 'string') {
  errorMessage = error;
} else if (error && typeof error === 'object') {
  try {
    errorMessage = JSON.stringify(error);
  } catch (e) {
    errorMessage = String(error);
  }
}

return new EmbeddingError(
  errorMessage,
  undefined,
  'unknown_error'
);
```

### 2. Ajout de Logging Détaillé pour les Appels API

```typescript
// Dans callMistralApi
try {
  const response = await this.client.post('/embeddings', payload);
  logger.info('Appel API Mistral réussi', {
    textLength: text.length,
    status: response.status,
  });
  return response.data;
} catch (error) {
  logger.error('Échec de l\'appel API Mistral', {
    textLength: text.length,
    error: error instanceof Error ? error.message : String(error),
  });
  throw error;
}

// Dans callMistralApiBatch
try {
  const response = await this.client.post('/embeddings', payload);
  logger.info('Appel API Mistral batch réussi', {
    batchSize: texts.length,
    status: response.status,
  });
  return response.data;
} catch (error) {
  logger.error('Échec de l\'appel API Mistral batch', {
    batchSize: texts.length,
    error: error instanceof Error ? error.message : String(error),
  });
  throw error;
}
```

### 3. Vérification de la Configuration

**À vérifier dans l'environnement:**

```bash
# Vérifier que la clé API est définie
echo $MISTRAL_API_KEY

# Vérifier que l'URL est correcte
echo "URL: https://api.mistral.ai/v1"

# Vérifier que le modèle existe
# (nécessite un appel API de test)
```

## Procédure de Débogage

### 1. Vérifier la Configuration

```typescript
// Dans le code, vérifier que le service est bien configuré
const service = new EmbeddingService();
console.log('Service configuré:', service.isConfigured());
console.log('Clé API:', !!process.env.MISTRAL_API_KEY);
console.log('Configuration:', {
  baseUrl: service['config'].baseUrl,
  model: service['config'].model,
  timeout: service['config'].timeout,
});
```

### 2. Tester l'API Mistral Indépendamment

```typescript
// Test direct de l'API
async function testMistralApi() {
  const axios = require('axios');
  
  const client = axios.create({
    baseURL: 'https://api.mistral.ai/v1',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
    },
  });

  try {
    const response = await client.post('/embeddings', {
      model: 'mistral-embed',
      texts: ['test'],
    });
    
    console.log('API Test réussie:', {
      status: response.status,
      data: response.data,
    });
    return true;
  } catch (error) {
    console.error('API Test échouée:', {
      error: error instanceof Error ? error.message : String(error),
      response: error.response?.data,
      status: error.response?.status,
    });
    return false;
  }
}

// Exécuter le test
testMistralApi().then(success => {
  console.log('Test API:', success ? 'SUCCESS' : 'FAILED');
  process.exit(success ? 0 : 1);
});
```

### 3. Vérifier les Logs

```bash
# Voir les logs en temps réel
tail -f logs/combined.log

# Filtrer les erreurs
grep -i "erreur\|error" logs/combined.log

# Voir les appels API
grep -i "mistral\|embedding" logs/combined.log
```

### 4. Tester avec un Fichier Simple

```bash
# Lancer l'indexation avec un seul fichier en mode dry-run
npx ts-node scripts/index-supabase.ts \
  --prefix="Mon-1.pdf" \
  --limit=1 \
  --dry-run
```

## Solutions Possibles

### 1. Vérifier la Clé API

```bash
# Vérifier que la clé est définie
echo "MISTRAL_API_KEY=$MISTRAL_API_KEY"

# Si elle n'est pas définie, la configurer
export MISTRAL_API_KEY="votre_clé_api_mistral"
```

### 2. Vérifier le Modèle

```typescript
// Essayer avec un modèle différent
const service = new EmbeddingService({
  model: 'mistral-tiny', // ou un autre modèle disponible
});
```

### 3. Augmenter le Timeout

```typescript
// Dans la configuration
const service = new EmbeddingService({
  timeout: 60000, // 60 secondes au lieu de 30
});
```

### 4. Vérifier les Quotas

- Vérifier le tableau de bord Mistral pour les quotas
- Vérifier que le compte n'a pas atteint la limite de requêtes
- Contacter le support Mistral si nécessaire

### 5. Tester avec des Données Plus Courtes

```typescript
// Dans le code de test, essayer avec des chunks plus courts
const shortText = "Ceci est un test court.";
const result = await embeddingService.generateEmbedding(shortText);
```

## Recommandations

### 1. Améliorer le Logging

Ajouter plus de détails dans les logs:
- Durée des appels API
- Taille des payloads
- Statut des réponses
- Détails complets des erreurs

### 2. Ajouter des Métriques

Suivre les métriques clés:
- Nombre d'appels API réussis/échoués
- Temps moyen de réponse
- Taille moyenne des embeddings
- Nombre de tokens par requête

### 3. Implémenter des Retries

Ajouter une logique de retry pour les erreurs temporaires:

```typescript
async function callMistralWithRetry(text: string, maxRetries = 3): Promise<unknown> {
  let lastError: unknown;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await this.callMistralApi(text);
    } catch (error) {
      lastError = error;
      const embeddingError = this.handleApiError(error);
      
      if (embeddingError.retryable && attempt < maxRetries) {
        const delay = Math.min(1000 * 2 ** attempt, 5000); // Exponential backoff
        logger.warn(`Tentative ${attempt}/${maxRetries} échouée, retry dans ${delay}ms`, {
          error: embeddingError.message,
        });
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw embeddingError;
    }
  }
  
  throw this.handleApiError(lastError);
}
```

### 4. Ajouter un Circuit Breaker

Protéger contre les échecs en cascade:

```typescript
class EmbeddingServiceWithCircuitBreaker {
  private circuitState: 'closed' | 'open' | 'half-open' = 'closed';
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly failureThreshold = 3;
  private readonly resetTimeout = 30000; // 30 secondes
  
  async generateEmbeddingWithCircuitBreaker(text: string): Promise<EmbeddingResult> {
    if (this.circuitState === 'open') {
      const timeSinceFailure = Date.now() - this.lastFailureTime;
      if (timeSinceFailure < this.resetTimeout) {
        throw new EmbeddingError(
          'Circuit ouvert - trop d\'échecs récents',
          429,
          'circuit_open',
          false
        );
      }
      // Passer en half-open pour tester
      this.circuitState = 'half-open';
    }
    
    try {
      const result = await this.generateEmbedding(text);
      // Réinitialiser le circuit si half-open
      if (this.circuitState === 'half-open') {
        this.circuitState = 'closed';
        this.failureCount = 0;
      }
      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();
      
      if (this.failureCount >= this.failureThreshold) {
        this.circuitState = 'open';
      }
      
      throw error;
    }
  }
}
```

### 5. Implémenter un Fallback

Avoir une stratégie de fallback pour les échecs:

```typescript
async function generateEmbeddingWithFallback(text: string): Promise<EmbeddingResult> {
  try {
    return await embeddingService.generateEmbedding(text);
  } catch (error) {
    logger.warn('Embedding principal échoué, utilisation du fallback', {
      error: error instanceof Error ? error.message : String(error),
    });
    
    // Option 1: Utiliser un cache local si disponible
    const cached = embeddingService.getFromCache(text);
    if (cached) return cached;
    
    // Option 2: Utiliser un modèle local (si disponible)
    // return localEmbeddingModel.generate(text);
    
    // Option 3: Générer un embedding factice pour le développement
    if (process.env.NODE_ENV === 'development') {
      return {
        embedding: Array(384).fill(0.1), // Embedding factice
        tokenCount: this.estimateTokenCount(text),
        createdAt: new Date().toISOString(),
      };
    }
    
    // Ré-émettre l'erreur si aucun fallback n'est disponible
    throw error;
  }
}
```

## Conclusion

Le problème de génération d'embeddings semble être lié à des échecs d'appel API vers Mistral. Les corrections apportées améliorent la gestion d'erreur et le logging, mais la cause racine doit être identifiée parmi:

1. **Problème de configuration** (clé API, URL, modèle)
2. **Problème de quota** (limite de requêtes atteinte)
3. **Problème réseau** (connexion, timeout)
4. **Problème de données** (textes trop longs ou format invalide)

**Prochaines étapes recommandées:**
1. Tester l'API Mistral indépendamment avec un script simple
2. Vérifier la configuration et les variables d'environnement
3. Examiner les logs détaillés pour identifier la cause exacte
4. Implémenter les améliorations suggérées (retries, circuit breaker, fallback)
5. Contacter le support Mistral si le problème persiste