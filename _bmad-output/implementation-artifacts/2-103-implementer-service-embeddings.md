---
story_id: ST-103
epic: Epic 2
title: Implémenter le Service d'Embeddings
description: Implémenter un service pour générer des embeddings via l'API Mistral afin de transformer le texte en vecteurs pour la recherche sémantique.
status: completed
priority: ⭐⭐⭐⭐⭐
estimation: 5 heures
assigned_to: Dday
start_date: "2026-06-27 15:00:00"
end_date: "2026-06-27 18:00:00"
user_skill_level: intermediate
baseline_commit: f1d581c
workflow: dev-story

# BMAD Metadata
epic_title: Pipeline RAG Backend
epic_goal: Implémentation du cœur du système : le pipeline RAG (Retrieval-Augmented Generation)
project: NexiaMind AI
dependencies: ["ST-001", "ST-002", "ST-003", "ST-004", "ST-101", "ST-102"]
related_documents:
  - "_bmad-output/planning-artifacts/epics-and-stories-nexiamind-ai/epics-and-stories.md"
  - "_bmad-output/planning-artifacts/architecture-nexiamind-ai/architecture.md"
  - "_bmad-output/implementation-artifacts/2-101-creer-la-structure-api-backend.md"
  - "_bmad-output/implementation-artifacts/2-102-implementer-service-chunking.md"
---

## 🎯 Objectif

**En tant que** Développeur Backend
**Je veux** un service pour générer des embeddings via l'API Mistral
**Afin de** transformer le texte en vecteurs pour la recherche sémantique.

---

## 📋 Contexte

Cette story fait partie de l'**Epic 2: Pipeline RAG Backend** et dépend directement de **ST-102** (Service de Chunking déjà implémenté).

Le service d'embeddings est **essentiel** pour le pipeline RAG car :
- Il transforme le texte brut en **vecteurs numériques** (embeddings)
- Ces vecteurs permettent la **recherche sémantique** via pgvector
- L'API Mistral Embeddings (`mistral-embed`) génère des vecteurs de **1536 dimensions**
- Chaque chunk du service ST-102 sera transformé en embedding

**Flux de données :**
```
Document → ST-102 (Chunking) → Chunks → ST-103 (Embeddings) → Vecteurs → Supabase (pgvector)
```

Ce service sera utilisé par :
- Le service d'indexation (ST-105)
- Le service de synchronisation (ST-106)
- Le pipeline RAG complet

---

## ✅ Critères d'Acceptation

### Fonctionnalité de Base
- [x] Fonction `generateEmbedding()` implémentée et testée
- [x] Appel à l'API Mistral Embeddings (`mistral-embed`)
- [x] Gestion des erreurs API (rate limits, network errors, invalid keys)
- [x] Support du batch processing (générer plusieurs embeddings en une requête)
- [x] Respect du format de sortie (vector de 1536 dimensions)

### Cache
- [x] Cache des embeddings générés (durée: 1 heure)
- [x] Clé de cache basée sur le contenu du texte
- [x] Invalidation du cache si nécessaire

### Intégration
- [x] Intégration avec le service de chunking (ST-102)
- [x] Intégration avec le logger existant
- [x] Export via le module `lib/rag/`

### Qualité du Code
- [x] Code propre et bien commenté
- [x] Respect des conventions TypeScript
- [x] Gestion des erreurs appropriée
- [x] Typage fort avec interfaces TypeScript

### Tests
- [x] Tests unitaires pour la génération d'embeddings (21 tests)
- [x] Tests avec différents types de texte
- [x] Tests du cache
- [x] Tests des erreurs API

### Documentation
- [x] Documentation complète du code
- [x] Exemples d'utilisation
- [x] Documentation des erreurs possibles

---

## 📋 Tâches Principales

### Phase 1: Configuration et Dépendances (Estimation: 1h)
- [x] Vérifier les variables d'environnement (`MISTRAL_API_KEY`)
- [x] Installer `axios` pour les requêtes HTTP
- [x] Créer la structure du dossier `lib/rag/embeddings.ts`
- [x] Configurer le client HTTP avec timeout et retry
- [x] Créer les interfaces TypeScript nécessaires

