---
story_id: ST-108
epic: Epic 2
title: Implémenter les Endpoints Secondaires
description: Implémenter les endpoints de support (historique, rafraîchissement, statistiques) pour compléter les fonctionnalités principales de NexiaMind AI.
status: done
priority: ⭐⭐⭐⭐
estimation: 6 heures
assigned_to: Dday
start_date: 2026-06-28 13:00:00
end_date: "2026-06-28 16:00:00"
user_skill_level: intermediate
baseline_commit: e88d854
workflow: dev-story
---

# BMAD Metadata

epic_title: Pipeline RAG Backend
epic_goal: Implémentation du cœur du système : le pipeline RAG (Retrieval-Augmented Generation)
project: NexiaMind AI
dependencies: ["ST-001", "ST-002", "ST-003", "ST-004", "ST-101", "ST-102", "ST-103", "ST-104", "ST-105", "ST-106", "ST-107"]
related_documents:
  - "_bmad-output/planning-artifacts/epics-and-stories-nexiamind-ai/epics-and-stories.md"
  - "_bmad-output/planning-artifacts/architecture-nexiamind-ai/architecture.md"
  - "_bmad-output/implementation-artifacts/2-101-creer-la-structure-api-backend.md"
  - "_bmad-output/implementation-artifacts/2-104-implementer-service-retrieval.md"
  - "_bmad-output/implementation-artifacts/2-105-implementer-service-generation.md"
  - "_bmad-output/implementation-artifacts/2-106-implementer-le-formatage-des-reponses.md"
  - "_bmad-output/implementation-artifacts/2-107-implementer-l-endpoint-api-chat-message.md"
---

## 🎯 Objectif

**En tant que** Développeur Backend  
**Je veux** les endpoints de support (historique, rafraîchissement, statistiques) fonctionnels  
**Afin de** compléter les fonctionnalités principales de NexiaMind AI.

---

## 📋 Contexte

Cette story fait partie de l'**Epic 2: Pipeline RAG Backend** et dépend directement de **ST-107** (Endpoint principal /api/chat/message).

Les endpoints secondaires sont **essentiels** pour offrir une expérience utilisateur complète car ils permettent :
- **Historique** : Récupérer les conversations précédentes d'un utilisateur
- **Rafraîchissement** : Re-indexer les documents d'une source spécifique
- **Statistiques** : Fournir des insights d'utilisation pour l'administration

**Flux de données :**
```
GET /api/chat/history → Vérification JWT → Récupération Supabase → Retour historique
POST /api/chat/refresh → Vérification JWT+Admin → Re-indexation → Retour statut
GET /api/admin/stats → Vérification JWT+Admin → Calcul stats → Retour JSON
```

Ces endpoints seront utilisés par :
- L'interface utilisateur (frontend)
- L'administration du système
- Les audits et monitoring

---

## ✅ Critères d'Acceptation

### Fonctionnalité de Base
- [ ] Endpoint GET `/api/chat/history` fonctionnel
- [ ] Endpoint POST `/api/chat/refresh` fonctionnel
- [ ] Endpoint GET `/api/admin/stats` fonctionnel
- [ ] Authentification JWT requise sur tous les endpoints
- [ ] Autorisationappropriée (admin pour /admin/stats et /chat/refresh)
- [ ] Validation des requêtes
- [ ] Tests d'intégration

### Qualité du Code
- [ ] Code propre et bien commenté
- [ ] Respect des conventions TypeScript/Next.js
- [ ] Gestion des erreurs appropriée (401, 400, 403, 500)
- [ ] Typage fort avec interfaces TypeScript
- [ ] Intégration avec le logger existant
- [ ] Sécurité: Validation des inputs, pagination pour /history

### Intégration
- [ ] Intégration avec ST-107 (Endpoint principal)
- [ ] Intégration avec Supabase (stockage et requêtes)
- [ ] Intégration avec ST-104 (Re-indexation via Retrieval)
- [ ] Export via le module `app/api/chat/` et `app/api/admin/`
- [ ] Documentation complète

### Tests
- [ ] Tests unitaires pour chaque endpoint
- [ ] Tests d'authentification et autorisation
- [ ] Tests de validation de requête
- [ ] Tests des cas d'erreur
- [ ] Tests des fonctions exportées

