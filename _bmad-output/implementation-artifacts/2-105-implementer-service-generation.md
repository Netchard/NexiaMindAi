---
story_id: ST-105
epic: Epic 2
title: Implémenter le Service de Génération
description: Implémenter un service pour générer des réponses via l'API Mistral Chat avec le contexte récupéré afin de produire des réponses pertinentes et contextuelles dans le pipeline RAG.
status: pending
priority: ⭐⭐⭐⭐⭐
estimation: 8 heures
assigned_to: Dday
start_date: ""
end_date: ""
user_skill_level: intermediate
baseline_commit: febf491
workflow: dev-story

# BMAD Metadata

epic_title: Pipeline RAG Backend
epic_goal: Implémentation du cœur du système : le pipeline RAG (Retrieval-Augmented Generation)
project: NexiaMind AI
dependencies: ["ST-001", "ST-002", "ST-003", "ST-004", "ST-101", "ST-102", "ST-103"]
related_documents:
  - "_bmad-output/planning-artifacts/epics-and-stories-nexiamind-ai/epics-and-stories.md"
  - "_bmad-output/planning-artifacts/architecture-nexiamind-ai/architecture.md"
  - "_bmad-output/implementation-artifacts/2-101-creer-la-structure-api-backend.md"
  - "_bmad-output/implementation-artifacts/2-102-implementer-service-chunking.md"
  - "_bmad-output/implementation-artifacts/2-103-implementer-service-embeddings.md"
---

## 🎯 Objectif

**En tant que** Développeur Backend
**Je veux** un service pour générer des réponses via l'API Mistral Chat avec le contexte récupéré
**Afin de** produire des réponses pertinentes et contextuelles.

---

## 📋 Contexte

Cette story fait partie de l'**Epic 2: Pipeline RAG Backend** et dépend directement de **ST-102** (Service de Chunking) et **ST-103** (Service d'Embeddings).

Le service de génération est **le cœur du pipeline RAG** car :
- Il combine le contexte récupéré (chunks + embeddings) avec la requête utilisateur
- Il construit des prompts optimisés pour l'API Mistral Chat
- Il adapte les réponses selon le rôle et le contexte de l'utilisateur
- Il gère le streaming des réponses pour une meilleure UX

**Flux de données complet :**
```
Requête Utilisateur → Recherche (ST-104) → Contexte (Chunks) → ST-105 (Génération) → Réponse → Utilisateur
```

Ce service sera utilisé par :
- L'API de chat (`/api/chat/message`)
- Le service de conversation
- Le pipeline RAG complet

---

## ✅ Critères d'Acceptation

### Fonctionnalité de Base
- [ ] Fonction `generateResponse()` implémentée et testée
- [ ] Construction du prompt avec le contexte récupéré
- [ ] Appel à l'API Mistral Chat (`mistral-small`, `mistral-medium`)
- [ ] Adaptation du prompt selon le rôle utilisateur
- [ ] Gestion des erreurs API (rate limits, network errors, invalid keys)
- [ ] Support du streaming des réponses
- [ ] Respect du format de sortie (markdown, citations)

### Contexte et RAG
- [ ] Intégration avec le service de recherche (ST-104)
- [ ] Construction du contexte à partir des chunks récupérés
- [ ] Limitation du nombre de tokens du contexte
- [ ] Priorisation des chunks par pertinence

### Prompts
- [ ] Prompts système configurables par rôle
- [ ] Prompt template personnalisable
- [ ] Injection du contexte dans le prompt
- [ ] Gestion des variables de template

### Streaming
- [ ] Support du streaming Server-Sent Events (SSE)
- [ ] Gestion des chunks de streaming
- [ ] Annulation du streaming
- [ ] Timeout du streaming

### Qualité du Code
- [ ] Code propre et bien commenté
- [ ] Respect des conventions TypeScript
- [ ] Gestion des erreurs appropriée
- [ ] Typage fort avec interfaces TypeScript

### Tests
- [ ] Tests unitaires pour la génération de réponses
- [ ] Tests avec différents contextes
- [ ] Tests des prompts par rôle
- [ ] Tests du streaming
- [ ] Tests des erreurs API

### Documentation
- [ ] Documentation complète du code
- [ ] Exemples d'utilisation
- [ ] Documentation des erreurs possibles

---

## 📋 Tâches Principales

### Phase 1: Configuration et Dépendances (Estimation: 1h)
- [ ] Vérifier les variables d'environnement (`MISTRAL_API_KEY`)
- [ ] Installer les dépendances nécessaires (déjà axios installé)
- [ ] Créer la structure du dossier `lib/rag/generator.ts`
- [ ] Configurer le client HTTP avec timeout et retry
- [ ] Créer les interfaces TypeScript nécessaires