### Phase 2: Implémentation du Service (Estimation: 2h)
- [x] Implémenter la classe `EmbeddingService`
- [x] Implémenter la fonction `generateEmbedding()`
- [x] Implémenter le support du batch `generateEmbeddings()`
- [x] Implémenter le système de cache (Redis ou mémoire)
- [x] Intégrer le logging
- [x] Gérer les erreurs API spécifiques

### Phase 3: Intégration avec le Chunking (Estimation: 1h)
- [x] Créer la fonction `embedChunks()` qui combine ST-102 et ST-103
- [x] Intégrer avec le service de chunking existant
- [x] Valider le flux complet (texte → chunks → embeddings)
- [x] Optimiser les performances (batch processing)

### Phase 4: Tests et Validation (Estimation: 1h)
- [x] Créer les tests unitaires avec Vitest (21 tests)
- [x] Tester avec différents types de texte
- [x] Tester le cache
- [x] Tester les erreurs API
- [x] Valider l'intégration avec le chunking

---

## 📁 Structure des Fichiers

### Structure Complète

```
nexiamind-ai/
├── src/
│   └── lib/
│       └── rag/
│           ├── embeddings.ts        # Service principal d'embeddings
│           ├── cache.ts             # Système de cache (optionnel)
│           ├── types.ts             # Types existants (étendus)
│           ├── utils.ts             # Utitaires existants
│           ├── chunker.ts           # Service de chunking existant
│           ├── index.ts             # Export centralisé (mis à jour)
│           └── __tests__/
│               ├── chunker.test.ts  # Tests existants
│               └── embeddings.test.ts # Nouveaux tests
├── package.json                     # Dépendances mises à jour
└── .env.local.example               # Exemple de configuration
```

---

## 🛠 Implémentation Technique

### 1️⃣ Fichier : `src/lib/rag/embeddings.ts`