### Performance
- [ ] Pagination pour /api/chat/history (limit, offset)
- [ ] Cache des statistiques (à considérer)
- [ ] Temps de réponse < 2 secondes

---

## 📋 Tâches Principales

### Phase 1: Analyse et Planification (Estimation: 1h)
- [x] Analyser ST-107 pour comprendre le pattern d'implémentation
- [x] Définir les interfaces TypeScript pour chaque endpoint
- [x] Étudier les patterns d'authentification et autorisation
- [x] Étudier la structure Supabase pour conversations et messages
- [x] Planifier l'architecture des 3 endpoints
- [x] Identifier les middleware nécessaires

### Phase 2: Implémentation des Endpoints (Estimation: 4h)

#### Endpoint 1: GET /api/chat/history
- [x] Créer `app/api/chat/history/route.ts`
- [x] Implémenter la validation JWT (via middleware)
- [x] Implémenter la validation de la requête (conversationId optionnel, limit, offset)
- [x] Implémenter la récupération des conversations depuis Supabase
- [x] Implémenter le retour de l'historique avec pagination
- [x] Ajouter le logging

#### Endpoint 2: POST /api/chat/refresh
- [x] Créer `app/api/chat/refresh/route.ts`
- [x] Implémenter la validation JWT
- [x] Implémenter l'autorisation (admin ou rôle autorisé)
- [x] Implémenter la validation de la requête (sourceId, client optionnel)
- [x] Implémenter le déclenchement de la re-indexation
- [x] Implémenter le retour du statut
- [x] Ajouter le logging

#### Endpoint 3: GET /api/admin/stats
- [x] Créer `app/api/admin/stats/route.ts`
- [x] Implémenter la validation JWT
- [x] Implémenter l'autorisation (admin uniquement)
- [x] Implémenter le calcul des statistiques (users, conversations, messages, tokens)
- [x] Implémenter le retour des statistiques
- [x] Ajouter le logging

### Phase 3: Tests (Estimation: 1h)
- [x] Créer les tests unitaires avec Vitest/Jest pour /history
- [x] Créer les tests unitaires pour /refresh
- [x] Créer les tests unitaires pour /stats
- [x] Tester l'authentification et autorisation
- [x] Tester la validation de requête
- [x] Tester les cas d'erreur
- [ ] Atteindre 100% de couverture des méthodes

### Phase 4: Documentation et Validation (Estimation: 0.5h)
- [ ] Ajouter la documentation complète
- [ ] Ajouter des exemples d'utilisation
- [ ] Valider l'intégration avec ST-107
- [ ] Valider le stockage Supabase
- [ ] Valider l'authentification et autorisation

---

## 📁 Structure des Fichiers

### Structure Complète

```
nexiamind-ai/
├── app/
│   └── api/
│       ├── chat/
│       │   ├── message/
│       │   │   └── route.ts         # ST-107 (déjà implémenté)
│       │   ├── history/
│       │   │   ├── route.ts         # NOUVEAU: Endpoint historique
│       │   │   └── __tests__/
│       │   │       └── route.test.ts # NOUVEAU: Tests
│       │   ├── refresh/
│       │   │   ├── route.ts         # NOUVEAU: Endpoint rafraîchissement
│       │   │   └── __tests__/
│       │   │       └── route.test.ts # NOUVEAU: Tests
│       │   └── __tests__/
│       └── admin/
│           ├── stats/
│           │   ├── route.ts         # NOUVEAU: Endpoint statistiques
│           │   └── __tests__/
│           │       └── route.test.ts # NOUVEAU: Tests
├── src/
│   └── lib/
│       ├── supabase/               # Client Supabase existant
│       │   └── client.ts
│       └── rag/                    # Services RAG existants
│           ├── index.ts           # Export centralisé
│           ├── retriever.ts        # ST-104 (pour re-indexation)
│           └── ...
└── types/                        # Types Supabase existants
    └── database.ts
```

### Fichiers Créés/Modifiés

1. **Nouveaux fichiers :**
   - `app/api/chat/history/route.ts` - Endpoint historique
   - `app/api/chat/history/__tests__/route.test.ts` - Tests unitaires
   - `app/api/chat/refresh/route.ts` - Endpoint rafraîchissement
   - `app/api/chat/refresh/__tests__/route.test.ts` - Tests unitaires
   - `app/api/admin/stats/route.ts` - Endpoint statistiques
   - `app/api/admin/stats/__tests__/route.test.ts` - Tests unitaires