### Phase 2: Implémentation du Service (Estimation: 3h)
- [ ] Implémenter la classe `ResponseGenerator`
- [ ] Implémenter la fonction `generateResponse()`
- [ ] Implémenter le système de prompts (templates par rôle)
- [ ] Implémenter la construction du contexte
- [ ] Implémenter le support du streaming (SSE)
- [ ] Intégrer le logging
- [ ] Gérer les erreurs API spécifiques

### Phase 3: Intégration avec le Pipeline (Estimation: 2h)
- [ ] Intégrer avec le service de recherche (ST-104)
- [ ] Intégrer avec le service de chunking (ST-102)
- [ ] Valider le flux complet (requête → contexte → réponse)
- [ ] Optimiser les performances

### Phase 4: Tests et Validation (Estimation: 2h)
- [ ] Créer les tests unitaires avec Vitest
- [ ] Tester avec différents contextes
- [ ] Tester les prompts par rôle
- [ ] Tester le streaming
- [ ] Tester les erreurs API
- [ ] Valider l'intégration avec la recherche

---

## 📁 Structure des Fichiers

### Structure Complète

```
nexiamind-ai/
├── src/
│   └── lib/
│       └── rag/
│           ├── generator.ts        # Service principal de génération
│           ├── prompts.ts           # Templates de prompts par rôle
│           ├── types.ts             # Types existants (étendus)
│           ├── chunker.ts           # Service de chunking existant
│           ├── embeddings.ts        # Service d'embeddings existant
│           ├── index.ts             # Export centralisé (mis à jour)
│           └── __tests__/
│               ├── generator.test.ts # Nouveaux tests
│               ├── chunker.test.ts   # Tests existants
│               └── embeddings.test.ts # Tests existants
├── package.json                     # Dépendances (déjà axios)
└── .env.local.example               # Configuration mise à jour
```

---

## 🛠 Implémentation Technique

### 1️⃣ Fichier : `src/lib/rag/prompts.ts`

```typescript
/**
 * Templates de prompts pour le service de génération
 * Fait partie du pipeline RAG de NexiaMind AI
 */

/**
 * Rôle utilisateur pour l'adaptation des prompts
 */
export type UserRole = 'admin' | 'developer' | 'analyst' | 'user' | 'guest';

/**
 * Template de prompt avec variables
 */
export interface PromptTemplate {
  /** Rôle système (ex: 'system', 'assistant') */
  role: string;
  /** Contenu du template avec variables entre {curly braces} */
  content: string;
  /** Variables disponibles dans ce template */
  variables?: string[];
}

/**
 * Configuration des prompts par rôle
 */
export interface RolePrompts {
  /** Prompt système principal */
  system: PromptTemplate;
  /** Prompt utilisateur */
  user?: PromptTemplate;
  /** Prompt assistant */
  assistant?: PromptTemplate;
}

/**
 * Prompts système par défaut
 */
export const DEFAULT_PROMPTS: Record<UserRole, RolePrompts> = {
  admin: {
    system: {
      role: 'system',
      content: `Tu es un assistant IA expert pour NexiaMind. 
Tu as accès à une base de connaissances interne. 
Réponds aux questions avec précision et professionnalisme. 
Si tu ne connais pas la réponse, dis-le clairement. 

Contexte : {context}
Rôle utilisateur : {userRole}
Instructions supplémentaires : {instructions}`,
      variables: ['context', 'userRole', 'instructions'],
    },
  },
  developer: {
    system: {
      role: 'system',
      content: `Tu es un assistant technique pour les développeurs. 
Fournis des réponses techniques précises avec des exemples de code. 
Explique les concepts complexes de manière claire. 

Contexte technique : {context}
Langage préféré : {language}
Niveau technique : {level}`,
      variables: ['context', 'language', 'level'],
    },
  },
  analyst: {
    system: {
      role: 'system',
      content: `Tu es un analyste de données pour NexiaMind. 
Analyse les informations fournies et fournis des insights actionnables. 
Utilise un format structuré (bullet points, tableaux). 

Données contextuelles : {context}
Objectif d'analyse : {objective}`,
      variables: ['context', 'objective'],
    },
  },
  user: {
    system: {
      role: 'system',
      content: `Tu es un assistant IA général pour NexiaMind. 
Réponds de manière claire et utile aux questions des utilisateurs. 
Utilise le contexte fourni pour enrichir tes réponses. 

Contexte : {context}`,
      variables: ['context'],
    },
  },
  guest: {
    system: {
      role: 'system',
      content: `Tu es un assistant IA pour les visiteurs. 
Réponds aux questions générales sur NexiaMind. 
Ne divulgue pas d'informations sensibles. 

Contexte public : {context}`,
      variables: ['context'],
    },
  },
};

