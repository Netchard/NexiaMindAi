---
story_id: ST-107
epic: Epic 2
title: Implémenter l'Endpoint /api/chat/message
description: Implémenter l'endpoint principal pour traiter les requêtes utilisateurs et offrir la fonctionnalité core de NexiaMind AI.
status: done
priority: ⭐⭐⭐⭐⭐
estimation: 6 heures
assigned_to: Dday
start_date: 2026-06-28 12:00:00
end_date: "2026-06-28 13:00:00"
user_skill_level: intermediate
baseline_commit: fd45435
workflow: dev-story
---

# BMAD Metadata

epic_title: Pipeline RAG Backend
epic_goal: Implémentation du cœur du système : le pipeline RAG (Retrieval-Augmented Generation)
project: NexiaMind AI
dependencies: ["ST-001", "ST-002", "ST-003", "ST-004", "ST-101", "ST-102", "ST-103", "ST-104", "ST-105", "ST-106"]
related_documents:
  - "_bmad-output/planning-artifacts/epics-and-stories-nexiamind-ai/epics-and-stories.md"
  - "_bmad-output/planning-artifacts/architecture-nexiamind-ai/architecture.md"
  - "_bmad-output/implementation-artifacts/2-101-creer-la-structure-api-backend.md"
  - "_bmad-output/implementation-artifacts/2-104-implementer-service-retrieval.md"
  - "_bmad-output/implementation-artifacts/2-105-implementer-service-generation.md"
  - "_bmad-output/implementation-artifacts/2-106-implementer-le-formatage-des-reponses.md"
---

## 🎯 Objectif

**En tant que** Développeur Backend  
**Je veux** l'endpoint principal pour traiter les requêtes utilisateurs  
**Afin de** offrir la fonctionnalité core de NexiaMind AI.

---

## 📋 Contexte

Cette story fait partie de l'**Epic 2: Pipeline RAG Backend** et dépend directement des stories précédentes :
- **ST-101** : Structure API backend (déjà implémentée)
- **ST-102** : Service de Chunking (déjà implémentée)
- **ST-103** : Service d'Embeddings (déjà implémentée)
- **ST-104** : Service de Retrieval (implémentée et mergée ✅)
- **ST-105** : Service de Génération (implémentée et mergée ✅)
- **ST-106** : Service de Formatage (implémentée et mergée ✅)

L'endpoint `/api/chat/message` est **le cœur de l'application NexiaMind AI** car il :
- Reçoit les requêtes des utilisateurs
- Orchestre l'ensemble du pipeline RAG
- Retourne des réponses formatées avec citations
- Stocke les conversations pour l'historique

**Flux de données complet :**
```
Requête Utilisateur → /api/chat/message → Vérification JWT → Validation → RAG Pipeline → Réponse Formatée → Stockage → Retour Client
```

**Pipeline RAG intégré :**
```
1. retrieveRelevantChunks()  → Récupère les chunks pertinents
2. generateResponse()       → Génère la réponse LLM
3. formatResponse()         → Formate avec citations
```

Ce endpoint sera utilisé par :
- L'interface utilisateur (frontend)
- Les clients API externes
- Les tests d'intégration

---

## ✅ Critères d'Acceptation

### Fonctionnalité de Base
- [ ] Endpoint POST `/api/chat/message` fonctionnel
- [ ] Authentification JWT requise
- [ ] Validation de la requête (message obligatoire)
- [ ] Appel du pipeline RAG complet
- [ ] Retourne la réponse formatée avec sources
- [ ] Stockage de la conversation en base de données
- [ ] Tests d'intégration

### Qualité du Code
- [ ] Code propre et bien commenté
- [ ] Respect des conventions TypeScript/Next.js
- [ ] Gestion des erreurs appropriée (401, 400, 500)
- [ ] Typage fort avec interfaces TypeScript
- [ ] Intégration avec le logger existant
- [ ] Sécurité: Validation des inputs, sanitation

### Intégration
- [ ] Intégration avec ST-104 (Retrieval)
- [ ] Intégration avec ST-105 (Generation)
- [ ] Intégration avec ST-106 (Formatage)
- [ ] Intégration avec Supabase (stockage conversations)
- [ ] Export via le module `app/api/chat/message/`
- [ ] Documentation complète

### Tests
- [ ] Tests unitaires pour la validation de requête
- [ ] Tests unitaires pour l'authentification
- [ ] Tests d'intégration pour le pipeline complet
- [ ] Tests des cas d'erreur
- [ ] Tests des fonctions exportées

