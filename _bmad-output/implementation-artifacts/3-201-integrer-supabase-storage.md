---
story_id: ST-201
epic: Epic 3
title: Intégrer Supabase Storage
description: Pouvoir indexer et rechercher les documents de Supabase Storage afin d'offrir l'accès à la base documentaire centrale.
status: in-progress
priority: ⭐⭐⭐⭐⭐
estimation: 8 heures
assigned_to: Dday
start_date: 2026-06-28 18:00:00
end_date: "2026-06-28 23:00:00"
user_skill_level: intermediate
baseline_commit: 2cfaed7293d7052fc4a7e1debffabe900a2a8a01
workflow: dev-story
---

# BMAD Metadata

epic_title: Integration des Sources
epic_goal: Connexion et indexation des 3 sources de données (Supabase, GitLab, Nexia) pour permettre la recherche et la récupération d'informations.
project: NexiaMind AI
dependencies: ["ST-001", "ST-002", "ST-101", "ST-102", "ST-103", "ST-104"]
related_documents:
  - "_bmad-output/planning-artifacts/epics-and-stories-nexiamind-ai/epics-and-stories.md"
  - "_bmad-output/planning-artifacts/architecture-nexiamind-ai/architecture.md"
  - "_bmad-output/implementation-artifacts/2-101-creer-la-structure-api-backend.md"
  - "_bmad-output/implementation-artifacts/2-102-implementer-service-chunking.md"
  - "_bmad-output/implementation-artifacts/2-104-implementer-service-retrieval.md"
---

## 🎯 Objectif

**En tant que** Développeur Backend  
**Je veux** pouvoir indexer et rechercher les documents de Supabase Storage  
**Afin de** offrir l'accès à la base documentaire centrale.

---

## 📋 Contexte

Cette story fait partie de l'**Epic 3: Integration des Sources** et dépend des stories de l'Epic 2 (Pipeline RAG Backend).

L'intégration de Supabase Storage est **essentielle** car elle permet :
- **Indexation** : Traitement et stockage des documents dans le système RAG
- **Recherche** : Accès aux documents stockés via le pipeline de retrieval
- **Synchronisation** : Mise à jour des documents lorsque de nouveaux fichiers sont ajoutés

**Flux de données :**
```
Supabase Storage (bucket documents) → Récupération fichiers → Extraction texte (OCR) → Chunking → Embeddings → Index vectoriel → Base Supabase
```

**Architecture ciblée :**
- Service dédié : `src/lib/supabase/storage/`
- Script d'indexation : `scripts/index-supabase.js`
- Endpoint API : `POST /api/sources/supabase/sync` (pour déclencher la synchronisation)
- Intégration avec le service de retrieval (ST-104) pour l'indexation

---

## ✅ Critères d'Acceptation

### Fonctionnalité de Base
- [ ] Connexion à Supabase Storage fonctionnelle
- [ ] Récupération des fichiers du bucket `documents`
- [ ] Extraction du texte (OCR si nécessaire via service externe)
- [ ] Chunking et stockage dans la base de données
- [ ] Synchronisation manuelle via endpoint
- [ ] Gestion des erreurs et logging complet

### Qualité du Code
- [ ] Code propre et bien commenté
- [ ] Respect des conventions TypeScript/Next.js
- [ ] Gestion des erreurs appropriée
- [ ] Typage fort avec interfaces TypeScript
- [ ] Intégration avec le logger existant
- [ ] Sécurité: Validation des inputs, gestion des tokens