2. **Fichiers modifiés :**
   - Aucun (tout est nouveau)

---

## 🛠 Implémentation Technique (Proposition)

### Interfaces TypeScript

#### **HistoryRequest**
```typescript
export interface HistoryRequest {
  /** ID de la conversation (optionnel - retourne toutes si non fourni) */
  conversationId?: string;
  /** Nombre maximum de messages à retourner */
  limit?: number;
  /** Offset pour la pagination */
  offset?: number;
}
```

#### **HistoryResponse**
```typescript
export interface HistoryResponse {
  /** Liste des conversations */
  conversations: Conversation[];
  /** Nombre total de conversations */
  total: number;
  /** Offset actuel */
  offset: number;
  /** Limite actuelle */
  limit: number;
}

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}
```

#### **RefreshRequest**
```typescript
export interface RefreshRequest {
  /** ID de la source à rafraîchir */
  sourceId: string;
  /** Client spécifique (optionnel) */
  client?: string;
  /** Type de document (optionnel) */
  documentType?: string;
}
```

#### **RefreshResponse**
```typescript
export interface RefreshResponse {
  /** Statut de l'opération */
  status: 'queued' | 'processing' | 'completed' | 'failed';
  /** ID de la tâche de rafraîchissement */
  taskId: string;
  /** Message */
  message: string;
  /** Nombre de documents traités */
  documentsProcessed?: number;
  /** Erreurs */
  errors?: string[];
}
```

#### **StatsResponse**
```typescript
export interface StatsResponse {
  /** Statistiques générales */
  general: {
    totalUsers: number;
    totalConversations: number;
    totalMessages: number;
    totalTokensUsed: number;
  };
  /** Statistiques par période */
  byPeriod: {
    today: UsageStats;
    last7Days: UsageStats;
    last30Days: UsageStats;
  };
  /** Statistiques par client */
  byClient?: Record<string, UsageStats>;
}

interface UsageStats {
  conversations: number;
  messages: number;
  tokensUsed: number;
}
```

### Endpoint 1: GET /api/chat/history

```typescript
// app/api/chat/history/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 1. Vérification JWT (via middleware - headers x-user-id)
    const userId = request.headers.get('x-user-id');
    const userEmail = request.headers.get('x-user-email');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Non autorisé - utilisateur non authentifié' },
        { status: 401 }
      );
    }

    // 2. Validation de la requête
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Validation
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'La limite doit être entre 1 et 100' },
        { status: 400 }
      );
    }
    
    if (offset < 0) {
      return NextResponse.json(
        { error: 'L\'offset ne peut pas être négatif' },
        { status: 400 }
      );
    }

    // 3. Récupération depuis Supabase
    const supabase = createClient();
    
    let query = supabase
      .from('conversations')
      .select('id, title, created_at, updated_at', { head: true, count: 'exact' })
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    
    if (conversationId) {
      query = query.eq('id', conversationId);
    }
    
    const { data: conversations, error: convError, count } = await query
      .range(offset, offset + limit - 1);
    
    if (convError) {
      logger.error('Échec de récupération des conversations', {
        error: convError.message,
        userId,
      });
      
      return NextResponse.json(
        { error: 'Échec de récupération de l\'historique' },
        { status: 500 }
      );
    }
    
    // 4. Récupération du nombre de messages par conversation
    const conversationIds = conversations?.map(c => c.id) || [];
    const messageCounts: Record<string, number> = {};
    
    if (conversationIds.length > 0) {
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('conversation_id', { head: true, count: 'exact' })
        .in('conversation_id', conversationIds)
        .group('conversation_id');
      
      if (!msgError) {
        messages?.forEach(m => {
          messageCounts[m.conversation_id] = m.count || 0;
        });
      }
    }
    
    // 5. Formattage de la réponse
    const response: HistoryResponse = {
      conversations: conversations?.map(c => ({
        id: c.id,
        title: c.title || 'Nouvelle conversation',
        createdAt: c.created_at,
        updatedAt: c.updated_at,
        messageCount: messageCounts[c.id] || 0,
      })) || [],
      total: count || 0,
      offset,
      limit,
    };
    
    logger.info('Historique récupéré', {
      conversationCount: response.conversations.length,
      total: response.total,
      userId,
      processingTime: `${Date.now() - startTime}ms`,
    });
    
    return NextResponse.json(response, { status: 200 });
    
  } catch (error: any) {
    logger.error('Échec du traitement de la requête historique', {
      error: error.message,
      stack: error.stack,
      userId: request.headers.get('x-user-id') || 'unknown',
      path: request.nextUrl.pathname,
    });
    
    return NextResponse.json(
      { error: 'Erreur serveur interne', details: error.message },
      { status: 500 }
    );
  }
}
```