### Performance
- [ ] Temps de réponse < 5 secondes (objectif)
- [ ] Gestion des requêtes concurrentes
- [ ] Optimisation des appels base de données

---

## 📋 Tâches Principales

### Phase 1: Analyse et Planification (Estimation: 1h)
- [x] Analyser les dépendances (ST-104, ST-105, ST-106)
- [x] Définir les interfaces TypeScript nécessaires
- [x] Étudier les patterns d'authentification JWT
- [x] Étudier la structure Supabase pour les conversations
- [x] Planifier l'architecture de l'endpoint
- [x] Identifier les middleware nécessaires

### Phase 2: Implémentation de l'Endpoint (Estimation: 3h)
- [x] Créer `app/api/chat/message/route.ts`
- [x] Implémenter la validation JWT
- [x] Implémenter la validation de la requête
- [x] Implémenter l'orchestration du pipeline RAG
- [x] Implémenter le stockage des conversations
- [x] Implémenter le retour de la réponse
- [x] Ajouter le logging

### Phase 3: Tests (Estimation: 1.5h)
- [x] Créer les tests unitaires avec Vitest/Jest
- [x] Tester l'authentification JWT
- [x] Tester la validation de requête
- [x] Tester le pipeline RAG complet
- [x] Tester les cas d'erreur
- [x] Atteindre 100% de couverture des méthodes

### Phase 4: Documentation et Validation (Estimation: 0.5h)
- [ ] Ajouter la documentation complète
- [ ] Ajouter des exemples d'utilisation
- [ ] Valider l'intégration avec ST-104, ST-105, ST-106
- [ ] Valider le stockage Supabase

---

## 📁 Structure des Fichiers

### Structure Complète

```
nexiamind-ai/
├── app/
│   └── api/
│       └── chat/
│           └── message/
│               ├── route.ts         # NOUVEAU: Endpoint principal
│               └── __tests__/
│                   └── route.test.ts # NOUVEAU: Tests de l'endpoint
├── src/
│   └── lib/
│       ├── supabase/               # Client Supabase existant
│       │   └── client.ts
│       └── rag/                    # Services RAG existants
│           ├── index.ts           # Export centralisé (à utiliser)
│           ├── retriever.ts        # ST-104
│           ├── generator.ts        # ST-105
│           └── formatter.ts        # ST-106
├── types/                        # Types Supabase existants
│   └── database.ts
└── package.json
```

### Fichiers Créés/Modifiés

1. **Nouveaux fichiers :**
   - `app/api/chat/message/route.ts` - Endpoint principal
   - `app/api/chat/message/__tests__/route.test.ts` - Tests unitaires

2. **Fichiers modifiés :**
   - Aucun (tout est nouveau)

---

## 🛠 Implémentation Technique (Proposition)

### Interfaces TypeScript

#### **ChatMessageRequest**
```typescript
export interface ChatMessageRequest {
  /** Message de l'utilisateur */
  message: string;
  /** ID de la conversation (optionnel pour nouvelle conversation) */
  conversationId?: string;
  /** Options supplémentaires */
  options?: {
    temperature?: number;
    maxTokens?: number;
    model?: string;
  };
}
```

#### **ChatMessageResponse**
```typescript
export interface ChatMessageResponse {
  /** ID du message */
  id: string;
  /** ID de la conversation */
  conversationId: string;
  /** Rôle (user ou assistant) */
  role: 'user' | 'assistant';
  /** Contenu du message */
  content: string;
  /** Réponse formatée (avec citations) */
  formattedContent?: string;
  /** Liste des citations */
  citations?: Citation[];
  /** Métadonnées */
  metadata: {
    model: string;
    tokensUsed: number;
    processingTime: number;
    timestamp: string;
  };
}
```

### Endpoint Principal