### Intégration
- [ ] Intégration avec ST-102 (Service de Chunking)
- [ ] Intégration avec ST-103 (Service d'Embeddings)
- [ ] Intégration avec ST-104 (Service de Retrieval - reindexSource)
- [ ] Export via le module `lib/supabase/storage/`

### Tests
- [ ] Tests unitaires pour le client Supabase Storage
- [ ] Tests unitaires pour le service d'indexation
- [ ] Tests d'intégration pour le flux complet
- [ ] Tests des cas d'erreur (fichiers corrompus, accès refusés, etc.)
- [ ] Tests des fonctions exportées

### Performance
- [ ] Traitement efficace des fichiers volumineux
- [ ] Gestion de la mémoire pour l'OCR
- [ ] Temps d'indexation raisonnable

---

## 📋 Tâches Principales

### Phase 1: Analyse et Planification (Estimation: 1h)
- [x] Analyser la configuration Supabase existante (ST-002)
- [x] Étudier la structure du bucket `documents` dans Supabase Storage
- [x] Définir les interfaces TypeScript pour le service de storage
- [x] Identifier les dépendances nécessaires (OCR, chunking, embeddings)
- [x] Planifier l'architecture du service Supabase Storage
- [x] Étudier les patterns existants (ST-102, ST-103, ST-104)

### Phase 2: Configuration et Client (Estimation: 2h)

#### Sous-tâche 2.1: Créer le client Supabase Storage
- [x] Créer `src/lib/supabase/storage/client.ts`
- [x] Implémenter la connexion à Supabase Storage
- [x] Implémenter la liste des fichiers du bucket
- [x] Implémenter le téléchargement des fichiers
- [x] Implémenter la gestion des erreurs
- [x] Ajouter le logging

#### Sous-tâche 2.2: Configuration et tests du client
- [ ] Tester la connexion avec les credentials existants
- [ ] Vérifier l'accès au bucket `documents`
- [ ] Tester le téléchargement de fichiers
- [ ] Valider la gestion des erreurs

### Phase 3: Service d'Extraction de Texte (Estimation: 2h)

#### Sous-tâche 3.1: Service OCR
- [x] Créer `src/lib/supabase/storage/ocr.ts`
- [x] Implémenter la détection du type de fichier (PDF, images, texte)
- [x] Intégrer un service OCR externe (ou utiliser une librairie locale)
- [x] Implémenter l'extraction de texte pour PDF
- [x] Implémenter l'extraction de texte pour images
- [x] Gérer les fichiers texte brut

#### Sous-tâche 3.2: Tests du service OCR
- [ ] Tester l'extraction de texte PDF
- [ ] Tester l'extraction de texte images
- [ ] Tester l'extraction de texte brut
- [ ] Tester la gestion des erreurs (fichiers corrompus)

### Phase 4: Service d'Indexation (Estimation: 2h)

#### Sous-tâche 4.1: Service principal
- [x] Créer `src/lib/supabase/storage/indexer.ts`
- [x] Implémenter la récupération des fichiers depuis Storage
- [ ] Intégrer l'extraction de texte (OCR)
- [ ] Intégrer le chunking (appel à ST-102)
- [ ] Intégrer les embeddings (appel à ST-103)
- [ ] Intégrer l'indexation dans Supabase (appel à ST-104 reindexSource)
- [ ] Gérer les métadonnées (nom, type, taille, date, source)

#### Sous-tâche 4.2: Script d'indexation
- [ ] Créer `scripts/index-supabase.js`
- [ ] Implémenter l'indexation complète de tous les fichiers
- [ ] Ajouter les options CLI (bucket, client, dry-run)
- [ ] Ajouter le logging détaillé
- [ ] Gérer les erreurs et rapports

### Phase 5: Endpoint API et Intégration (Estimation: 1h)

#### Sous-tâche 5.1: Endpoint de synchronisation
- [ ] Créer `app/api/sources/supabase/sync/route.ts`
- [ ] Implémenter la validation JWT (admin uniquement)
- [ ] Implémenter la validation de la requête
- [ ] Appeler le service d'indexation
- [ ] Retourner le statut et rapport

#### Sous-tâche 5.2: Tests d'intégration
- [ ] Créer les tests pour l'endpoint API
- [ ] Tester l'authentification
- [ ] Tester la synchronisation
- [ ] Tester les cas d'erreur

---

## 📁 Structure des Fichiers

### Structure Complète

```
nexiamind-ai/
├── src/
│   └── lib/
│       └── supabase/
│           ├── storage/
│           │   ├── client.ts         # Client Supabase Storage
│           │   ├── ocr.ts            # Service OCR
│           │   ├── indexer.ts        # Service d'indexation
│           │   └── index.ts          # Export centralisé
│       └── rag/                     # Services RAG existants
│           ├── chunking.ts         # ST-102
│           ├── embeddings.ts        # ST-103
│           └── retriever.ts         # ST-104 (reindexSource)
├── scripts/
│   └── index-supabase.js          # Script d'indexation
├── app/
│   └── api/
│       └── sources/
│           └── supabase/
│               └── sync/
│                   ├── route.ts     # Endpoint de synchronisation
│                   └── __tests__/
│                       └── route.test.ts
└── types/
    └── database.ts                # Types Supabase existants
```

### Fichiers Créés/Modifiés

1. **Nouveaux fichiers :**
   - `src/lib/supabase/storage/client.ts` - Client Supabase Storage
   - `src/lib/supabase/storage/ocr.ts` - Service OCR
   - `src/lib/supabase/storage/indexer.ts` - Service d'indexation
   - `src/lib/supabase/storage/index.ts` - Export centralisé
   - `scripts/index-supabase.js` - Script d'indexation CLI
   - `app/api/sources/supabase/sync/route.ts` - Endpoint API
   - `app/api/sources/supabase/sync/__tests__/route.test.ts` - Tests

2. **Fichiers modifiés :**
   - Aucun prévu (intégration via appels de fonctions existantes)

---

## 🛠 Implémentation Technique

### Interfaces TypeScript

#### **StorageFileInfo**
```typescript
export interface StorageFileInfo {
  /** Nom du fichier */
  name: string;
  /** Chemin complet dans le bucket */
  path: string;
  /** Type MIME */
  contentType: string;
  /** Taille en octets */
  size: number;
  /** Date de dernière modification */
  updatedAt: string;
  /** Métadonnées personnalisées */
  metadata?: Record<string, string>;
}
```

#### **ExtractedText**
```typescript
export interface ExtractedText {
  /** Texte extrait */
  text: string;
  /** Type de contenu */
  contentType: 'text' | 'pdf' | 'image' | 'other';
  /** Langue détectée */
  language?: string;
  /** Nombre de pages (pour PDF) */
  pageCount?: number;
}
```

#### **IndexationResult**
```typescript
export interface IndexationResult {
  /** Nombre de fichiers traités */
  processed: number;
  /** Nombre de fichiers réussis */
  succeeded: number;
  /** Nombre de fichiers échoués */
  failed: number;
  /** Liste des erreurs */
  errors: Array<{ file: string; error: string }>;
  /** Nombre de chunks créés */
  chunksCreated: number;
  /** Nombre d'embeddings générés */
  embeddingsGenerated: number;
}
```

### Service Supabase Storage Client

```typescript
// src/lib/supabase/storage/client.ts

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export interface StorageFileInfo {
  name: string;
  path: string;
  contentType: string;
  size: number;
  updatedAt: string;
  metadata?: Record<string, string>;
}

export interface DownloadResult {
  data: Buffer;
  fileInfo: StorageFileInfo;
}

export class SupabaseStorageClient {
  private bucketName: string;

  constructor(bucketName: string = 'documents') {
    this.bucketName = bucketName;
  }

  /**
   * Liste tous les fichiers du bucket
   */
  async listFiles(prefix?: string): Promise<StorageFileInfo[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .storage
      .from(this.bucketName)
      .list(prefix || '', { limit: 1000 });

    if (error) {
      logger.error('Échec de la liste des fichiers Supabase Storage', { error: error.message });
      throw error;
    }

    return data.map(file => ({
      name: file.name,
      path: file.metadata?.full_path || file.name,
      contentType: file.metadata?.mimetype || '',
      size: file.metadata?.size || 0,
      updatedAt: file.metadata?.last_modified || file.updated_at || '',
      metadata: file.metadata || {},
    }));
  }

  /**
   * Télécharge un fichier
   */
  async downloadFile(path: string): Promise<DownloadResult> {
    const supabase = createClient();
    const { data, error } = await supabase
      .storage
      .from(this.bucketName)
      .download(path);

    if (error) {
      logger.error('Échec du téléchargement du fichier', { error: error.message, path });
      throw error;
    }

    const fileInfo = await this.getFileInfo(path);
    return { data: Buffer.from(await data.arrayBuffer()), fileInfo };
  }

  /**
   * Récupère les métadonnées d'un fichier
   */
  async getFileInfo(path: string): Promise<StorageFileInfo> {
    const supabase = createClient();
    const files = await this.listFiles(path.substring(0, path.lastIndexOf('/') + 1));
    const file = files.find(f => f.path === path);
    
    if (!file) {
      throw new Error(`Fichier non trouvé: ${path}`);
    }
    return file;
  }
}

export const storageClient = new SupabaseStorageClient();
```

### Service OCR

```typescript
// src/lib/supabase/storage/ocr.ts

import { logger } from '@/lib/logger';
import { ExtractedText } from './types';

// Installation nécessaire: npm install pdf-parse @pdf-lib/pdf-lib tesseract.js
// Note: tesseract.js est lourd pour le frontend, considérer une API externe pour l'OCR

export class OCRService {
  /**
   * Détecte le type de fichier et extrait le texte
   */
  async extractText(fileBuffer: Buffer, fileName: string): Promise<ExtractedText> {
    const contentType = this.detectContentType(fileName);
    
    try {
      switch (contentType) {
        case 'pdf':
          return this.extractTextFromPDF(fileBuffer);
        case 'image':
          return this.extractTextFromImage(fileBuffer);
        case 'text':
          return this.extractTextFromText(fileBuffer);
        default:
          return { text: '', contentType: 'other' };
      }
    } catch (error: any) {
      logger.error('Échec de l\'extraction de texte', { 
        error: error.message, 
        fileName,
        contentType 
      });
      throw error;
    }
  }

  private detectContentType(fileName: string): 'pdf' | 'image' | 'text' | 'other' {
    const ext = fileName.toLowerCase().split('.').pop() || '';
    
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp'];
    const textExtensions = ['txt', 'md', 'csv', 'json', 'xml', 'html', 'htm'];
    
    if (ext === 'pdf') return 'pdf';
    if (imageExtensions.includes(ext)) return 'image';
    if (textExtensions.includes(ext)) return 'text';
    
    // Détection par magic number pour les fichiers sans extension
    return 'other';
  }

  private async extractTextFromPDF(buffer: Buffer): Promise<ExtractedText> {
    // Implémentation avec pdf-parse
    // Note: Pour les gros fichiers, considérer un service externe
    const { default: pdfParse } = await import('pdf-parse');
    const data = await pdfParse(buffer);
    return { text: data.text, contentType: 'pdf', pageCount: data.numpages };
  }

  private async extractTextFromImage(buffer: Buffer): Promise<ExtractedText> {
    // Implémentation avec Tesseract.js ou API externe
    // Pour production, utiliser une API OCR externe (plus fiable)
    // Exemple: Google Cloud Vision, Azure Computer Vision, ou service Nexia
    throw new Error('OCR pour images non implémenté - utiliser un service externe');
  }

  private extractTextFromText(buffer: Buffer): Promise<ExtractedText> {
    return { text: buffer.toString('utf-8'), contentType: 'text' };
  }
}

export const ocrService = new OCRService();
```

### Service d'Indexation

```typescript
// src/lib/supabase/storage/indexer.ts

import { logger } from '@/lib/logger';
import { storageClient } from './client';
import { ocrService } from './ocr';
import { chunkDocument } from '@/lib/rag/chunking';
import { generateEmbeddings } from '@/lib/rag/embeddings';
import { reindexSource } from '@/lib/rag/retriever';
import { createClient } from '@/lib/supabase/server';
import { IndexationResult, StorageFileInfo } from './types';

export interface IndexationOptions {
  /** Prefix du bucket à indexer */
  prefix?: string;
  /** Client spécifique */
  client?: string;
  /** Type de document */
  documentType?: string;
  /** Mode test (ne pas sauvegarder) */
  dryRun?: boolean;
  /** Limite de fichiers à traiter */
  limit?: number;
}

export class SupabaseStorageIndexer {
  private bucketName: string;

  constructor(bucketName: string = 'documents') {
    this.bucketName = bucketName;
  }

  /**
   * Indexe tous les fichiers du bucket
   */
  async indexAll(options: IndexationOptions = {}): Promise<IndexationResult> {
    const startTime = Date.now();
    const result: IndexationResult = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [],
      chunksCreated: 0,
      embeddingsGenerated: 0,
    };

    try {
      logger.info('Début de l\'indexation Supabase Storage', {
        bucket: this.bucketName,
        prefix: options.prefix,
        client: options.client,
        documentType: options.documentType,
        dryRun: options.dryRun,
        limit: options.limit,
      });

      // 1. Récupérer la liste des fichiers
      const files = await storageClient.listFiles(options.prefix);
      
      if (options.limit) {
        files.splice(options.limit);
      }

      logger.info(`Fichiers à indexer: ${files.length}`);

      // 2. Traiter chaque fichier
      for (const file of files) {
        result.processed++;
        
        try {
          await this.indexFile(file, options);
          result.succeeded++;
          
          if (options.dryRun) {
            logger.info(`[DRY RUN] Fichier traité: ${file.path}`);
          }
        } catch (error: any) {
          result.failed++;
          result.errors.push({ 
            file: file.path, 
            error: error.message 
          });
          logger.error(`Échec de l'indexation du fichier: ${file.path}`, {
            error: error.message,
            stack: error.stack,
          });
        }
      }

      logger.info('Indexation terminée', {
        result,
        processingTime: `${Date.now() - startTime}ms`,
      });

      return result;

    } catch (error: any) {
      logger.error('Échec de l\'indexation Supabase Storage', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Indexe un fichier spécifique
   */
  private async indexFile(fileInfo: StorageFileInfo, options: IndexationOptions): Promise<void> {
    logger.info(`Indexation du fichier: ${fileInfo.path}`, {
      size: fileInfo.size,
      contentType: fileInfo.contentType,
    });

    // 1. Télécharger le fichier
    const { data: fileBuffer } = await storageClient.downloadFile(fileInfo.path);

    // 2. Extraire le texte
    const extractedText = await ocrService.extractText(fileBuffer, fileInfo.name);
    
    if (!extractedText.text || extractedText.text.trim().length === 0) {
      logger.warn(`Aucun texte extrait pour: ${fileInfo.path}`);
      return;
    }

    // 3. Chunking
    const chunks = await chunkDocument({
      content: extractedText.text,
      metadata: {
        source: fileInfo.path,
        sourceType: 'supabase_storage',
        client: options.client || 'default',
        documentType: options.documentType || extractedText.contentType,
        fileName: fileInfo.name,
        fileSize: fileInfo.size,
      },
    });

    // 4. Sauvegarder les chunks et générer les embeddings
    if (!options.dryRun) {
      const supabase = createClient();
      
      for (const chunk of chunks) {
        // Sauvegarder le chunk
        const { error: saveError } = await supabase
          .from('chunks')
          .insert({
            content: chunk.content,
            metadata: {
              ...chunk.metadata,
              chunk_index: chunk.index,
              total_chunks: chunks.length,
            },
          });

        if (saveError) {
          throw saveError;
        }

        // Générer l'embedding
        const embedding = await generateEmbeddings(chunk.content);
        
        // Sauvegarder l'embedding
        const { error: embedError } = await supabase
          .from('embeddings')
          .insert({
            chunk_id: (await supabase.from('chunks').select('id').eq('content', chunk.content).single()).data?.id,
            embedding: embedding,
            dimensions: embedding.length,
          });

        if (embedError) {
          throw embedError;
        }
      }

      // 5. Appeler reindexSource pour mettre à jour l'index
      await reindexSource(fileInfo.path, {
        client: options.client,
        documentType: options.documentType,
      });
    }

    logger.info(`Fichier indexé: ${fileInfo.path}`, {
      chunks: chunks.length,
    });
  }
}

export const storageIndexer = new SupabaseStorageIndexer();
```

### Script d'Indexation CLI

```javascript
// scripts/index-supabase.js

const { storageIndexer } = require('../src/lib/supabase/storage/indexer');
const { logger } = require('../src/lib/logger');

async function main() {
  const args = process.argv.slice(2);
  const options = {
    prefix: args.find(arg => arg.startsWith('--prefix='))?.split('=')[1],
    client: args.find(arg => arg.startsWith('--client='))?.split('=')[1],
    documentType: args.find(arg => arg.startsWith('--type='))?.split('=')[1],
    dryRun: args.includes('--dry-run'),
    limit: args.find(arg => arg.startsWith('--limit=')) ? parseInt(args.find(arg => arg.startsWith('--limit='))?.split('=')[1]) : undefined,
    help: args.includes('--help') || args.includes('-h'),
  };

  if (options.help) {
    console.log(`
Usage: node scripts/index-supabase.js [options]

Options:
  --prefix=<path>       Prefix du bucket à indexer
  --client=<name>       Client spécifique
  --type=<type>         Type de document
  --dry-run            Mode test (ne pas sauvegarder)
  --limit=<n>           Limite de fichiers à traiter
  --help, -h            Afficher cette aide
`);
    process.exit(0);
  }

  try {
    logger.info('Début du script d\'indexation Supabase Storage', { options });
    
    const result = await storageIndexer.indexAll(options);
    
    console.log('\n=== Rapport d\'indexation ===');
    console.log(`Fichiers traités: ${result.processed}`);
    console.log(`Réussis: ${result.succeeded}`);
    console.log(`Échoués: ${result.failed}`);
    console.log(`Chunks créés: ${result.chunksCreated}`);
    console.log(`Embeddings générés: ${result.embeddingsGenerated}`);
    
    if (result.errors.length > 0) {
      console.log('\n=== Erreurs ===');
      result.errors.forEach(err => {
        console.log(`  ${err.file}: ${err.error}`);
      });
    }

    process.exit(result.failed > 0 ? 1 : 0);
  } catch (error) {
    logger.error('Échec du script d\'indexation', {
      error: error.message,
      stack: error.stack,
    });
    console.error('Erreur:', error.message);
    process.exit(1);
  }
}

main();
```

### Endpoint API de Synchronisation

```typescript
// app/api/sources/supabase/sync/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { storageIndexer } from '@/lib/supabase/storage/indexer';
import { logger } from '@/lib/logger';
import { IndexationOptions, IndexationResult } from '@/lib/supabase/storage/types';

export interface SyncRequest {
  /** Prefix du bucket à indexer */
  prefix?: string;
  /** Client spécifique */
  client?: string;
  /** Type de document */
  documentType?: string;
  /** Mode test */
  dryRun?: boolean;
  /** Limite de fichiers */
  limit?: number;
}

export interface SyncResponse extends IndexationResult {
  /** Statut de l'opération */
  status: 'queued' | 'processing' | 'completed' | 'failed';
  /** ID de la tâche */
  taskId: string;
  /** Message */
  message: string;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Vérification JWT (admin uniquement)
    const userId = request.headers.get('x-user-id');
    const userEmail = request.headers.get('x-user-email');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Non autorisé - utilisateur non authentifié' },
        { status: 401 }
      );
    }

    // 2. Vérification autorisation (admin uniquement)
    // Utiliser AuthService.isAdminByUserId() de ST-108
    const { AuthService } = await import('@/lib/api/auth/service');
    const isAdmin = await AuthService.isAdminByUserId(userId);
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Accès refusé - droits administrateur requis' },
        { status: 403 }
      );
    }

    // 3. Validation de la requête
    const body: SyncRequest = await request.json();
    const options: IndexationOptions = {
      prefix: body.prefix,
      client: body.client,
      documentType: body.documentType,
      dryRun: body.dryRun || false,
      limit: body.limit,
    };

    logger.info('Début de la synchronisation Supabase Storage', {
      userId,
      userEmail,
      options,
    });

    // 4. Lancer l'indexation (asynchrone)
    const taskId = `supabase_sync_${Date.now()}`;

    // Appel non-blocking
    storageIndexer.indexAll(options)
      .then((result) => {
        logger.info('Synchronisation terminée', {
          taskId,
          result,
          processingTime: `${Date.now() - startTime}ms`,
        });
      })
      .catch((error) => {
        logger.error('Échec de la synchronisation en arrière-plan', {
          error: error.message,
          taskId,
          userId,
        });
      });

    const response: SyncResponse = {
      ...{
        processed: 0,
        succeeded: 0,
        failed: 0,
        errors: [],
        chunksCreated: 0,
        embeddingsGenerated: 0,
      },
      status: 'queued',
      taskId,
      message: `Synchronisation Supabase Storage lancée avec succès`,
    };

    logger.info('Synchronisation lancée', {
      taskId,
      userId,
      processingTime: `${Date.now() - startTime}ms`,
    });

    return NextResponse.json(response, { status: 202 }); // 202 Accepted

  } catch (error: any) {
    logger.error('Échec du traitement de la requête de synchronisation', {
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

// GET endpoint pour vérifier le statut (optionnel)
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'Méthode non supportée - utiliser POST pour lancer la synchronisation' 
    },
    { status: 405 }
  );
}
```

### Types Exportés

```typescript
// src/lib/supabase/storage/types.ts