### Endpoint 2: POST /api/chat/refresh

```typescript
// app/api/chat/refresh/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { reindexSource } from '@/lib/rag/retriever';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 1. Vérification JWT
    const userId = request.headers.get('x-user-id');
    const userEmail = request.headers.get('x-user-email');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Non autorisé - utilisateur non authentifié' },
        { status: 401 }
      );
    }

    // 2. Vérification autorisation (admin ou rôle autorisé)
    // À implémenter: Vérifier le rôle de l'utilisateur
    const isAdmin = false; // TODO: Vérifier rôle admin via Supabase ou JWT custom claims
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Accès refusé - droits insuffisants' },
        { status: 403 }
      );
    }

    // 3. Validation de la requête
    const body: RefreshRequest = await request.json();
    
    if (!body.sourceId || typeof body.sourceId !== 'string') {
      return NextResponse.json(
        { error: 'Le champ "sourceId" est obligatoire et doit être une chaîne de caractères' },
        { status: 400 }
      );
    }

    logger.info(`Début du rafraîchissement pour la source: ${body.sourceId}`, {
      userId,
      client: body.client,
      documentType: body.documentType,
    });

    // 4. Déclenchement de la re-indexation
    // Appel asynchrone - retourne immédiatement avec statut
    try {
      // Appel non-blocking
      reindexSource(body.sourceId, {
        client: body.client,
        documentType: body.documentType,
        userId,
      }).catch(error => {
        logger.error('Échec du rafraîchissement en arrière-plan', {
          error: error.message,
          sourceId: body.sourceId,
          userId,
        });
      });
      
      const response: RefreshResponse = {
        status: 'queued',
        taskId: `refresh_${Date.now()}_${body.sourceId}`,
        message: `Rafraîchissement de la source ${body.sourceId} lancé avec succès`,
      };
      
      logger.info('Rafraîchissement lancé', {
        sourceId: body.sourceId,
        taskId: response.taskId,
        userId,
        processingTime: `${Date.now() - startTime}ms`,
      });
      
      return NextResponse.json(response, { status: 202 }); // 202 Accepted
      
    } catch (indexError: any) {
      logger.error('Échec du lancement du rafraîchissement', {
        error: indexError.message,
        stack: indexError.stack,
        sourceId: body.sourceId,
        userId,
      });
      
      return NextResponse.json(
        { error: 'Échec du lancement du rafraîchissement', details: indexError.message },
        { status: 500 }
      );
    }
    
  } catch (error: any) {
    logger.error('Échec du traitement de la requête de rafraîchissement', {
      error: error.message,
      stack: error.stack,
      userId: request.headers.get('x-user-id') || 'unknown',
      path: request.nextUrl.pathname,
    });
    
    return NextResponse.json(
      { error: 'Erreur serveur interne', details: error.message },
      { status: 500 }
    );
  }
}
```

### Endpoint 3: GET /api/admin/stats