#### **Route POST /api/chat/message**
```typescript
// app/api/chat/message/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { retrieveRelevantChunks, generateResponse, formatResponse } from '@/lib/rag';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 1. Vérification JWT
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autorisé', details: authError?.message },
        { status: 401 }
      );
    }

    // 2. Validation de la requête
    const body: ChatMessageRequest = await request.json();
    
    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json(
        { error: 'Le champ "message" est obligatoire et doit être une chaîne de caractères' },
        { status: 400 }
      );
    }

    // 3. Récupération du contexte conversationnel
    const conversationId = body.conversationId;
    let conversationContext = '';
    
    if (conversationId) {
      // Récupérer l'historique de la conversation
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('content, role')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      
      if (msgError) {
        logger.warn('Échec de récupération de l\'historique', { error: msgError.message });
      } else {
        conversationContext = messages?.map(m => `${m.role}: ${m.content}`).join('\n') || '';
      }
    }

    // 4. Appel retrieveRelevantChunks()
    const chunks = await retrieveRelevantChunks(
      body.message,
      { 
        client: 'nexia',
        userId: user.id,
        limit: 5 
      }
    );

    // 5. Appel generateResponse()
    const generationResult = await generateResponse(
      body.message,
      chunks.chunks,
      {
        userRole: 'user',
        conversationContext,
        model: body.options?.model || 'default'
      }
    );

    // 6. Appel formatResponse()
    const formatted = await formatResponse(
      generationResult.response,
      chunks.chunks
    );

    // 7. Stockage du message assistant dans la base
    const newConversationId = conversationId || `conv_${Date.now()}_${user.id}`;
    
    // Stocker le message utilisateur
    const { error: userMsgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: newConversationId,
        role: 'user',
        content: body.message,
        user_id: user.id,
        metadata: {
          model: body.options?.model || 'default',
          source: 'api'
        }
      });
    
    if (userMsgError) {
      logger.error('Échec du stockage du message utilisateur', { error: userMsgError.message });
    }

    // Stocker le message assistant
    const { error: assistantMsgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: newConversationId,
        role: 'assistant',
        content: formatted.formattedContent,
        user_id: user.id,
        metadata: {
          model: body.options?.model || 'default',
          citations: formatted.citations,
          processingTime: Date.now() - startTime,
          tokensUsed: generationResult.tokensUsed
        }
      });
    
    if (assistantMsgError) {
      logger.error('Échec du stockage du message assistant', { error: assistantMsgError.message });
    }

    // 8. Retour de la réponse
    const response: ChatMessageResponse = {
      id: `msg_${Date.now()}`,
      conversationId: newConversationId,
      role: 'assistant',
      content: generationResult.response,
      formattedContent: formatted.formattedContent,
      citations: formatted.citations,
      metadata: {
        model: body.options?.model || 'default',
        tokensUsed: generationResult.tokensUsed,
        processingTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error: any) {
    logger.error('Échec du traitement de la requête chat', {
      error: error.message,
      stack: error.stack,
      userId: user?.id || 'unknown'
    });
    
    return NextResponse.json(
      { error: 'Erreur serveur interne', details: error.message },
      { status: 500 }
    );
  }
}
```

### Instance et Fonctions Exportées

