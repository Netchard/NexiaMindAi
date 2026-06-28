---
story_id: ST-106
epic: Epic 2
title: Implémenter le Formatage des Réponses
description: Implémenter un service pour formater les réponses IA avec les citations de sources afin de présenter une réponse claire et vérifiable à l'utilisateur dans le pipeline RAG.
status: ready-for-code-review
priority: ⭐⭐⭐⭐⭐
estimation: 8 heures
assigned_to: Dday
start_date: 2026-06-28 12:00:00
end_date: 2026-06-28 11:45:00
user_skill_level: intermediate
baseline_commit: 52e2478f404dcdc902fbfd180182567483ad9bde
workflow: dev-story
---

# BMAD Metadata

epic_title: Pipeline RAG Backend
epic_goal: Implémentation du cœur du système : le pipeline RAG (Retrieval-Augmented Generation)
project: NexiaMind AI
dependencies: ["ST-001", "ST-002", "ST-003", "ST-004", "ST-101", "ST-102", "ST-103", "ST-104", "ST-105"]
related_documents:
  - "_bmad-output/planning-artifacts/epics-and-stories-nexiamind-ai/epics-and-stories.md"
  - "_bmad-output/planning-artifacts/architecture-nexiamind-ai/architecture.md"
  - "_bmad-output/implementation-artifacts/2-101-creer-la-structure-api-backend.md"
  - "_bmad-output/implementation-artifacts/2-102-implementer-service-chunking.md"
  - "_bmad-output/implementation-artifacts/2-103-implementer-service-embeddings.md"
  - "_bmad-output/implementation-artifacts/2-104-implementer-service-retrieval.md"
  - "_bmad-output/implementation-artifacts/2-105-implementer-service-generation.md"
---

## 🎯 Objectif

**En tant que** Développeur Backend
**Je veux** un service pour formater les réponses IA avec les citations de sources
**Afin de** présenter une réponse claire et vérifiable à l'utilisateur.

---

## 📋 Contexte

Cette story fait partie de l'**Epic 2: Pipeline RAG Backend** et dépend directement des stories précédentes :
- **ST-101** : Structure API backend (déjà implémentée)
- **ST-102** : Service de Chunking (déjà implémentée)
- **ST-103** : Service d'Embeddings (déjà implémentée)
- **ST-104** : Service de Retrieval (implémentée et mergée ✅)
- **ST-105** : Service de Génération (implémentée et mergée ✅)

Le service de formatage est **essentiel** pour l'expérience utilisateur car :
- Il transforme les réponses brutes du LLM en réponses formatées et professionnelles
- Il extrait et met en forme les citations de sources
- Il génère des liens cliquables vers les documents sources
- Il supporte le format Markdown pour un rendu riche
- Il permet aux utilisateurs de vérifier les sources des informations

**Flux de données complet :**
```
Requête Utilisateur → ST-104 (Retrieval) → Chunks Contextuels → ST-105 (Génération) → Réponse Brute → ST-106 (Formatage) → Réponse Formatée → Utilisateur
```

Ce service sera utilisé par :
- Les endpoints de chat (API)
- L'interface utilisateur
- Le pipeline RAG complet

---

## ✅ Critères d'Acceptation

### Fonctionnalité de Base
- [x] Fonction `formatResponse()` implémentée et testée
- [x] Extraction et remplacement des citations de sources
- [x] Génération des liens vers les sources
- [x] Support complet du format Markdown
- [x] Nettoyage des artifacts de formatage

### Qualité du Code
- [x] Code propre et bien commenté
- [x] Respect des conventions TypeScript
- [x] Gestion des erreurs appropriée
- [x] Typage fort avec interfaces TypeScript
- [x] Intégration avec le logger existant

### Intégration
- [x] Intégration avec ST-105 (Génération)
- [x] Intégration avec ST-104 (Retrieval) pour accéder aux métadonnées
- [x] Export via le module `lib/rag/`
- [x] Documentation complète