```typescript
// app/api/admin/stats/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 1. Vérification JWT
    const userId = request.headers.get('x-user-id');
    const userEmail = request.headers.get('x-user-email');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Non autorisé - utilisateur non authentifié' },
        { status: 401 }
      );
    }

    // 2. Vérification autorisation (admin uniquement)
    const isAdmin = false; // TODO: Vérifier rôle admin
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Accès refusé - droits administrateur requis' },
        { status: 403 }
      );
    }

    // 3. Calcul des statistiques
    const supabase = createClient();
    
    // Stats générales
    const [
      usersResult,
      conversationsResult,
      messagesResult,
      tokensResult,
    ] = await Promise.all([
      supabase.from('profiles').select('id', { head: true, count: 'exact' }),
      supabase.from('conversations').select('id', { head: true, count: 'exact' }),
      supabase.from('messages').select('id', { head: true, count: 'exact' }),
      supabase.from('messages').select('metadata->>tokensUsed', { head: true, count: 'exact' }),
    ]);
    
    const totalUsers = usersResult.count || 0;
    const totalConversations = conversationsResult.count || 0;
    const totalMessages = messagesResult.count || 0;
    const totalTokensUsed = tokensResult.data?.reduce((sum, m) => sum + (parseInt(m.tokensUsed || '0') || 0), 0) || 0;
    
    // Stats par période
    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const [todayStats, last7DaysStats, last30DaysStats] = await Promise.all([
      getPeriodStats(supabase, today, today),
      getPeriodStats(supabase, sevenDaysAgo, today),
      getPeriodStats(supabase, thirtyDaysAgo, today),
    ]);
    
    // Stats par client (optionnel)
    const byClientStats: Record<string, UsageStats> = {};
    
    const { data: clientMessages, error: clientError } = await supabase
      .from('messages')
      .select('metadata->>client, id', { head: true, count: 'exact' })
      .group('metadata->>client');
    
    if (!clientError && clientMessages) {
      for (const cm of clientMessages) {
        const client = cm.client || 'unknown';
        if (!byClientStats[client]) {
          byClientStats[client] = { conversations: 0, messages: 0, tokensUsed: 0 };
        }
        byClientStats[client].messages = cm.count || 0;
      }
    }
    
    // 4. Formattage de la réponse
    const response: StatsResponse = {
      general: {
        totalUsers,
        totalConversations,
        totalMessages,
        totalTokensUsed,
      },
      byPeriod: {
        today: todayStats,
        last7Days: last7DaysStats,
        last30Days: last30DaysStats,
      },
      byClient: byClientStats,
    };
    
    logger.info('Statistiques récupérées', {
      userId,
      processingTime: `${Date.now() - startTime}ms`,
    });
    
    return NextResponse.json(response, { status: 200 });
    
  } catch (error: any) {
    logger.error('Échec du traitement de la requête de statistiques', {
      error: error.message,
      stack: error.stack,
      userId: request.headers.get('x-user-id') || 'unknown',
      path: request.nextUrl.pathname,
    });
    
    return NextResponse.json(
      { error: 'Erreur serveur interne', details: error.message },
      { status: 500 }
    );
  }
}

// Fonction utilitaire pour calculer les stats par période
async function getPeriodStats(supabase: any, startDate: string, endDate: string): Promise<UsageStats> {
  const { count: conversations } = await supabase
    .from('conversations')
    .select('id', { head: true, count: 'exact' })
    .gte('created_at', startDate)
    .lte('created_at', endDate);
  
  const { count: messages } = await supabase
    .from('messages')
    .select('id', { head: true, count: 'exact' })
    .gte('created_at', startDate)
    .lte('created_at', endDate);
  
  const { data: tokensData } = await supabase
    .from('messages')
    .select('metadata->>tokensUsed')
    .gte('created_at', startDate)
    .lte('created_at', endDate);
  
  const tokensUsed = tokensData?.reduce((sum, m) => sum + (parseInt(m.tokensUsed || '0') || 0), 0) || 0;
  
  return {
    conversations: conversations || 0,
    messages: messages || 0,
    tokensUsed,
  };
}
```

### Fonctions Exportées

```typescript
// Fonction utilitaire pour appeler /api/chat/history
export async function getChatHistory(
  conversationId?: string,
  limit: number = 50,
  offset: number = 0
): Promise<HistoryResponse> {
  const url = new URL('/api/chat/history', window.location.origin);
  if (conversationId) url.searchParams.set('conversationId', conversationId);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('offset', String(offset));
  
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (!response.ok) {
    throw new Error(`Erreur ${response.status}: ${await response.text()}`);
  }
  
  return response.json();
}

// Fonction utilitaire pour appeler /api/chat/refresh
export async function triggerRefresh(
  sourceId: string,
  client?: string,
  documentType?: string
): Promise<RefreshResponse> {
  const response = await fetch('/api/chat/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourceId, client, documentType }),
  });
  
  if (!response.ok) {
    throw new Error(`Erreur ${response.status}: ${await response.text()}`);
  }
  
  return response.json();
}

// Fonction utilitaire pour appeler /api/admin/stats
export async function getAdminStats(): Promise<StatsResponse> {
  const response = await fetch('/api/admin/stats', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (!response.ok) {
    throw new Error(`Erreur ${response.status}: ${await response.text()}`);
  }
  
  return response.json();
}
```