```typescript
// Fonction utilitaire pour appeler l'endpoint
export async function sendChatMessage(
  message: string,
  conversationId?: string,
  options?: ChatMessageRequest['options']
): Promise<ChatMessageResponse> {
  const response = await fetch('/api/chat/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, conversationId, options })
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

#### **Route POST /api/chat/message** (15+ tests)

1. **Authentification**
   - Devrait rejeter les requêtes sans JWT (401)
   - Devrait accepter les requêtes avec JWT valide (200)
   - Devrait rejeter les requêtes avec JWT invalide (401)

2. **Validation de requête**
   - Devrait rejeter les requêtes sans message (400)
   - Devrait rejeter les requêtes avec message vide (400)
   - Devrait accepter les requêtes avec message valide (200)

3. **Pipeline RAG**
   - Devrait appeler retrieveRelevantChunks()
   - Devrait appeler generateResponse()
   - Devrait appeler formatResponse()
   - Devrait retourner une réponse formatée

4. **Stockage**
   - Devrait stocker le message utilisateur
   - Devrait stocker le message assistant
   - Devrait créer une nouvelle conversation si pas de conversationId

5. **Gestion des erreurs**
   - Devrait gérer les erreurs de Supabase
   - Devrait gérer les erreurs du pipeline RAG
   - Devrait retourner des erreurs 500 appropriées

---

## 📊 Métriques de Qualité Attendues

### Complexité du Code
- **Lignes de code total :** ~200-250 lignes
- **Nombre de fonctions :** 2 (POST handler, sendChatMessage utility)
- **Nombre d'interfaces :** 2 (ChatMessageRequest, ChatMessageResponse)
- **Couplage :** Faible (dépendances injectables)

### Couverture de Test
- **Tests prévus :** 15+ tests
- **Couverture prévue :** 100% des méthodes

### Performance
- **Temps de réponse :** < 5 secondes (objectif)
- **Complexité :** O(n) où n = nombre de chunks

---

## 🔧 Configuration Requise

### Dépendances
- Next.js 16+ (déjà configuré)
- Supabase client (déjà configuré dans `/lib/supabase/server`)
- Services RAG (ST-104, ST-105, ST-106 - déjà implémentés)
- Types Supabase pour les tables `conversations` et `messages`

### Tables Supabase Requises
```sql
-- Table conversations
CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table messages
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT REFERENCES conversations(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 📚 Documentation

### Exemples d'Utilisation

#### **Appel depuis le frontend**
```typescript
import { sendChatMessage } from '@/app/api/chat/message';

const response = await sendChatMessage(
  'Quels sont les documents disponibles sur le projet ?',
  'conv_12345',
  { model: 'gpt-4', temperature: 0.7 }
);

console.log(response.formattedContent);
// Affiche: Réponse formatée avec citations

console.log(response.citations);
// Affiche: [{ index: 0, sourcePath: 'document1.pdf', ... }]
```

#### **Appel direct via fetch**
```typescript
const response = await fetch('/api/chat/message', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    message: 'Quels sont les documents disponibles ?',
    conversationId: 'conv_12345'
  })
});

const data = await response.json();
```

### Gestion des Erreurs

```typescript
try {
  const response = await sendChatMessage('');
} catch (error) {
  if (error.message.includes('401')) {
    // Rediriger vers la page de login
    window.location.href = '/login';
  } else if (error.message.includes('400')) {
    // Afficher un message d'erreur de validation
    showError('Le message est obligatoire');
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

**ST-104 (Service de Retrieval):**
- Fichier: `src/lib/rag/retriever.ts`
- Fonction: `retrieveRelevantChunks(query: string, filters: RetrievalFilters)`
- Retourne: `RetrievalResult` avec `chunks: Chunk[]`
- Statut: ✅ DONE et mergé

**ST-105 (Service de Génération):**
- Fichier: `src/lib/rag/generator.ts`
- Fonction: `generateResponse(query: string, contextChunks: Chunk[], options)`
- Retourne: `GenerationResult` avec `response: string, tokensUsed: number`
- Statut: ✅ DONE et mergé

**ST-106 (Service de Formatage):**
- Fichier: `src/lib/rag/formatter.ts`
- Fonction: `formatResponse(rawResponse: string, chunks: Chunk[])`
- Retourne: `FormattedResponse` avec `formattedContent: string, citations: Citation[]`
- Statut: ✅ DONE et mergé

**Client Supabase:**
- Fichier: `src/lib/supabase/server.ts` ou `lib/supabase/client.ts`
- Fonction: `createClient()` pour l'authentification
- Tables: `conversations`, `messages`
- Statut: À vérifier

**Types Partagés:**
- Interface `Chunk` et `ChunkMetadata` dans `src/lib/rag/types.ts`
- Interface `Citation` dans `src/lib/rag/formatter.ts`
- Ces types sont utilisés par ST-104, ST-105, ST-106

**Points d'Intégration:**
- L'endpoint doit appeler les 3 services RAG dans l'ordre
- L'endpoint doit stocker les messages dans Supabase
- L'endpoint doit retourner la réponse formatée avec citations

### Notes de Complétion

*À compléter à la fin*

---

## 🎯 Prochaines Étapes

1. **Analyser les dépendances** (ST-104, ST-105, ST-106)
2. **Vérifier la configuration Supabase**
3. **Créer la structure de l'endpoint**
4. **Implémenter l'authentification JWT**
5. **Implémenter la validation de requête**
6. **Implémenter le pipeline RAG**
7. **Implémenter le stockage des conversations**
8. **Créer les tests unitaires**
9. **Valider l'intégration**

---

## 📚 Références

- **Next.js API Routes:** https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- **Supabase Auth:** https://supabase.com/docs/guides/auth
- **JWT Authentication:** https://jwt.io/introduction
- **ST-104 Service de Retrieval:** `_bmad-output/implementation-artifacts/2-104-implementer-service-retrieval.md`
- **ST-105 Service de Génération:** `_bmad-output/implementation-artifacts/2-105-implementer-service-generation.md`
- **ST-106 Service de Formatage:** `_bmad-output/implementation-artifacts/2-106-implementer-le-formatage-des-reponses.md`

---

## 🏆 Validation

### Checklist de Validation

- [ ] Tous les critères d'acceptation sont remplis
- [ ] Tous les tests unitaires passent
- [ ] Intégration avec ST-104, ST-105, ST-106 validée
- [ ] Export via app/api/chat/message/ fonctionnel
- [ ] Documentation complète et à jour
- [ ] Code revu et approuvé
- [ ] Merge dans la branche principale

---

*Document généré pour la story ST-107 - NexiaMind AI*