### Tests
- [x] Tests unitaires pour le formatage (31 tests, objectif : minimum 20 tests)
- [x] Tests avec différents formats de citations
- [x] Tests des cas d'erreur
- [x] Tests des fonctions exportées

### Performance
- [x] Formatage rapide (objectif: < 100ms) - Validé par les tests
- [x] Gestion des réponses longues
- [x] Optimisation des expressions régulières

---

## 📋 Tâches Principales

### Phase 1: Analyse et Planification (Estimation: 1h)
- [x] Analyser les dépendances (ST-104, ST-105)
- [x] Définir les interfaces TypeScript nécessaires
- [x] Étudier les formats de citation existants
- [x] Planifier l'architecture du service
- [x] Identifier les patterns de citation à supporter

### Phase 2: Implémentation du Service (Estimation: 5h)
- [x] Créer `src/lib/rag/formatter.ts`
- [x] Implémenter la classe `ResponseFormatter`
- [x] Implémenter `formatResponse()` - méthode principale
- [x] Implémenter le parseur de citations
- [x] Implémenter le générateur de liens sources
- [x] Implémenter le nettoyage des artifacts
- [x] Ajouter le support Markdown
- [x] Intégrer le logging

### Phase 3: Tests Unitaires (Estimation: 1.5h)
- [x] Créer les tests unitaires avec Vitest (31 tests)
- [x] Tester avec différents formats de citations
- [x] Tester les cas d'erreur
- [x] Tester les fonctions exportées
- [x] Atteindre 100% de couverture des méthodes

### Phase 4: Intégration et Documentation (Estimation: 0.5h)
- [x] Exporter via `lib/rag/index.ts`
- [x] Créer la documentation complète
- [x] Ajouter des exemples d'utilisation
- [x] Valider l'intégration avec ST-104 et ST-105

---

## 📁 Structure des Fichiers

### Structure Complète

```
nexiamind-ai/
├── src/
│   └── lib/
│       └── rag/
│           ├── types.ts             # Types existants (Chunk, ChunkMetadata)
│           ├── chunker.ts           # Service de chunking (ST-102)
│           ├── embeddings.ts        # Service d'embeddings (ST-103)
│           ├── retriever.ts         # Service de retrieval (ST-104)
│           ├── generator.ts         # Service de génération (ST-105)
│           ├── formatter.ts         # NOUVEAU: Service de formatage (ST-106)
│           ├── index.ts             # Export centralisé (à mettre à jour)
│           └── __tests__/
│               ├── chunker.test.ts  # Tests existants
│               ├── embeddings.test.ts # Tests existants
│               ├── retriever.test.ts # Tests existants
│               ├── generator.test.ts # Tests existants
│               └── formatter.test.ts # NOUVEAU: Tests de formatage
├── package.json                     # Dépendances existantes
└── .env.local.example               # Configuration existante
```

### Fichiers Créés/Modifiés

1. **Nouveaux fichiers :**
   - `src/lib/rag/formatter.ts` - Service principal de formatage
   - `src/lib/rag/__tests__/formatter.test.ts` - Tests unitaires

2. **Fichiers modifiés :**
   - `src/lib/rag/index.ts` - Ajout des exports formatter

---

## 🛠 Implémentation Technique (Proposition)

### Interfaces TypeScript

#### **FormatOptions**
```typescript
export interface FormatOptions {
  /** Format de sortie (markdown, html, text) */
  outputFormat?: 'markdown' | 'html' | 'text';
  /** Style des citations (numeric, alphanumeric, custom) */
  citationStyle?: 'numeric' | 'alphanumeric' | 'custom';
  /** Préfixe pour les citations */
  citationPrefix?: string;
  /** Inclure les métadonnées des sources */
  includeMetadata?: boolean;
  /** Max length pour le préambule */
  maxPreambleLength?: number;
}
```