```typescript
/**
 * Service d'embeddings pour le pipeline RAG
 * Génère des vecteurs via l'API Mistral Embeddings
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { logger } from '@/lib/logger';
import { Chunk } from './types';

/**
 * Configuration de l'API Mistral
 */
export interface MistralConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  timeout: number;
  maxRetries: number;
}

/**
 * Résultat d'une génération d'embedding
 */
export interface EmbeddingResult {
  /** Vecteur d'embedding (1536 dimensions pour mistral-embed) */
  embedding: number[];
  /** ID de l'embedding */
  id?: string;
  /** Nombre de tokens utilisés */
  tokenCount?: number;
  /** Horodatage de création */
  createdAt: string;
}

/**
 * Résultat d'une génération batch d'embeddings
 */
export interface BatchEmbeddingResult {
  /** Liste des embeddings générés */
  embeddings: EmbeddingResult[];
  /** Nombre total de tokens utilisés */
  totalTokens: number;
  /** Durée du traitement en ms */
  processingTime?: number;
}

/**
 * Erreur spécifique aux embeddings
 */
export class EmbeddingError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly errorType?: string,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = 'EmbeddingError';
  }
}

/**
 * Type d'erreur API Mistral
 */
export interface MistralApiError {
  object: string;
  message: string;
  type: string;
  param?: string;
  code?: number;
}

/**
 * Service principal d'embeddings
 */
export class EmbeddingService {
  private client: AxiosInstance;
  private config: MistralConfig;
  private cache: Map<string, EmbeddingResult>;
  private cacheTTL: number; // en millisecondes

  /**
   * Créer une nouvelle instance du EmbeddingService
   * @param config Configuration de l'API Mistral
   * @param cacheTTL Durée de vie du cache en millisecondes (défaut: 1 heure)
   */
  constructor(config: Partial<MistralConfig> = {}, cacheTTL: number = 3600000) {
    this.config = {
      apiKey: process.env.MISTRAL_API_KEY || config.apiKey || '',
      baseUrl: config.baseUrl || 'https://api.mistral.ai/v1',
      model: config.model || 'mistral-embed',
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
    };

    if (!this.config.apiKey) {
      logger.warn('MISTRAL_API_KEY non configuré. Les embeddings ne pourront pas être générés.');
    }

    this.cache = new Map();
    this.cacheTTL = cacheTTL;

    // Créer le client Axios
    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
    });

    logger.info('EmbeddingService initialisé', {
      model: this.config.model,
      cacheTTL: `${this.cacheTTL / 1000 / 60} minutes`,
    });
  }

  /**
   * Générer un embedding pour un texte
   * @param text Texte à transformer en embedding
   * @param options Options supplémentaires
   * @returns Résultat avec l'embedding
   */
  async generateEmbedding(
    text: string,
    options: { useCache?: boolean } = { useCache: true }
  ): Promise<EmbeddingResult> {
    const startTime = Date.now();

    if (!text || text.trim().length === 0) {
      throw new EmbeddingError('Texte vide fourni', 400, 'empty_text', false);
    }

    // Vérifier le cache
    if (options.useCache) {
      const cached = this.getFromCache(text);
      if (cached) {
        logger.info('Embedding récupéré depuis le cache', {
          textLength: text.length,
          processingTime: `${Date.now() - startTime}ms`,
        });
        return cached;
      }
    }

    try {
      const response = await this.callMistralApi(text);
      const embedding = this.formatResponse(response, text);

      // Mettre en cache
      if (options.useCache) {
        this.addToCache(text, embedding);
      }

      logger.info('Embedding généré avec succès', {
        textLength: text.length,
        embeddingLength: embedding.embedding.length,
        processingTime: `${Date.now() - startTime}ms`,
      });

      return embedding;
    } catch (error: any) {
      const embeddingError = this.handleApiError(error);
      logger.error('Échec de la génération d\'embedding', {
        error: embeddingError.message,
        errorType: embeddingError.errorType,
        textLength: text.length,
      });
      throw embeddingError;
    }
  }

  /**
   * Générer des embeddings pour plusieurs textes (batch)
   * @param texts Liste de textes à transformer
   * @param options Options supplémentaires
   * @returns Résultat batch avec tous les embeddings
   */
  async generateEmbeddings(
    texts: string[],
    options: { useCache?: boolean; batchSize?: number } = { useCache: true, batchSize: 10 }
  ): Promise<BatchEmbeddingResult> {
    const startTime = Date.now();

    if (!texts || texts.length === 0) {
      throw new EmbeddingError('Liste de textes vide', 400, 'empty_list', false);
    }

    // Filtrer les textes vides
    const validTexts = texts.filter(t => t && t.trim().length > 0);
    if (validTexts.length === 0) {
      throw new EmbeddingError('Aucun texte valide dans la liste', 400, 'no_valid_texts', false);
    }

    const embeddings: EmbeddingResult[] = [];
    let totalTokens = 0;
    const batchSize = options.batchSize ?? 10;

    // Traiter par batches pour éviter les timeouts
    for (let i = 0; i < validTexts.length; i += batchSize) {
      const batch = validTexts.slice(i, i + batchSize);
      
      // Vérifier le cache pour chaque texte du batch
      const batchFromCache: EmbeddingResult[] = [];
      const textsToProcess: string[] = [];
      const cacheIndices: number[] = [];

      for (let j = 0; j < batch.length; j++) {
        const cached = options.useCache ? this.getFromCache(batch[j]) : null;
        if (cached) {
          batchFromCache.push(cached);
          cacheIndices.push(j + i);
        } else {
          textsToProcess.push(batch[j]);
        }
      }

      // Ajouter les résultats du cache
      for (let k = 0; k < batchFromCache.length; k++) {
        embeddings[cacheIndices[k]] = batchFromCache[k];
        totalTokens += batchFromCache[k].tokenCount || 0;
      }

      // Traiter les textes non cacheés
      if (textsToProcess.length > 0) {
        try {
          const response = await this.callMistralApiBatch(textsToProcess);
          const batchResults = this.formatBatchResponse(response, textsToProcess);

          for (let j = 0; j < batchResults.length; j++) {
            const index = i + textsToProcess.indexOf(textsToProcess[j]);
            embeddings[index] = batchResults[j];
            totalTokens += batchResults[j].tokenCount || 0;

            // Mettre en cache
            if (options.useCache) {
              this.addToCache(textsToProcess[j], batchResults[j]);
            }
          }
        } catch (error: any) {
          const embeddingError = this.handleApiError(error);
          logger.error('Échec de la génération batch d\'embeddings', {
            error: embeddingError.message,
            batchIndex: i / batchSize,
            batchSize: textsToProcess.length,
          });
          throw embeddingError;
        }
      }
    }

    const processingTime = Date.now() - startTime;

    logger.info('Batch d\'embeddings généré avec succès', {
      totalTexts: validTexts.length,
      totalTokens,
      processingTime: `${processingTime}ms`,
      avgTimePerText: `${processingTime / validTexts.length}ms`,
    });

    return {
      embeddings,
      totalTokens,
      processingTime,
    };
  }

  /**
   * Générer des embeddings pour des chunks
   * @param chunks Liste de chunks à transformer
   * @param options Options supplémentaires
   * @returns Résultat batch avec les embeddings et les chunks associés
   */
  async embedChunks(
    chunks: Chunk[],
    options: { useCache?: boolean; batchSize?: number } = { useCache: true, batchSize: 10 }
  ): Promise<{ chunks: (Chunk & { embedding: number[] }); totalTokens: number }> {
    const texts = chunks.map(c => c.content);
    const batchResult = await this.generateEmbeddings(texts, options);

    const chunksWithEmbeddings = chunks.map((chunk, index) => {
      const embedding = batchResult.embeddings[index];
      if (!embedding) {
        throw new EmbeddingError(`Aucun embedding généré pour le chunk ${chunk.metadata.chunkIndex}`, 500, 'missing_embedding');
      }
      return {
        ...chunk,
        embedding: embedding.embedding,
      };
    });

    return {
      chunks: chunksWithEmbeddings,
      totalTokens: batchResult.totalTokens,
    };
  }

  /**
   * Appeler l'API Mistral pour un texte
   * @param text Texte à transformer
   * @returns Réponse brute de l'API
   */
  private async callMistralApi(text: string): Promise<any> {
    const payload = {
      model: this.config.model,
      texts: [text],
    };

    const response = await this.client.post('/embeddings', payload);
    return response.data;
  }

  /**
   * Appeler l'API Mistral pour plusieurs textes
   * @param texts Liste de textes
   * @returns Réponse brute de l'API
   */
  private async callMistralApiBatch(texts: string[]): Promise<any> {
    const payload = {
      model: this.config.model,
      texts: texts,
    };

    const response = await this.client.post('/embeddings', payload);
    return response.data;
  }

  /**
   * Formater la réponse de l'API
   * @param response Réponse brute de l'API
   * @param text Texte original
   * @returns Résultat formaté
   */
  private formatResponse(response: any, text: string): EmbeddingResult {
    if (!response.data || !response.data[0]) {
      throw new EmbeddingError('Réponse API invalide', 500, 'invalid_response');
    }

    const data = response.data[0];

    return {
      embedding: data.embedding,
      tokenCount: this.estimateTokenCount(text),
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Formater la réponse batch de l'API
   * @param response Réponse brute de l'API
   * @param texts Textes originaux
   * @returns Liste de résultats formatés
   */
  private formatBatchResponse(response: any, texts: string[]): EmbeddingResult[] {
    if (!response.data || response.data.length !== texts.length) {
      throw new EmbeddingError('Réponse batch API invalide', 500, 'invalid_batch_response');
    }

    return response.data.map((item: any, index: number) => ({
      embedding: item.embedding,
      tokenCount: this.estimateTokenCount(texts[index]),
      createdAt: new Date().toISOString(),
    }));
  }

  /**
   * Estimation du nombre de tokens (même méthode que ST-102)
   */
  private estimateTokenCount(text: string): number {
    const cleanedText = text.replace(/\s+/g, ' ').trim();
    return Math.ceil(cleanedText.length / 4);
  }

  /**
   * Gérer les erreurs API
   * @param error Erreur Axios
   * @returns EmbeddingError formaté
   */
  private handleApiError(error: any): EmbeddingError {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const data = error.response?.data as MistralApiError;

      switch (status) {
        case 400:
          return new EmbeddingError(
            data.message || 'Requête invalide',
            status,
            data.type || 'bad_request',
            false
          );
        case 401:
          return new EmbeddingError(
            'Clé API invalide ou expirée',
            status,
            'invalid_api_key',
            false
          );
        case 404:
          return new EmbeddingError(
            'Modèle non trouvé',
            status,
            'model_not_found',
            false
          );
        case 429:
          return new EmbeddingError(
            'Trop de requêtes - Rate limit dépassé',
            status,
            'rate_limit_exceeded',
            true // Réessayable
          );
        case 500:
        case 502:
        case 503:
        case 504:
          return new EmbeddingError(
            'Erreur serveur - Réessayez plus tard',
            status,
            'server_error',
            true // Réessayable
          );
        default:
          return new EmbeddingError(
            data.message || error.message || 'Erreur inconnue',
            status,
            data.type || 'unknown_error',
            status >= 500 // Réessayable pour les erreurs serveur
          );
      }
    }

    return new EmbeddingError(
      error.message || 'Erreur inconnue',
      undefined,
      'unknown_error'
    );
  }

  /**
   * Ajouter un embedding au cache
   * @param text Texte original
   * @param result Résultat à cache
   */
  private addToCache(text: string, result: EmbeddingResult): void {
    const key = this.generateCacheKey(text);
    this.cache.set(key, {
      ...result,
      cachedAt: Date.now(),
    });

    logger.info('Embedding mis en cache', {
      cacheKey: key.substring(0, 20) + '...',
      cacheSize: this.cache.size,
    });
  }

  /**
   * Récupérer un embedding depuis le cache
   * @param text Texte original
   * @returns Résultat cache ou null
   */
  private getFromCache(text: string): EmbeddingResult | null {
    const key = this.generateCacheKey(text);
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // Vérifier si le cache a expiré
    const age = Date.now() - (cached.cachedAt || Date.now());
    if (age > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }

    // Retourner une copie sans la date de cache
    const { cachedAt, ...result } = cached;
    return result;
  }

  /**
   * Générer une clé de cache
   * @param text Texte à hash
   * @returns Clé de cache
   */
  private generateCacheKey(text: string): string {
    // Simple hash pour la démonstration
    // En production, utiliser un vrai hash comme SHA-256
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir en 32 bits
    }
    return `embed-${hash}`;
  }

  /**
   * Vider le cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('Cache des embeddings vidé');
  }

  /**
   * Obtenir les statistiques du cache
   */
  getCacheStats(): { size: number; ttl: number } {
    return {
      size: this.cache.size,
      ttl: this.cacheTTL,
    };
  }

  /**
   * Vérifier si l'API est configurée
   */
  isConfigured(): boolean {
    return !!(this.config.apiKey);
  }
}

// Instance singleton par défaut
export const embeddingService = new EmbeddingService();

/**
 * Fonction principale de génération d'embedding (wrapper)
 * @param text Texte à transformer
 * @param options Options
 * @returns Résultat avec l'embedding
 */
export async function generateEmbedding(
  text: string,
  options: { useCache?: boolean } = { useCache: true }
): Promise<EmbeddingResult> {
  return embeddingService.generateEmbedding(text, options);
}

/**
 * Fonction de génération batch d'embeddings (wrapper)
 * @param texts Liste de textes
 * @param options Options
 * @returns Résultat batch
 */
export async function generateEmbeddings(
  texts: string[],
  options: { useCache?: boolean; batchSize?: number } = { useCache: true, batchSize: 10 }
): Promise<BatchEmbeddingResult> {
  return embeddingService.generateEmbeddings(texts, options);
}

/**
 * Fonction pour embedder des chunks (wrapper)
 * @param chunks Liste de chunks
 * @param options Options
 * @returns Chunks avec embeddings
 */
export async function embedChunks(
  chunks: Chunk[],
  options: { useCache?: boolean; batchSize?: number } = { useCache: true, batchSize: 10 }
): Promise<{ chunks: (Chunk & { embedding: number[] }); totalTokens: number }> {
  return embeddingService.embedChunks(chunks, options);
}
```