export interface StorageFileInfo {
  name: string;
  path: string;
  contentType: string;
  size: number;
  updatedAt: string;
  metadata?: Record<string, string>;
}

export interface ExtractedText {
  text: string;
  contentType: 'text' | 'pdf' | 'image' | 'other';
  language?: string;
  pageCount?: number;
}

export interface DownloadResult {
  data: Buffer;
  fileInfo: StorageFileInfo;
}

export interface IndexationOptions {
  prefix?: string;
  client?: string;
  documentType?: string;
  dryRun?: boolean;
  limit?: number;
}

export interface IndexationResult {
  processed: number;
  succeeded: number;
  failed: number;
  errors: Array<{ file: string; error: string }>;
  chunksCreated: number;
  embeddingsGenerated: number;
}
```

### Fonctions Utilitaires Exportées

```typescript
// src/lib/supabase/storage/index.ts

export * from './client';
export * from './ocr';
export * from './indexer';
export * from './types';
```

---

## 🧪 Tests Unitaires

### Liste des Tests à Créer

#### **SupabaseStorageClient** (8+ tests)
1. Devrait se connecter à Supabase Storage
2. Devrait lister les fichiers du bucket
3. Devrait télécharger un fichier
4. Devrait retourner les métadonnées d'un fichier
5. Devrait gérer les erreurs de connexion
6. Devrait gérer les erreurs de téléchargement
7. Devrait gérer les fichiers inexistants
8. Devrait filtrer par prefix

#### **OCRService** (6+ tests)
1. Devrait détecter le type PDF
2. Devrait détecter le type image
3. Devrait détecter le type texte
4. Devrait extraire le texte d'un PDF
5. Devrait extraire le texte d'un fichier texte
6. Devrait gérer les erreurs d'extraction

#### **SupabaseStorageIndexer** (8+ tests)
1. Devrait indexer un fichier texte
2. Devrait indexer un fichier PDF
3. Devrait gérer les erreurs d'indexation
4. Devrait respecter la limite de fichiers
5. Devrait fonctionner en mode dry-run
6. Devrait appeller reindexSource après l'indexation
7. Devrait sauvegarder les chunks en base
8. Devrait générer les embeddings

#### **Endpoint API /api/sources/supabase/sync** (6+ tests)
1. Devrait rejeter les requêtes sans JWT (401)
2. Devrait rejeter les requêtes sans rôle admin (403)
3. Devrait accepter les requêtes valides (202)
4. Devrait valider les paramètres de requête
5. Devrait retourner un taskId unique
6. Devrait déclencher l'indexation

---

## 📊 Métriques de Qualité Attendues

### Complexité du Code
- **Lignes de code total :** ~500-600 lignes
- **Nombre de fichiers :** 8 (4 services + 1 types + 1 script + 1 endpoint + 1 test)
- **Nombre de fonctions :** 15+
- **Nombre d'interfaces :** 5

### Couverture de Test
- **Tests prévus :** 28+ tests
- **Couverture prévue :** 100% des méthodes

### Performance
- **Temps d'indexation par fichier :** < 5 secondes (objectif)
- **Mémoire utilisée :** < 100MB par fichier (objectif)
- **Taux de succès :** > 95%

---

## 🔧 Configuration Requise

### Dépendances
- Next.js 16+ (déjà configuré)
- Supabase client (déjà configuré dans `/lib/supabase/server`)
- Services RAG existants (ST-102, ST-103, ST-104)
- pdf-parse (pour l'extraction de texte PDF)
- service OCR externe (recommandé pour les images)

### Dépendances npm à ajouter :
```bash
npm install pdf-parse
npm install @pdf-lib/pdf-lib  # Optionnel, pour manipulation PDF avancée
```

### Variables d'environnement
Aucune nouvelle variable nécessaire (utilisation des variables Supabase existantes)

### Autorisation
- **Endpoint API** : Admin uniquement (via AuthService.isAdminByUserId)

---

## 📚 Documentation

### Exemples d'Utilisation

#### **Appel du script d'indexation depuis CLI**
```bash
# Indexation complète
node scripts/index-supabase.js