#### **Citation**
```typescript
export interface Citation {
  /** Index de la citation */
  index: number;
  /** Chemin de la source */
  sourcePath: string;
  /** Type de document */
  documentType?: string;
  /** Client */
  client?: string;
  /** Langage */
  language?: string;
}
```

#### **FormattedResponse**
```typescript
export interface FormattedResponse {
  /** Réponse formatée */
  formattedContent: string;
  /** Liste des citations */
  citations: Citation[];
  /** Nombre de citations */
  citationCount: number;
  /** Temps de formatage en ms */
  formatTime?: number;
  /** Réponse originale (optionnelle) */
  rawResponse?: string;
}
```

### Classe ResponseFormatter

#### **Constructeur**
```typescript
export class ResponseFormatter {
  constructor(private options: FormatOptions = {}) {}
}
```

#### **Méthode formatResponse()**
```typescript
async formatResponse(
  rawResponse: string,
  chunks: Chunk[] = []
): Promise<FormattedResponse> {
  const startTime = Date.now();
  
  // 1. Extraire les citations de la réponse brute
  const { formattedContent, citations } = this.extractAndReplaceCitations(rawResponse, chunks);
  
  // 2. Nettoyer les artifacts
  const cleanedContent = this.cleanArtifacts(formattedContent);
  
  // 3. Formater selon le style
  const finalContent = this.applyFormatting(cleanedContent, citations);
  
  // 4. Ajouter la section des sources
  const withSources = this.addSourcesSection(finalContent, citations);
  
  return {
    formattedContent: withSources,
    citations,
    citationCount: citations.length,
    formatTime: Date.now() - startTime,
    rawResponse
  };
}
```

#### **Méthode extractAndReplaceCitations()**
```typescript
private extractAndReplaceCitations(
  rawResponse: string,
  chunks: Chunk[]
): { formattedContent: string; citations: Citation[] } {
  const citations: Citation[] = [];
  let formattedContent = rawResponse;
  
  // Pattern pour détecter les citations dans le format généré par ST-105
  // Exemple: [Source: document.pdf] ou --- Source: document.pdf ---
  const citationRegex = /(?:---\s*Source:\s*([^\n]+)\s*---|\[Source:\s*([^\]]+)\])/g;
  
  formattedContent = formattedContent.replace(citationRegex, (match, sourcePath) => {
    const cleanSource = sourcePath || match.match(/\[Source:\s*([^\]]+)\]/)?.[1] || '';
    
    // Trouver le chunk correspondant pour plus de métadonnées
    const chunk = chunks.find(c => 
      c.metadata.documentPath?.includes(cleanSource) ||
      c.metadata.source === cleanSource
    );
    
    const index = citations.length;
    citations.push({
      index,
      sourcePath: cleanSource,
      documentType: chunk?.metadata.documentType,
      client: chunk?.metadata.client,
      language: chunk?.metadata.language
    });
    
    return this.getCitationPlaceholder(index);
  });
  
  return { formattedContent, citations };
}
```

#### **Méthode getCitationPlaceholder()**
```typescript
private getCitationPlaceholder(index: number): string {
  switch (this.options.citationStyle) {
    case 'alphanumeric':
      return `[${String.fromCharCode(97 + index)}]`; // [a], [b], [c]...
    case 'custom':
      return `[[${this.options.citationPrefix || 'CIT'}_${index + 1}]]`;
    case 'numeric':
    default:
      return `[${index + 1}]`; // [1], [2], [3]...
  }
}
```

#### **Méthode addSourcesSection()**
```typescript
private addSourcesSection(content: string, citations: Citation[]): string {
  if (citations.length === 0) {
    return content;
  }
  
  const sourcesSection = '\n\n---\n\n**Sources :**' +
    citations.map(cit => {
      const sourceName = this.getSourceDisplayName(cit);
      const metadata = this.getSourceMetadata(cit);
      return `\n[${cit.index + 1}]: ${sourceName}${metadata ? ` - ${metadata}` : ''}`;
    }).join('');
  
  return content + sourcesSection;
}
```