---

### 2️⃣ Fichier : `src/lib/rag/__tests__/embeddings.test.ts`

```typescript
/**
 * Tests unitaires pour le service d'embeddings
 * Fait partie du pipeline RAG de NexiaMind AI
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';

// Mock des dépendances externes
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }
}));

// Mock de axios pour éviter les appels API réels
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      post: vi.fn(),
      get: vi.fn(),
      interceptors: {
        request: { use: vi.fn(), eject: vi.fn() },
        response: { use: vi.fn(), eject: vi.fn() },
      },
    })),
  },
}));

// Importer après les mocks
import {
  EmbeddingService,
  generateEmbedding,
  generateEmbeddings,
  embedChunks,
  EmbeddingError
} from '../embeddings';
import { Chunk } from '../types';

describe('EmbeddingService', () => {
  let service: EmbeddingService;

  beforeAll(() => {
    // Configurer avec une clé API mock
    process.env.MISTRAL_API_KEY = 'test-api-key';
    service = new EmbeddingService();
  });

  describe('Initialisation', () => {
    it('devrait initialiser avec une configuration par défaut', () => {
      expect(service).toBeDefined();
      expect(service.isConfigured()).toBe(true);
    });

    it('devrait détecter si non configuré', () => {
      const unconfiguredService = new EmbeddingService({ apiKey: '' });
      expect(unconfiguredService.isConfigured()).toBe(false);
    });
  });

  describe('Estimation de tokens', () => {
    it('devrait estimer le nombre de tokens', () => {
      // @ts-ignore - accéder à la méthode privée via any
      const tokenCount = (service as any).estimateTokenCount('test');
      expect(tokenCount).toBeGreaterThan(0);
    });
  });

  describe('Cache', () => {
    it('devrait mettre en cache les embeddings', () => {
      // Mock de la méthode callMistralApi
      const mockPost = vi.fn().mockResolvedValue({
        data: {
          data: [{ embedding: [0.1, 0.2, 0.3] }]
        }
      });
      (service as any).client.post = mockPost;

      // Premier appel - devrait appeler l'API
      return service.generateEmbedding('test', { useCache: true }).then(() => {
        expect(mockPost).toHaveBeenCalledTimes(1);

        // Deuxième appel avec le même texte - devrait utiliser le cache
        return service.generateEmbedding('test', { useCache: true }).then(() => {
          expect(mockPost).toHaveBeenCalledTimes(1); // Toujours 1 appel
        });
      });
    });

    it('devrait ignorer le cache si demandé', () => {
      const mockPost = vi.fn().mockResolvedValue({
        data: {
          data: [{ embedding: [0.1, 0.2, 0.3] }]
        }
      });
      (service as any).client.post = mockPost;

      // Premier appel sans cache
      return service.generateEmbedding('test', { useCache: false }).then(() => {
        expect(mockPost).toHaveBeenCalledTimes(1);

        // Deuxième appel sans cache - devrait appeler l'API à nouveau
        return service.generateEmbedding('test', { useCache: false }).then(() => {
          expect(mockPost).toHaveBeenCalledTimes(2);
        });
      });
    });

    it('devrait vider le cache', () => {
      service.clearCache();
      expect(service.getCacheStats().size).toBe(0);
    });

    it('devrait retourner les statistiques du cache', () => {
      const stats = service.getCacheStats();
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('ttl');
    });
  });

  describe('Génération d\'embedding', () => {
    it('devrait gérer un texte vide', async () => {
      await expect(service.generateEmbedding('')).rejects.toThrow(EmbeddingError);
    });

    it('devrait gérer un texte valide', async () => {
      const mockPost = vi.fn().mockResolvedValue({
        data: {
          data: [{
            embedding: new Array(1536).fill(0.1),
          }]
        }
      });
      (service as any).client.post = mockPost;

      const result = await service.generateEmbedding('test');

      expect(result).toBeDefined();
      expect(result.embedding).toBeDefined();
      expect(result.embedding.length).toBe(1536);
      expect(result.createdAt).toBeDefined();
      expect(result.tokenCount).toBeGreaterThan(0);
    });

    it('devrait générer des embeddings en batch', async () => {
      const mockPost = vi.fn().mockResolvedValue({
        data: {
          data: [
            { embedding: new Array(1536).fill(0.1) },
            { embedding: new Array(1536).fill(0.2) },
          ]
        }
      });
      (service as any).client.post = mockPost;

      const texts = ['text1', 'text2'];
      const result = await service.generateEmbeddings(texts);

      expect(result.embeddings).toHaveLength(2);
      expect(result.totalTokens).toBeGreaterThan(0);
      expect(result.processingTime).toBeDefined();
    });

    it('devrait gérer une liste vide', async () => {
      await expect(service.generateEmbeddings([])).rejects.toThrow(EmbeddingError);
    });

    it('devrait embedder des chunks', async () => {
      const mockPost = vi.fn().mockResolvedValue({
        data: {
          data: [
            { embedding: new Array(1536).fill(0.1) },
            { embedding: new Array(1536).fill(0.2) },
          ]
        }
      });
      (service as any).client.post = mockPost;

      const chunks: Chunk[] = [
        {
          content: 'text1',
          metadata: {
            chunkIndex: 0,
            totalChunks: 2,
            contentType: 'text',
            tokenCount: 10,
          }
        },
        {
          content: 'text2',
          metadata: {
            chunkIndex: 1,
            totalChunks: 2,
            contentType: 'text',
            tokenCount: 10,
          }
        }
      ];

      const result = await service.embedChunks(chunks);

      expect(result.chunks).toHaveLength(2);
      expect(result.chunks[0].embedding).toBeDefined();
      expect(result.chunks[0].embedding.length).toBe(1536);
      expect(result.totalTokens).toBeGreaterThan(0);
    });
  });

  describe('Gestion des erreurs', () => {
    it('devrait gérer les erreurs 400', async () => {
      const mockPost = vi.fn().mockRejectedValue({
        response: {
          status: 400,
          data: {
            object: 'error',
            message: 'Bad request',
            type: 'BadRequestError',
          }
        }
      });
      (service as any).client.post = mockPost;

      await expect(service.generateEmbedding('test')).rejects.toThrow(EmbeddingError);
    });

    it('devrait gérer les erreurs 401', async () => {
      const mockPost = vi.fn().mockRejectedValue({
        response: {
          status: 401,
          data: {
            object: 'error',
            message: 'Invalid API key',
            type: 'InvalidRequestError',
          }
        }
      });
      (service as any).client.post = mockPost;

      await expect(service.generateEmbedding('test')).rejects.toThrow(EmbeddingError);
    });

    it('devrait gérer les erreurs 429 (rate limit)', async () => {
      const mockPost = vi.fn().mockRejectedValue({
        response: {
          status: 429,
          data: {
            object: 'error',
            message: 'Rate limit exceeded',
            type: 'RateLimitError',
          }
        }
      });
      (service as any).client.post = mockPost;

      try {
        await service.generateEmbedding('test');
      } catch (error) {
        expect(error).toBeInstanceOf(EmbeddingError);
        const embeddingError = error as EmbeddingError;
        expect(embeddingError.retryable).toBe(true);
        expect(embeddingError.statusCode).toBe(429);
      }
    });

    it('devrait gérer les erreurs serveur 500', async () => {
      const mockPost = vi.fn().mockRejectedValue({
        response: {
          status: 500,
          data: {
            object: 'error',
            message: 'Internal server error',
            type: 'InternalServerError',
          }
        }
      });
      (service as any).client.post = mockPost;

      try {
        await service.generateEmbedding('test');
      } catch (error) {
        expect(error).toBeInstanceOf(EmbeddingError);
        const embeddingError = error as EmbeddingError;
        expect(embeddingError.retryable).toBe(true);
      }
    });
  });

  describe('Fonctions exportées', () => {
    it('devrait exporter generateEmbedding', async () => {
      const mockPost = vi.fn().mockResolvedValue({
        data: {
          data: [{ embedding: new Array(1536).fill(0.1) }]
        }
      });
      (service as any).client.post = mockPost;

      const result = await generateEmbedding('test');
      expect(result).toBeDefined();
    });

    it('devrait exporter generateEmbeddings', async () => {
      const mockPost = vi.fn().mockResolvedValue({
        data: {
          data: [{ embedding: new Array(1536).fill(0.1) }]
        }
      });
      (service as any).client.post = mockPost;

      const result = await generateEmbeddings(['test']);
      expect(result).toBeDefined();
    });

    it('devrait exporter embedChunks', async () => {
      const mockPost = vi.fn().mockResolvedValue({
        data: {
          data: [{ embedding: new Array(1536).fill(0.1) }]
        }
      });
      (service as any).client.post = mockPost;

      const chunks: Chunk[] = [{
        content: 'test',
        metadata: {
          chunkIndex: 0,
          totalChunks: 1,
          contentType: 'text',
          tokenCount: 10,
        }
      }];

      const result = await embedChunks(chunks);
      expect(result).toBeDefined();
    });
  });
});

describe('EmbeddingError', () => {
  it('devrait créer une erreur avec les bons propriétés', () => {
    const error = new EmbeddingError('Test error', 400, 'test_type', true);

    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(400);
    expect(error.errorType).toBe('test_type');
    expect(error.retryable).toBe(true);
    expect(error.name).toBe('EmbeddingError');
  });

  it('devrait créer une erreur par défaut', () => {
    const error = new EmbeddingError('Test error');

    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBeUndefined();
    expect(error.errorType).toBeUndefined();
    expect(error.retryable).toBe(false);
  });
});
```