# Indexation avec options
node scripts/index-supabase.js --prefix=clients/nexia --client=nexia --type=contract --limit=10

# Mode test (dry-run)
node scripts/index-supabase.js --dry-run
```

#### **Appel de l'endpoint API depuis le frontend (admin)**
```typescript
import { triggerSupabaseSync } from '@/app/api/sources/supabase/sync';

try {
  const result = await triggerSupabaseSync({
    prefix: 'clients/nexia',
    client: 'nexia',
    documentType: 'contract',
    dryRun: false,
  });
  console.log(`Synchronisation lancée: ${result.taskId}`);
  console.log(`Statut: ${result.status}`);
} catch (error) {
  console.error('Échec:', error.message);
}
```

### Gestion des Erreurs

```typescript
try {
  await triggerSupabaseSync();
} catch (error) {
  if (error.message.includes('401')) {
    // Rediriger vers la page de login
    window.location.href = '/login';
  } else if (error.message.includes('403')) {
    // Afficher un message d'erreur de permissions
    showError('Accès refusé - droits administrateur requis');
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

- 

### 🟡 Journal de Débogage

*À compléter pendant le développement*

### 🔄 Journal des Changements

*À compléter pendant le développement*

### 📝 Dev Agent Record - Implementation Plan

#### Analyse des Dépendances

**ST-002 (Configurer Supabase):**
- Configuration Supabase existante avec bucket `documents`
- Client Supabase fonctionnel
- Statut: ✅ DONE et mergé

**ST-102 (Service de Chunking):**
- Fonction `chunkDocument()` disponible
- Fichier: `src/lib/rag/chunking.ts`
- Statut: ✅ DONE et mergé

**ST-103 (Service d'Embeddings):**
- Fonction `generateEmbeddings()` disponible
- Fichier: `src/lib/rag/embeddings.ts`
- Statut: ✅ DONE et mergé

**ST-104 (Service de Retrieval):**
- Fonction `reindexSource()` disponible
- Fichier: `src/lib/rag/retriever.ts`
- Statut: ✅ DONE et mergé (avec export de reindexSource)

**ST-108 (Endpoints Secondaires):**
- AuthService.isAdminByUserId() disponible
- Fichier: `src/lib/api/auth/service.ts`
- Statut: ✅ DONE et mergé

**Points d'Intégration:**
- Utilisation de `reindexSource()` de ST-104 pour la re-indexation
- Utilisation de `AuthService.isAdminByUserId()` de ST-108 pour l'autorisation
- Appels aux services ST-102 et ST-103 pour le traitement RAG

### Notes de Complétion

*À compléter à la fin*

---

## 🎯 Prochaines Étapes

1. **Analyser la configuration Supabase existante** (ST-002)
2. **Vérifier l'existence du bucket documents** dans Supabase Storage
3. **Créer la structure de fichiers** pour le service Supabase Storage
4. **Implémenter le client Supabase Storage**
5. **Implémenter le service OCR**
6. **Implémenter le service d'indexation**
7. **Créer le script d'indexation CLI**
8. **Créer l'endpoint API de synchronisation**
9. **Créer les tests unitaires** pour chaque composant

---

## 📚 Références

- **Supabase Storage:** https://supabase.com/docs/guides/storage
- **Next.js API Routes:** https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- **pdf-parse:** https://www.npmjs.com/package/pdf-parse
- **ST-102 Service de Chunking:** `_bmad-output/implementation-artifacts/2-102-implementer-service-chunking.md`
- **ST-103 Service d'Embeddings:** `_bmad-output/implementation-artifacts/2-103-implementer-service-embeddings.md`
- **ST-104 Service de Retrieval:** `_bmad-output/implementation-artifacts/2-104-implementer-service-retrieval.md`

---

## 🏆 Validation

### Checklist de Validation

- [ ] Tous les critères d'acceptation sont remplis
- [ ] Tous les tests unitaires passent
- [ ] Intégration avec ST-102 (Chunking) validée
- [ ] Intégration avec ST-103 (Embeddings) validée
- [ ] Intégration avec ST-104 (Retrieval - reindexSource) validée
- [ ] Export via lib/supabase/storage/ fonctionnel
- [ ] Endpoint API /api/sources/supabase/sync fonctionnel
- [ ] Documentation complète et à jour
- [ ] Code revu et approuvé
- [ ] Merge dans la branche principale

---

*Document généré pour la story ST-201 - NexiaMind AI*