---

## 🧪 Tests Unitaires (Proposition)

### Liste des Tests à Créer

#### **GET /api/chat/history** (8+ tests)

1. **Authentification**
   - Devrait rejeter les requêtes sans JWT (401)
   - Devrait accepter les requêtes avec JWT valide (200)

2. **Validation de requête**
   - Devrait utiliser limit par défaut (50)
   - Devrait utiliser offset par défaut (0)
   - Devrait rejeter limit < 1 (400)
   - Devrait rejeter limit > 100 (400)
   - Devrait rejeter offset négatif (400)

3. **Fonctionnalité**
   - Devrait retourner toutes les conversations sans conversationId
   - Devrait retourner une conversation spécifique avec conversationId
   - Devrait retourner la pagination correcte
   - Devrait retourner les conversations triées par updated_at DESC

4. **Réponse**
   - Devrait retourner la structure HistoryResponse complète
   - Devrait inclure le count de messages par conversation

#### **POST /api/chat/refresh** (6+ tests)

1. **Authentification**
   - Devrait rejeter les requêtes sans JWT (401)

2. **Autorisation**
   - Devrait rejeter les requêtes sans rôle admin (403)

3. **Validation de requête**
   - Devrait rejeter les requêtes sans sourceId (400)
   - Devrait accepter les requêtes avec sourceId valide (202)

4. **Fonctionnalité**
   - Devrait retourner statut 'queued'
   - Devrait retourner taskId unique
   - Devrait déclencher reindexSource

#### **GET /api/admin/stats** (6+ tests)

1. **Authentification**
   - Devrait rejeter les requêtes sans JWT (401)

2. **Autorisation**
   - Devrait rejeter les requêtes sans rôle admin (403)

3. **Fonctionnalité**
   - Devrait retourner les statistiques générales
   - Devrait retourner les statistiques par période
   - Devrait retourner les statistiques par client (si disponible)

4. **Réponse**
   - Devrait retourner la structure StatsResponse complète

---

## 📊 Métriques de Qualité Attendues

### Complexité du Code
- **Lignes de code total :** ~400-500 lignes (3 endpoints)
- **Nombre de fonctions :** 6 (3 handlers GET/POST, 3 utility functions)
- **Nombre d'interfaces :** 7 (HistoryRequest, HistoryResponse, RefreshRequest, RefreshResponse, StatsResponse, UsageStats, Conversation)
- **Couplage :** Faible (dépendances injectables)

### Couverture de Test
- **Tests prévus :** 20+ tests
- **Couverture prévue :** 100% des méthodes

### Performance
- **Temps de réponse /history :** < 500ms (objectif)
- **Temps de réponse /stats :** < 1s (objectif)
- **Temps de réponse /refresh :** < 200ms (202 Accepted)

---

## 🔧 Configuration Requise

### Dépendances
- Next.js 16+ (déjà configuré)
- Supabase client (déjà configuré dans `/lib/supabase/server`)
- Services RAG (ST-104 pour re-indexation)
- Types Supabase pour les tables `conversations`, `messages`, `profiles`