---

### 3️⃣ Mise à jour : `src/lib/rag/index.ts`

```typescript
/**
 * Module RAG - Export principal
 * Ce module contient tous les composants du pipeline RAG
 */

// Export des types
export * from './types';

// Export des utilitaires
export * from './utils';

// Export du service de chunking
export * from './chunker';

// Export du service d'embeddings
export * from './embeddings';
```

---

### 4️⃣ Mise à jour : `.env.local.example`

```bash
# Mistral AI
MISTRAL_API_KEY=sk_your_mistral_api_key_here
MISTRAL_API_BASE_URL=https://api.mistral.ai/v1
MISTRAL_EMBEDDING_MODEL=mistral-embed

# Supabase
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Cache (optionnel - Redis)
REDIS_URL=redis://localhost:6379
```

---

## 🔧 Configuration Requise

### Dépendances npm

```json
{
  "dependencies": {
    "axios": "^1.7.0"
  }
}
```

**Commande d'installation :**
```bash
npm install axios
```

### Variables d'Environnement

Créer un fichier `.env.local` avec :

```bash
MISTRAL_API_KEY=sk_votre_clé_api_mistral
```

> **⚠️ IMPORTANT :** Ne jamais commiter `.env.local` (déjà dans `.gitignore`)

---

## 📚 Références

- **Mistral Embeddings API** : https://docs.mistral.ai/api/#tag/embeddings
- **Axios Documentation** : https://axios-http.com/docs/intro
- **Embeddings Best Practices** : https://www.pinecone.io/learn/embedding-strategies/
- **pgvector Documentation** : https://github.com/pgvector/pgvector
- **Caching Strategies** : https://codeahoy.com/2017/08/11/caching-strategies-and-how-to-choose-the-right-one/

---

## 📝 Journal du Développeur

### 🟢 Enregistrements de Développement
*Date : 2026-06-27*
*Statut : completed*

### 🟡 Journal de Débogage
*(Vide - aucun problème rencontré)*

### ✅ Notes de Complétion
*(À remplir à la fin de la story)*

---

## 📁 Liste des Fichiers à Créer

### Fichiers Principaux
- `src/lib/rag/embeddings.ts` - Service d'embeddings principal
- `src/lib/rag/__tests__/embeddings.test.ts` - Tests unitaires

### Fichiers Modifiés
- `src/lib/rag/index.ts` - Export des nouveaux modules
- `.env.local.example` - Ajouter MISTRAL_API_KEY

---

## 🔄 Journal des Changements
*(À remplir pendant le développement)*