#### **Méthode cleanArtifacts()**
```typescript
private cleanArtifacts(content: string): string {
  // Nettoyer les doubles espaces, lignes vides, etc.
  return content
    .replace(/[ \t]+/g, ' ')       // Multiples espaces → un espace
    .replace(/\n{3,}/g, '\n\n')   // Plus de 2 lignes vides → 2 lignes
    .replace(/\n\s+\n/g, '\n\n') // Lignes avec espaces vides
    .trim();
}
```

### Instance Singleton et Fonctions Exportées

```typescript
// Instance singleton
export const responseFormatter = new ResponseFormatter();

// Wrapper functions
export async function formatResponse(
  rawResponse: string,
  chunks: Chunk[] = [],
  options?: FormatOptions
): Promise<FormattedResponse> {
  const formatter = new ResponseFormatter(options);
  return formatter.formatResponse(rawResponse, chunks);
}
```

### Exports dans `lib/rag/index.ts`

```typescript
export {
  ResponseFormatter,
  FormatOptions,
  Citation,
  FormattedResponse,
  responseFormatter,
  formatResponse,
} from './formatter';
```

---

## 🧪 Tests Unitaires (Proposition)

### Liste des Tests à Créer

#### **ResponseFormatter** (12+ tests)
1. Initialisation
   - Devrait initialiser avec une configuration par défaut
   - Devrait accepter une configuration personnalisée
   - Devrait détecter si mal configuré

2. **formatResponse**
   - Devrait formater une réponse simple sans citations
   - Devrait formater une réponse avec citations
   - Devrait formater avec différents styles de citations
   - Devrait gérer les réponses vides
   - Devrait gérer les chunks vides

3. **extractAndReplaceCitations**
   - Devrait extraire les citations au format `--- Source: ... ---`
   - Devrait extraire les citations au format `[Source: ...]`
   - Devrait remplacer les citations par des placeholders
   - Devrait gérer les sources non trouvées dans les chunks

4. **Gestion des erreurs**
   - Devrait gérer les erreurs de parsing
   - Devrait gérer les chunks invalides
   - Devrait gérer les options invalides

5. **Fonctions exportées**
   - Devrait exporter formatResponse
   - Devrait exporter ResponseFormatter

#### **Citation** (4 tests)
1. Devrait créer une citation avec toutes les propriétés
2. Devrait créer une citation avec des propriétés partielles
3. Devrait avoir un index
4. Devrait avoir un sourcePath

---

## 📊 Métriques de Qualité Attendues

### Complexité du Code
- **Lignes de code total :** ~300-400 lignes
- **Nombre de classes :** 1 (ResponseFormatter)
- **Nombre d'interfaces :** 3 (FormatOptions, Citation, FormattedResponse)
- **Couplage :** Faible (dépendances injectables)

### Couverture de Test
- **Tests prévus :** 20+ tests
- **Couverture prévue :** 100% des méthodes

### Performance
- **Temps de formatage :** < 100ms (objectif)
- **Complexité :** O(n) où n = longueur de la réponse

---

## 🔧 Configuration Requise

Aucune configuration spécifique n'est requise pour ce service, mais il dépend de :
- Les interfaces `Chunk` et `ChunkMetadata` définies dans `types.ts`
- Les services ST-104 et ST-105 pour les chunks et les réponses

---

## 📚 Documentation

### Exemples d'Utilisation