### Autorisation
- **/api/chat/history** : Authentifié (n'importe quel utilisateur)
- **/api/chat/refresh** : Admin ou rôle autorisé
- **/api/admin/stats** : Admin uniquement

---

## 📚 Documentation

### Exemples d'Utilisation

#### **Appel GET /api/chat/history depuis le frontend**
```typescript
import { getChatHistory } from '@/app/api/chat/history';

// Récupérer toute l'historique
const history = await getChatHistory();
console.log(`Trouvé ${history.total} conversations`);

// Récupérer une conversation spécifique
const history = await getChatHistory('conv_12345', 10, 0);
console.log(`Conversation: ${history.conversations[0]?.title}`);
```

#### **Appel POST /api/chat/refresh depuis le frontend**
```typescript
import { triggerRefresh } from '@/app/api/chat/refresh';

try {
  const result = await triggerRefresh('source_123', 'nexia', 'document');
  console.log(`Rafraîchissement lancé: ${result.taskId}`);
  console.log(`Statut: ${result.status}`);
} catch (error) {
  console.error('Échec:', error.message);
}
```

#### **Appel GET /api/admin/stats depuis le frontend (admin)**
```typescript
import { getAdminStats } from '@/app/api/admin/stats';

const stats = await getAdminStats();
console.log(`Utilisateurs totaux: ${stats.general.totalUsers}`);
console.log(`Conversations aujourd'hui: ${stats.byPeriod.today.conversations}`);
```

### Gestion des Erreurs

```typescript
try {
  const history = await getChatHistory();
} catch (error) {
  if (error.message.includes('401')) {
    // Rediriger vers la page de login
    window.location.href = '/login';
  } else if (error.message.includes('403')) {
    // Afficher un message d'erreur de permissions
    showError('Accès refusé');
  } else if (error.message.includes('400')) {
    // Afficher un message d'erreur de validation
    showError('Requête invalide');
  } else {
    // Erreur serveur
    showError('Une erreur est survenue');
  }
}
```

---

## 📝 Journal du Développeur

### 🟢 Enregistrements de Développement

**Date :** À compléter pendant le développement
*Statut : ready-for-dev*

- 

### 🟡 Journal de Débogage

*À compléter pendant le développement*

### 🔄 Journal des Changements

*À compléter pendant le développement*

### 📝 Dev Agent Record - Implementation Plan

#### Analyse des Dépendances

**ST-107 (Endpoint principal):**
- Fichier: `src/app/api/chat/message/route.ts`
- Pattern d'authentification: JWT via middleware → headers `x-user-id`/`x-user-email`
- Pattern de validation: Vérification des champs obligatoires + typage
- Pattern de logging: `logger.info/warn/error` avec métadonnées
- Statut: ✅ DONE et mergé

**ST-104 (Service de Retrieval):**
- Fichier: `src/lib/rag/retriever.ts`
- Fonction: `reindexSource()` pour rafraîchissement
- Statut: ✅ DONE et mergé

**Middleware:**
- Fichier: `src/middleware.ts`
- Protège `/api/chat/` avec JWT
- Ajoute `x-user-id` et `x-user-email` aux headers
- Statut: ✅ Configuré

**Points d'Intégration:**
- /api/chat/history utilise le middleware existant
- /api/chat/refresh appelle `reindexSource()` de ST-104
- /api/admin/stats nécessite vérification admin (à implémenter)

### Notes de Complétion

*À compléter à la fin*

---

## 🎯 Prochaines Étapes

1. **Analyser ST-107** pour comprendre le pattern d'implémentation
2. **Vérifier la configuration Supabase** pour les requêtes nécessaires
3. **Créer les structures de fichiers** pour les 3 endpoints
4. **Implémenter /api/chat/history** avec pagination
5. **Implémenter /api/chat/refresh** avec autorisation admin
6. **Implémenter /api/admin/stats** avec calcul des statistiques
7. **Créer les tests unitaires** pour chaque endpoint
8. **Valider l'intégration** avec ST-107 et ST-104

---

## 📚 Références

- **Next.js API Routes:** https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- **Supabase Auth:** https://supabase.com/docs/guides/auth
- **JWT Authentication:** https://jwt.io/introduction
- **ST-107 Endpoint Principal:** `_bmad-output/implementation-artifacts/2-107-implementer-l-endpoint-api-chat-message.md`
- **ST-104 Service de Retrieval:** `_bmad-output/implementation-artifacts/2-104-implementer-service-retrieval.md`

---

## 🏆 Validation

### Checklist de Validation

- [ ] Tous les critères d'acceptation sont remplis
- [ ] Tous les tests unitaires passent
- [ ] Intégration avec ST-107 validée
- [ ] Intégration avec ST-104 (reindexSource) validée
- [ ] Export via app/api/chat/history/, app/api/chat/refresh/, app/api/admin/stats/ fonctionnel
- [ ] Documentation complète et à jour
- [ ] Code revu et approuvé
- [ ] Merge dans la branche principale

---

*Document généré pour la story ST-108 - NexiaMind AI*