/**
 * Remplacer les variables dans un template
 * @param template Template avec variables
 * @param variables Objet de variables
 * @returns Template avec variables remplacées
 */
export function replacePromptVariables(template: string, variables: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, variable) => {
    return variables[variable] !== undefined ? variables[variable] : match;
  });
}

/**
 * Obtenir les prompts pour un rôle spécifique
 * @param role Rôle de l'utilisateur
 * @returns Prompts configurés pour ce rôle
 */
export function getPromptsForRole(role: UserRole): RolePrompts {
  return DEFAULT_PROMPTS[role] || DEFAULT_PROMPTS.user;
}

/**
 * Construire le prompt complet pour la génération
 * @param query Requête utilisateur
 * @param context Contexte (chunks formatés)
 * @param userRole Rôle de l'utilisateur
 * @param additionalVars Variables supplémentaires
 * @returns Messages formatés pour l'API Mistral Chat
 */
export function buildPrompt(
  query: string,
  context: string,
  userRole: UserRole = 'user',
  additionalVars: Record<string, string> = {}
): Array<{ role: string; content: string }> {
  const prompts = getPromptsForRole(userRole);
  
  // Remplacer les variables dans le template système
  const systemVariables = {
    context,
    userRole,
    instructions: '',
    objective: '',
    language: 'TypeScript',
    level: 'intermediate',
    ...additionalVars,
  };
  
  const systemPrompt = replacePromptVariables(prompts.system.content, systemVariables);
  
  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: query },
  ];
}
```

---

### 2️⃣ Fichier : `src/lib/rag/generator.ts`

```typescript
/**
 * Service de génération de réponses pour le pipeline RAG
 * Génère des réponses contextuelles via l'API Mistral Chat
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { logger } from '@/lib/logger';
import { Chunk } from './types';
import { UserRole, buildPrompt, PromptTemplate } from './prompts';

/**
 * Configuration de l'API Mistral Chat
 */
export interface MistralChatConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  timeout: number;
  maxRetries: number;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

/**
 * Message de chat pour l'API Mistral
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Résultat de la génération de réponse
 */
export interface GenerationResult {
  /** Réponse générée */
  response: string;
  /** Nombre de tokens utilisés */
  tokenCount?: number;
  /** Horodatage de création */
  createdAt: string;
  /** ID de la conversation (optionnel) */
  conversationId?: string;
  /** Rôle de l'utilisateur */
  userRole?: UserRole;
  /** Chunks utilisés pour le contexte */
  contextChunks?: number;
  /** Durée de génération en ms */
  generationTime?: number;
}

/**
 * Résultat du streaming (chunk)
 */
export interface StreamingChunk {
  /** Contenu du chunk */
  content: string;
  /** Fin du stream */
  done: boolean;
  /** ID du chunk */
  id?: string;
  /** Rôle (pour le premier chunk) */
  role?: string;
}

/**
 * Erreur spécifique à la génération
 */
export class GenerationError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly errorType?: string,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = 'GenerationError';
  }
}

/**
 * Service principal de génération de réponses
 */
export class ResponseGenerator {
  private client: AxiosInstance;
  private config: MistralChatConfig;