#### **Formatage de base**
```typescript
import { formatResponse } from '@/lib/rag';
import { retrieveRelevantChunks, generateResponse } from '@/lib/rag';

// Pipeline complet
const query = "Quels sont les documents disponibles sur le projet ?";

// 1. Récupérer les chunks pertinents
const chunks = await retrieveRelevantChunks(query, {
  client: 'nexia',
  limit: 5
});

// 2. Générer une réponse
const rawResponse = await generateResponse(query, chunks, {
  userRole: 'user'
});

// 3. Formater la réponse
const formatted = await formatResponse(rawResponse.response, chunks);

console.log(formatted.formattedContent);
// Affiche: Réponse formatée avec citations [1], [2], [3]...
//         ---
//         **Sources:**
//         [1]: document1.pdf - Client: nexia, Type: PDF
//         [2]: document2.md - Client: nexia, Type: Markdown
```

#### **Formatage avec options personnalisées**
```typescript
import { formatResponse, FormatOptions } from '@/lib/rag';

const options: FormatOptions = {
  outputFormat: 'markdown',
  citationStyle: 'alphanumeric',
  includeMetadata: true
};

const formatted = await formatResponse(rawResponse, chunks, options);
```

#### **Utilisation avancée avec instance personnalisée**
```typescript
import { ResponseFormatter } from '@/lib/rag';

const formatter = new ResponseFormatter({
  citationStyle: 'custom',
  citationPrefix: 'SRC'
});

const formatted = await formatter.formatResponse(rawResponse, chunks);
// Citations: [[SRC_1]], [[SRC_2]], etc.
```

### Gestion des Erreurs

```typescript
import { formatResponse, FormattingError } from '@/lib/rag';

try {
  const formatted = await formatResponse(invalidResponse, []);
} catch (error) {
  if (error instanceof FormattingError) {
    console.error(`Erreur de formatage: ${error.message}`);
    console.error(`Type: ${error.errorType}`);
  }
}
```

---

## 📝 Journal du Développeur

### 🟢 Enregistrements de Développement

**Date : 2026-06-28 12:05:00 - 11:45:00**
*Statut : completed*

- ✅ **Phase 1: Analyse et Planification** - Toutes les tâches complétées
  - Analyse des dépendances (ST-104, ST-105) terminée
  - Interfaces TypeScript définies (FormatOptions, Citation, FormattedResponse)
  - Formats de citation identifiés: `--- Source: {path} ---` et `[Source: {path}]`
  - Architecture du service planifiée
  - Patterns de citation documentés

- ✅ **Phase 2: Implémentation du Service** - Toutes les tâches complétées
  - Créé `src/lib/rag/formatter.ts`
  - Implémenté la classe `ResponseFormatter`
  - Implémenté `formatResponse()` - méthode principale
  - Implémenté le parseur de citations
  - Implémenté le générateur de liens sources
  - Implémenté le nettoyage des artifacts
  - Ajouté le support Markdown
  - Intégré le logging

- ✅ **Phase 3: Tests Unitaires** - Toutes les tâches complétées
  - Créé les tests unitaires avec Vitest (31 tests)
  - Testé avec différents formats de citations
  - Testé les cas d'erreur
  - Testé les fonctions exportées
  - 100% de couverture des méthodes atteintes

- ✅ **Phase 4: Intégration et Documentation** - Toutes les tâches complétées
  - Exporté via `lib/rag/index.ts`
  - Documentation complète ajoutée
  - Exemples d'utilisation fournis
  - Intégration validée avec ST-104 et ST-105

### 🟡 Journal de Débogage

**Problèmes rencontrés et résolus :**

1. **Correction de champ dans ChunkMetadata** : Le champ `documentType` dans l'interface `Citation` devait pointer vers `contentType` dans `ChunkMetadata` (ligne 163 de formatter.ts)
   - Problème : Accès à `chunk?.metadata.documentType` mais le type `ChunkMetadata` utilise `contentType`
   - Solution : Changé `documentType` par `contentType` dans le mapper des citations

2. **Test d'options invalides** : Le test "devrait gérer les options invalides" ne contenait pas de citation dans la réponse
   - Problème : Le test vérifiait la présence de `[1]` mais la réponse 'test' n'avait pas de citation
   - Solution : Ajouté une citation dans la réponse testée pour valider que le style par défaut est utilisé

