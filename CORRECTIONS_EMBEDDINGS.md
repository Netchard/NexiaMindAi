# Corrections apportées au service d'Embeddings

## Problème rapporté
Le service d'embeddings retournait une erreur d'API key alors que la clé était correcte.

## Cause racine identifiée
Le problème principal était dans le **format du payload** envoyé à l'API Mistral Embeddings.

### Problèmes spécifiques

1. **Payload incorrect pour un seul texte** (ligne 317 de `embeddings.ts`)
   - ❌ Avant: `{ model: "mistral-embed", texts: [text] }`
   - ✅ Après: `{ model: "mistral-embed", input: [text] }`
   - **L'API Mistral Embeddings attend le paramètre `input`, pas `texts`**

2. **Incohérence entre les méthodes**
   - `callMistralApi` utilisait `texts: [text]` ❌
   - `callMistralApiBatch` utilisait `input: texts` ✅
   - Maintenue: les deux utilisent `input` ✅

3. **Incohérence dans les chemins d'URL**
   - `callMistralApi` utilisait `'embeddings'` (sans slash)
   - `callMistralApiBatch` utilisait `'/embeddings'` (avec slash)
   - Maintenue: les deux utilisent `'/embeddings'` ✅

4. **Test incorrect** (ligne 78-79 de `embeddings.test.ts`)
   - Le test essayait de créer un service avec `apiKey: ''` et appelait `isConfigured()`
   - Problème: Le constructeur lève une exception avant, donc `isConfigured()` ne pouvait jamais être appelé
   - Correction: Le test vérifie maintenant que la création lève bien une `EmbeddingError`

## Fichiers modifiés

### 1. `src/lib/rag/embeddings.ts`
```diff
-     texts: [text],
+     input: [text],

-     logger.info(`Appel 1 API Mistral ${this.client.name}`);
+     logger.info(`Appel API Mistral Embeddings`);

-     const response = await this.client.post('embeddings', payload);
+     const response = await this.client.post('/embeddings', payload);

-     logger.info(`Appel 2 API Mistral ${this.client.name}`);
+     logger.info(`Appel API Mistral Embeddings (batch)`);
```

### 2. `src/lib/rag/__tests__/embeddings.test.ts`
```diff
-     const unconfiguredService = new EmbeddingService({ apiKey: '' });
-     expect(unconfiguredService.isConfigured()).toBe(false);
+     // Vérifier que la création d'un service sans clé lève une erreur
+     expect(() => new EmbeddingService({ apiKey: '' })).toThrow(EmbeddingError);
+     expect(() => new EmbeddingService()).toThrow(EmbeddingError);
```

## Vérification des corrections

### 1. Tests unitaires
```bash
npm test -- embeddings.test.ts
# Résultat: ✅ 21 tests passed
```

### 2. Tests de diagnostic
```bash
npm test -- embeddings.diagnostic.test.ts
# Résultat: Confirme que le payload utilise maintenant "input" au lieu de "texts"
```

## Si le problème persiste

Si vous obtenez toujours une erreur d'API key après ces corrections, vérifiez :

### 1. **La clé API est-elle bien chargée ?**
```typescript
console.log('MISTRAL_API_KEY:', process.env.MISTRAL_API_KEY);
```

### 2. **La clé est-elle valide ?**
- Vérifiez que votre clé n'a pas expiré
- Essayez votre clé directement avec curl :
```bash
curl -X POST "https://api.mistral.ai/v1/embeddings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_CLE" \
  -d '{"model": "mistral-embed", "input": ["test"]}'
```

### 3. **L'URL est-elle correcte ?**
- URL par défaut : `https://api.mistral.ai/v1/`
- Si vous êtes dans une autre région : `https://api.mistral.ai/v1/` (EU) ou selon votre configuration

### 4. **Le modèle existe-t-il ?**
- Modèle par défaut : `mistral-embed`
- Alternatives : `mistral-embed-768`, etc.

### 5. **Problèmes de réseau ?**
- Vérifiez votre connexion internet
- Vérifiez que vous n'êtes pas derrière un proxy/firewall qui bloque les requêtes

## Script de test en direct

Un script de test est disponible dans : `src/lib/rag/__tests__/test-embeddings-live.ts`

Pour l'utiliser :
```bash
# Définissez votre clé
EXPORT MISTRAL_API_KEY="votre_clé_api"

# Exécutez le script
npx ts-node src/lib/rag/__tests__/test-embeddings-live.ts
```

Ce script vous donnera un diagnostic complet de votre configuration.