  /**
   * Créer une nouvelle instance du ResponseGenerator
   * @param config Configuration de l'API Mistral
   */
  constructor(config: Partial<MistralChatConfig> = {}) {
    this.config = {
      apiKey: process.env.MISTRAL_API_KEY || config.apiKey || '',
      baseUrl: config.baseUrl || 'https://api.mistral.ai/v1',
      model: config.model || 'mistral-small',
      timeout: config.timeout || 60000,
      maxRetries: config.maxRetries || 3,
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 2048,
      topP: config.topP || 0.9,
    };

    if (!this.config.apiKey) {
      logger.warn('MISTRAL_API_KEY non configuré. La génération ne pourra pas fonctionner.');
    }

    // Créer le client Axios
    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
    });

    logger.info('ResponseGenerator initialisé', {
      model: this.config.model,
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
    });
  }

  /**
   * Générer une réponse à une requête avec contexte
   * @param query Requête utilisateur
   * @param contextChunks Chunks de contexte (optionnel)
   * @param options Options de génération
   * @returns Résultat avec la réponse générée
   */
  async generateResponse(
    query: string,
    contextChunks: Chunk[] = [],
    options: {
      userRole?: UserRole;
      conversationId?: string;
      stream?: boolean;
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<GenerationResult> {
    const startTime = Date.now();

    if (!query || query.trim().length === 0) {
      throw new GenerationError('Requête vide fournie', 400, 'empty_query', false);
    }

    if (!this.config.apiKey) {
      throw new GenerationError(
        'Clé API Mistral non configurée',
        500,
        'api_not_configured',
        false
      );
    }

    // Construire le contexte à partir des chunks
    const context = this.buildContextFromChunks(contextChunks);

    // Construire le prompt
    const messages = buildPrompt(
      query,
      context,
      options.userRole || 'user',
      {
        conversationId: options.conversationId || '',
      }
    );

    // Appeler l'API Mistral Chat
    const response = await this.callMistralChatApi(messages, {
      temperature: options.temperature || this.config.temperature,
      maxTokens: options.maxTokens || this.config.maxTokens,
      topP: this.config.topP,
    });

    const generationTime = Date.now() - startTime;

    logger.info('Réponse générée avec succès', {
      queryLength: query.length,
      contextChunks: contextChunks.length,
      responseLength: response.choices[0].message.content.length,
      generationTime: `${generationTime}ms`,
    });

    return {
      response: response.choices[0].message.content,
      tokenCount: response.usage?.total_tokens,
      createdAt: new Date().toISOString(),
      conversationId: options.conversationId,
      userRole: options.userRole,
      contextChunks: contextChunks.length,
      generationTime,
    };
  }

  /**
   * Générer une réponse en streaming (SSE)
   * @param query Requête utilisateur
   * @param contextChunks Chunks de contexte
   * @param options Options de génération
   * @returns Générateur asynchrone de chunks
   */
  async *streamResponse(
    query: string,
    contextChunks: Chunk[] = [],
    options: {
      userRole?: UserRole;
      conversationId?: string;
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): AsyncGenerator<StreamingChunk> {
    if (!query || query.trim().length === 0) {
      throw new GenerationError('Requête vide fournie', 400, 'empty_query', false);
    }

    if (!this.config.apiKey) {
      throw new GenerationError(
        'Clé API Mistral non configurée',
        500,
        'api_not_configured',
        false
      );
    }

    // Construire le contexte et le prompt
    const context = this.buildContextFromChunks(contextChunks);
    const messages = buildPrompt(
      query,
      context,
      options.userRole || 'user',
      {
        conversationId: options.conversationId || '',
      }
    );

    // Configuration du streaming
    const payload = {
      model: this.config.model,
      messages,
      stream: true,
      temperature: options.temperature || this.config.temperature,
      max_tokens: options.maxTokens || this.config.maxTokens,
      top_p: this.config.topP,
    };

    // Appeler l'API en streaming
    const response = await this.client.post('/chat/completions', payload, {
      responseType: 'stream',
    });

    let firstChunk = true;
    let chunkId: string | undefined;
    
    for await (const chunk of response.data) {
      // Parser le chunk SSE
      const data = this.parseSSEChunk(chunk);
      
      if (!data) continue;

      if (firstChunk) {
        // Premier chunk contient le rôle
        yield {
          content: data.choices[0].delta.content || '',
          done: false,
          role: data.choices[0].delta.role || 'assistant',
        };
        firstChunk = false;
      } else {
        yield {
          content: data.choices[0].delta.content || '',
          done: data.choices[0].finish_reason === 'stop',
        };
      }
    }

    logger.info('Streaming terminé');
  }

  /**
   * Construire le contexte à partir des chunks
   * @param chunks Liste de chunks
   * @returns Texte de contexte formaté
   */
  private buildContextFromChunks(chunks: Chunk[]): string {
    if (!chunks || chunks.length === 0) {
      return '';
    }

    const contextParts = chunks.map((chunk, index) => {
      const source = chunk.metadata.documentPath || chunk.metadata.source || `Source ${index + 1}`;
      return `--- Source: ${source} ---\n${chunk.content}`;
    });

    const context = contextParts.join('\n\n');
    
    logger.info('Contexte construit', {
      chunksCount: chunks.length,
      contextLength: context.length,
    });

    return context;
  }

  /**
   * Appeler l'API Mistral Chat
   * @param messages Messages de chat
   * @param options Options de génération
   * @returns Réponse brute de l'API
   */
  private async callMistralChatApi(
    messages: ChatMessage[],
    options: { temperature?: number; maxTokens?: number; topP?: number }
  ): Promise<any> {
    const payload = {
      model: this.config.model,
      messages,
      temperature: options.temperature || this.config.temperature,
      max_tokens: options.maxTokens || this.config.maxTokens,
      top_p: options.topP || this.config.topP,
    };

    const response = await this.client.post('/chat/completions', payload);
    return response.data;
  }

  /**
   * Parser un chunk SSE
   * @param chunk Chunk brut du stream
   * @returns Données parsées ou null
   */
  private parseSSEChunk(chunk: any): any {
    try {
      const text = chunk.toString();
      if (text.startsWith('data: ')) {
        const dataStr = text.substring(6).trim();
        if (dataStr === '[DONE]') {
          return null;
        }
        return JSON.parse(dataStr);
      }
      return null;
    } catch (error) {
      logger.warn('Erreur de parsing du chunk SSE', { error: error.message });
      return null;
    }
  }

  /**
   * Gérer les erreurs API
   * @param error Erreur Axios
   * @returns GenerationError formaté
   */
  private handleApiError(error: any): GenerationError {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const data = error.response?.data;

      switch (status) {
        case 400:
          return new GenerationError(
            data.message || 'Requête invalide',
            status,
            data.type || 'bad_request',
            false
          );
        case 401:
          return new GenerationError(
            'Clé API invalide ou expirée',
            status,
            'invalid_api_key',
            false
          );
        case 404:
          return new GenerationError(
            'Modèle non trouvé',
            status,
            'model_not_found',
            false
          );
        case 429:
          return new GenerationError(
            'Trop de requêtes - Rate limit dépassé',
            status,
            'rate_limit_exceeded',
            true
          );
        case 500:
        case 502:
        case 503:
        case 504:
          return new GenerationError(
            'Erreur serveur - Réessayez plus tard',
            status,
            'server_error',
            true
          );
        default:
          return new GenerationError(
            data.message || error.message || 'Erreur inconnue',
            status,
            data.type || 'unknown_error',
            status >= 500
          );
      }
    }

    return new GenerationError(
      error.message || 'Erreur inconnue',
      undefined,
      'unknown_error'
    );
  }

  /**
   * Vérifier si l'API est configurée
   */
  isConfigured(): boolean {
    return !!(this.config.apiKey);
  }

  /**
   * Mettre à jour la configuration
   * @param config Nouvelle configuration
   */
  updateConfig(config: Partial<MistralChatConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Mettre à jour le client si nécessaire
    if (config.apiKey) {
      this.client.defaults.headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }
    
    logger.info('Configuration du ResponseGenerator mise à jour', {
      model: this.config.model,
      temperature: this.config.temperature,
    });
  }
}

// Instance singleton par défaut
export const responseGenerator = new ResponseGenerator();

/**
 * Fonction principale de génération de réponse (wrapper)
 * @param query Requête utilisateur
 * @param contextChunks Chunks de contexte
 * @param options Options de génération
 * @returns Résultat avec la réponse générée
 */
export async function generateResponse(
  query: string,
  contextChunks: Chunk[] = [],
  options: {
    userRole?: UserRole;
    conversationId?: string;
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<GenerationResult> {
  return responseGenerator.generateResponse(query, contextChunks, options);
}

/**
 * Fonction de génération en streaming (wrapper)
 * @param query Requête utilisateur
 * @param contextChunks Chunks de contexte
 * @param options Options de génération
 * @returns Générateur asynchrone de chunks
 */
export async function* streamResponse(
  query: string,
  contextChunks: Chunk[] = [],
  options: {
    userRole?: UserRole;
    conversationId?: string;
    temperature?: number;
    maxTokens?: number;
  } = {}
): AsyncGenerator<StreamingChunk> {
  yield* responseGenerator.streamResponse(query, contextChunks, options);
}
```

---

### 3️⃣ Fichier : `src/lib/rag/__tests__/generator.test.ts`

```typescript
/**
 * Tests unitaires pour le service de génération
 * Fait partie du pipeline RAG de NexiaMind AI
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Utiliser vi.hoisted pour définir MockAxiosError avant que les mocks ne soient hoisted
const MockAxiosError = vi.hoisted(() =>
  class extends Error {
    response?: any;
    constructor(message: string, response?: any) {
      super(message);
      this.name = 'AxiosError';
      this.response = response;
    }
  }
);

// Mock des dépendances externes
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }
}));

// Mock de axios
vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>();
  return {
    ...actual,
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
    AxiosError: MockAxiosError,
  };
});

// Importer après les mocks
import {
  ResponseGenerator,
  generateResponse,
  streamResponse,
  GenerationError,
  UserRole,
  buildPrompt,
  getPromptsForRole,
  replacePromptVariables,
} from '../generator';
import { Chunk } from '../types';

describe('ResponseGenerator', () => {
  let generator: ResponseGenerator;

  beforeEach(() => {
    process.env.MISTRAL_API_KEY = 'test-api-key';
    generator = new ResponseGenerator();
  });

  describe('Initialisation', () => {
    it('devrait initialiser avec une configuration par défaut', () => {
      expect(generator).toBeDefined();
      expect(generator.isConfigured()).toBe(true);
    });

    it('devrait détecter si non configuré', () => {
      const originalEnv = process.env.MISTRAL_API_KEY;
      delete process.env.MISTRAL_API_KEY;
      
      const unconfiguredGenerator = new ResponseGenerator({ apiKey: '' });
      expect(unconfiguredGenerator.isConfigured()).toBe(false);
      
      process.env.MISTRAL_API_KEY = originalEnv;
    });

    it('devrait permettre de mettre à jour la configuration', () => {
      generator.updateConfig({ temperature: 0.9, model: 'mistral-medium' });
      expect(generator.isConfigured()).toBe(true);
    });
  });

  describe('Construction du contexte', () => {
    it('devrait construire le contexte à partir des chunks', () => {
      const chunks: Chunk[] = [
        {
          content: 'Ceci est le premier chunk',
          metadata: {
            chunkIndex: 0,
            totalChunks: 2,
            contentType: 'text',
            tokenCount: 10,
            documentPath: '/docs/guide.md',
          }
        },
        {
          content: 'Ceci est le deuxième chunk',
          metadata: {
            chunkIndex: 1,
            totalChunks: 2,
            contentType: 'text',
            tokenCount: 10,
            documentPath: '/docs/api.md',
          }
        }
      ];
      
      const context = (generator as any).buildContextFromChunks(chunks);
      
      expect(context).toContain('--- Source: /docs/guide.md ---');
      expect(context).toContain('Ceci est le premier chunk');
      expect(context).toContain('--- Source: /docs/api.md ---');
      expect(context).toContain('Ceci est le deuxième chunk');
    });

    it('devrait retourner un contexte vide si aucun chunk', () => {
      const context = (generator as any).buildContextFromChunks([]);
      expect(context).toBe('');
    });
  });

  describe('Génération de réponse', () => {
    it('devrait gérer une requête vide', async () => {
      await expect(generator.generateResponse('')).rejects.toThrow(GenerationError);
    });

    it('devrait gérer une requête valide', async () => {
      const mockPost = vi.fn().mockResolvedValue({
        data: {
          choices: [{
            message: { content: 'Réponse de test' },
          }],
          usage: { total_tokens: 50 },
        }
      });
      (generator as any).client.post = mockPost;

      const result = await generator.generateResponse('Test query');

      expect(result).toBeDefined();
      expect(result.response).toBe('Réponse de test');
      expect(result.tokenCount).toBe(50);
      expect(result.createdAt).toBeDefined();
      expect(result.contextChunks).toBe(0);
      expect(result.generationTime).toBeDefined();
    });

    it('devrait générer avec du contexte', async () => {
      const mockPost = vi.fn().mockResolvedValue({
        data: {
          choices: [{
            message: { content: 'Réponse avec contexte' },
          }],
          usage: { total_tokens: 100 },
        }
      });
      (generator as any).client.post = mockPost;

      const chunks: Chunk[] = [
        {
          content: 'Contexte important',
          metadata: {
            chunkIndex: 0,
            totalChunks: 1,
            contentType: 'text',
            tokenCount: 10,
            documentPath: '/docs/context.md',
          }
        }
      ];

      const result = await generator.generateResponse('Test query', chunks);

      expect(result).toBeDefined();
      expect(result.response).toBe('Réponse avec contexte');
      expect(result.contextChunks).toBe(1);
    });

    it('devrait gérer une liste vide de chunks', async () => {
      const mockPost = vi.fn().mockResolvedValue({
        data: {
          choices: [{
            message: { content: 'Réponse sans contexte' },
          }],
          usage: { total_tokens: 30 },
        }
      });
      (generator as any).client.post = mockPost;

      const result = await generator.generateResponse('Test query', []);

      expect(result).toBeDefined();
      expect(result.response).toBe('Réponse sans contexte');
      expect(result.contextChunks).toBe(0);
    });
  });

  describe('Streaming', () => {
    it('devrait gérer une requête vide en streaming', async () => {
      await expect(
        (async () => {
          for await (const chunk of generator.streamResponse('')) {
            // Ne devrait pas arriver
          }
        })()
      ).rejects.toThrow(GenerationError);
    });

    it('devrait streamer une réponse', async () => {
      const mockPost = vi.fn().mockImplementation(() => ({
        data: {
          on: vi.fn(),
          [Symbol.asyncIterator]: () => ({
            async next() {
              return { done: false, value: 'data: {"choices":[{"delta":{"content":"chunk1"}}]}\n\n' };
            }
          })
        }
      }));
      (generator as any).client.post = mockPost;

      let chunkCount = 0;
      for await (const chunk of generator.streamResponse('Test')) {
        expect(chunk.content).toBeDefined();
        chunkCount++;
        if (chunkCount >= 1) break; // Arrêter après le premier chunk pour le test
      }
      
      expect(chunkCount).toBeGreaterThan(0);
    });
  });

  describe('Gestion des erreurs', () => {
    it('devrait gérer les erreurs 400', async () => {
      const mockPost = vi.fn().mockRejectedValue(
        new MockAxiosError('Bad request', {
          status: 400,
          data: {
            object: 'error',
            message: 'Bad request',
            type: 'BadRequestError',
          }
        })
      );
      (generator as any).client.post = mockPost;

      await expect(generator.generateResponse('test')).rejects.toThrow(GenerationError);
    });

    it('devrait gérer les erreurs 401', async () => {
      const mockPost = vi.fn().mockRejectedValue(
        new MockAxiosError('Invalid API key', {
          status: 401,
          data: {
            object: 'error',
            message: 'Invalid API key',
            type: 'InvalidRequestError',
          }
        })
      );
      (generator as any).client.post = mockPost;

      await expect(generator.generateResponse('test')).rejects.toThrow(GenerationError);
    });

    it('devrait gérer les erreurs 429 (rate limit)', async () => {
      const mockPost = vi.fn().mockRejectedValue(
        new MockAxiosError('Rate limit exceeded', {
          status: 429,
          data: {
            object: 'error',
            message: 'Rate limit exceeded',
            type: 'RateLimitError',
          }
        })
      );
      (generator as any).client.post = mockPost;

      try {
        await generator.generateResponse('test');
      } catch (error) {
        expect(error).toBeInstanceOf(GenerationError);
        const genError = error as GenerationError;
        expect(genError.retryable).toBe(true);
        expect(genError.statusCode).toBe(429);
      }
    });

    it('devrait gérer les erreurs serveur 500', async () => {
      const mockPost = vi.fn().mockRejectedValue(
        new MockAxiosError('Internal server error', {
          status: 500,
          data: {
            object: 'error',
            message: 'Internal server error',
            type: 'InternalServerError',
          }
        })
      );
      (generator as any).client.post = mockPost;

      try {
        await generator.generateResponse('test');
      } catch (error) {
        expect(error).toBeInstanceOf(GenerationError);
        const genError = error as GenerationError;
        expect(genError.retryable).toBe(true);
      }
    });
  });

  describe('Fonctions exportées', () => {
    it('devrait exporter generateResponse', async () => {
      const mockClient = {
        post: vi.fn().mockResolvedValue({
          data: {
            choices: [{
              message: { content: 'Réponse exportée' },
            }],
            usage: { total_tokens: 40 },
          }
        })
      };
      
      const { responseGenerator } = await import('../generator');
      (responseGenerator as any).client = mockClient;

      const result = await generateResponse('Test');
      expect(result).toBeDefined();
      expect(result.response).toBe('Réponse exportée');
    });

    it('devrait exporter streamResponse', async () => {
      const mockClient = {
        post: vi.fn().mockImplementation(() => ({
          data: {
            [Symbol.asyncIterator]: () => ({
              async next() {
                return { done: true, value: undefined };
              }
            })
          }
        }))
      };
      
      const { responseGenerator } = await import('../generator');
      (responseGenerator as any).client = mockClient;

      let hasYielded = false;
      for await (const chunk of streamResponse('Test')) {
        hasYielded = true;
        break;
      }
      expect(hasYielded).toBe(false); // Le mock retourne done: true immédiatement
    });
  });
});

describe('Prompts', () => {
  describe('replacePromptVariables', () => {
    it('devrait remplacer les variables simples', () => {
      const result = replacePromptVariables(
        'Hello {name}!',
        { name: 'World' }
      );
      expect(result).toBe('Hello World!');
    });

    it('devrait laisser les variables non définies', () => {
      const result = replacePromptVariables(
        'Hello {name}!',
        {}
      );
      expect(result).toBe('Hello {name}!');
    });

    it('devrait remplacer plusieurs variables', () => {
      const result = replacePromptVariables(
        '{greeting} {name}! {exclamation}',
        { greeting: 'Hello', name: 'World', exclamation: '!!!' }
      );
      expect(result).toBe('Hello World! !!!');
    });
  });

  describe('getPromptsForRole', () => {
    it('devrait retourner les prompts par défaut pour user', () => {
      const prompts = getPromptsForRole('user');
      expect(prompts).toBeDefined();
      expect(prompts.system).toBeDefined();
    });

    it('devrait retourner les prompts pour admin', () => {
      const prompts = getPromptsForRole('admin');
      expect(prompts).toBeDefined();
      expect(prompts.system.content).toContain('admin');
    });

    it('devrait retourner les prompts pour developer', () => {
      const prompts = getPromptsForRole('developer');
      expect(prompts).toBeDefined();
      expect(prompts.system.content).toContain('technique');
    });
  });

  describe('buildPrompt', () => {
    it('devrait construire un prompt complet', () => {
      const messages = buildPrompt(
        'Test query',
        'Contexte important',
        'user'
      );

      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe('system');
      expect(messages[0].content).toContain('Contexte important');
      expect(messages[1].role).toBe('user');
      expect(messages[1].content).toBe('Test query');
    });

    it('devrait construire un prompt avec des variables supplémentaires', () => {
      const messages = buildPrompt(
        'Test query',
        'Contexte',
        'admin',
        { instructions: 'Sois précis' }
      );

      expect(messages[0].content).toContain('Sois précis');
    });
  });
});

describe('GenerationError', () => {
  it('devrait créer une erreur avec les bonnes propriétés', () => {
    const error = new GenerationError('Test error', 400, 'test_type', true);

    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(400);
    expect(error.errorType).toBe('test_type');
    expect(error.retryable).toBe(true);
    expect(error.name).toBe('GenerationError');
  });

  it('devrait créer une erreur par défaut', () => {
    const error = new GenerationError('Test error');

    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBeUndefined();
    expect(error.errorType).toBeUndefined();
    expect(error.retryable).toBe(false);
  });
});
```

---

### 4️⃣ Mise à jour : `src/lib/rag/index.ts`

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

// Export du service de génération
export * from './generator';
export * from './prompts';
```

---

### 5️⃣ Mise à jour : `.env.local.example`

```bash
# ========================================
# MISTRAL AI CONFIGURATION
# ========================================

# Clé API Mistral (pour les embeddings et chat)
# Créez-la sur : https://console.mistral.ai/
MISTRAL_API_KEY=your_mistral_api_key_here
MISTRAL_API_BASE_URL=https://api.mistral.ai/v1
MISTRAL_EMBEDDING_MODEL=mistral-embed
MISTRAL_CHAT_MODEL=mistral-small

# Configuration de la génération
MISTRAL_CHAT_TEMPERATURE=0.7
MISTRAL_CHAT_MAX_TOKENS=2048
MISTRAL_CHAT_TOP_P=0.9
```

---

## 🔧 Configuration Requise

### Dépendances npm

Déjà satisfaites avec axios installé pour ST-103.

```json
{
  "dependencies": {
    "axios": "^1.7.0"
  }
}
```

### Variables d'Environnement

Créer ou mettre à jour `.env.local` avec :

```bash
# Mistral Chat
MISTRAL_API_KEY=sk_votre_clé_api_mistral
MISTRAL_CHAT_MODEL=mistral-small
MISTRAL_CHAT_TEMPERATURE=0.7
MISTRAL_CHAT_MAX_TOKENS=2048
```

> **⚠️ IMPORTANT :** Ne jamais commiter `.env.local` (déjà dans `.gitignore`)

---

## 📚 Références

- **Mistral Chat API** : https://docs.mistral.ai/api/#tag/chat
- **Server-Sent Events (SSE)** : https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events
- **Prompt Engineering** : https://www.promptingguide.ai/
- **RAG Best Practices** : https://www.pinecone.io/learn/rag/
- **Mistral Models** : https://docs.mistral.ai/models/

---

## 📝 Journal du Développeur

### 🟢 Enregistrements de Développement
*Date : [À remplir]*
*Statut : pending*

### 🟡 Journal de Débogage
*(Vide - aucun problème rencontré)*

### ✅ Notes de Complétion
*(À remplir à la fin de la story)*

---

## 📁 Liste des Fichiers à Créer

### Fichiers Principaux
- `src/lib/rag/generator.ts` - Service de génération principal
- `src/lib/rag/prompts.ts` - Templates de prompts
- `src/lib/rag/__tests__/generator.test.ts` - Tests unitaires

### Fichiers Modifiés
- `src/lib/rag/index.ts` - Export des nouveaux modules
- `.env.local.example` - Ajouter MISTRAL_CHAT_*

---

## 🔄 Journal des Changements
*(À remplir pendant le développement)*