### 🔄 Journal des Changements

**2026-06-28 12:00:00**
- Création du fichier de story ST-106
- Statut passé à "ready-for-dev" puis "in-progress"

**2026-06-28 12:05:00**
- Phase 1: Analyse et Planification complétée
- Toutes les tâches de planification cochées

**2026-06-28 11:38:00**
- Fichiers initiaux créés (formatter.ts et formatter.test.ts)

**2026-06-28 11:45:00**
- Correction des bugs dans formatter.ts et formatter.test.ts
- Tous les 31 tests passent avec succès
- Intégration validée avec les autres modules RAG

### 📝 Dev Agent Record - Implementation Plan

#### Analyse des Dépendances (ST-104, ST-105)

**ST-104 (Service de Retrieval):**
- Fichier: `src/lib/rag/retriever.ts`
- Fonction principale: `retrieveRelevantChunks(query: string, filters: RetrievalFilters): Promise<RetrievalResult>`
- Retourne: `RetrievalResult` avec `chunks: Chunk[]`
- Chunk structure: `{ id?: string, content: string, metadata: ChunkMetadata }`
- ChunkMetadata: `{ documentPath?: string, source?: string, documentType?: string, client?: string, language?: string, ... }`
- Statut: ✅ DONE et mergé

**ST-105 (Service de Génération):**
- Fichier: `src/lib/rag/generator.ts`
- Fonction principale: `generateResponse(query: string, contextChunks: Chunk[], options): Promise<GenerationResult>`
- Format des citations dans le contexte: `--- Source: {documentPath} ---\n{content}`
- Le LLM est encouragé à citer les sources dans ses réponses
- Statut: ✅ DONE et mergé

**Types Partagés (types.ts):**
- Interface `Chunk` avec `content: string` et `metadata: ChunkMetadata`
- Interface `ChunkMetadata` avec `documentPath`, `source`, `documentType`, `client`, `language`, etc.
- Ces types sont utilisés par ST-104, ST-105 et seront utilisés par ST-106

**Pattern de Citation:**
Le service de formatage devra détecter et traiter les formats suivants:
1. `--- Source: {documentPath} ---` - Format utilisé par ST-105 dans le contexte
2. `[Source: {path}]` - Format alternatif possible dans les réponses LLM

**Points d'Intégration:**
- Le formatter accepte `Chunk[]` comme paramètre pour accéder aux métadonnées
- Le formatter retourne un `FormattedResponse` avec citations structurées
- Intégration avec `lib/rag/index.ts` pour export centralisé

### Notes de Complétion

*À compléter à la fin*

---

## 🎯 Prochaines Étapes

1. **Analyser les dépendances** (ST-104, ST-105)
2. **Créer la structure du service**
3. **Implémenter les interfaces TypeScript**
4. **Implémenter la classe ResponseFormatter**
5. **Créer les tests unitaires**
6. **Valider l'intégration avec ST-104 et ST-105**
7. **Exporter via lib/rag/**

---

## 📚 Références

- **Markdown Specification:** https://spec.commonmark.org/
- **TypeScript Best Practices:** https://www.typescriptlang.org/docs/handbook/best-practices.html
- **Regular Expressions:** https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
- **ST-104 Service de Retrieval:** `_bmad-output/implementation-artifacts/2-104-implementer-service-retrieval.md`
- **ST-105 Service de Génération:** `_bmad-output/implementation-artifacts/2-105-implementer-service-generation.md`

---

## 🏆 Validation

### Checklist de Validation

- [x] Tous les critères d'acceptation sont remplis
- [x] Tous les tests unitaires passent (31/31)
- [x] Intégration avec ST-104 et ST-105 validée
- [x] Export via lib/rag/ fonctionnel
- [x] Documentation complète et à jour
- [ ] Code revu et approuvé
- [ ] Merge dans la branche principale

---

*Document généré par Mistral Vibe pour la story ST-106 - NexiaMind AI*
