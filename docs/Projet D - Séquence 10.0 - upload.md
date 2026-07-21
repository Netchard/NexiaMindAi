# Analyse : Pourquoi les documents uploadés ne sont pas téléchargeables via les liens générés

---

## **🔴 PROBLÈME IDENTIFIÉ**

Les liens générés par l'IA vers vos documents uploadés (ex: `http://localhost:3000/uploads/uploads/1784576327769-mtuqg97b/0-00005355.docx`) **échouent** car l'application tente d'accéder à une URL locale qui n'existe pas, alors que les fichiers sont stockés dans **Supabase Storage** (service cloud).

---

---

## **📊 ANALYSE TECHNIQUE DÉTAILLÉE**

---

### **1️⃣ Où sont stockés les fichiers ?**
- **Destination** : Supabase Storage (bucket `documents`)
- **Chemin réel** : `uploads/1784576327769-mtuqg97b/0-00005355.docx`
- **Preuve** : `src/app/api/documents/upload/route.ts:119` → `storageClient.uploadFile(path, buffer, ...)`

---

### **2️⃣ Comment l'URL est générée ?**
- **Source API** : `{ path: "uploads/1784576327769-mtuqg97b/0-00005355.docx", type: "upload" }`
- **Base URL** : `process.env.NEXT_PUBLIC_UPLOAD_URL || '/uploads'`
- **Code** : `src/lib/api/sources.ts:66` → `` `${baseUrl}/${encodedPath}` ``
- **Résultat** :
  ```
  /uploads/uploads/1784576327769-mtuqg97b/0-00005355.docx
  ```
  → **Double `/uploads/uploads/`** + **pas de route Next.js pour gérer cette URL**

---

### **3️⃣ Pourquoi ça ne marche pas ?**

| Problème | Explication | Preuve |
|----------|-------------|--------|
| **❌ Pas de route Next.js** | Aucune route dans `src/app/` ou `src/app/api/` ne gère `/uploads/...` | `bash: dir C:\...\src\app\api` → Aucun dossier `uploads` |
| **❌ Fichiers dans le cloud** | Les fichiers sont dans **Supabase Storage**, pas dans le filesystem local | `src/lib/supabase/storage/client.ts:168-171` → Upload vers Supabase |
| **❌ Variable manquante** | `NEXT_PUBLIC_UPLOAD_URL` n'est **pas défini** dans `.env.example` | `.env.example:1-103` → Aucune mention de `UPLOAD_URL` |
| **❌ Double préfixe** | Le `path` contient déjà `uploads/`, et `baseUrl` est `/uploads` | `sources.ts:54` + `citations.ts:78` |

---

## **✅ SOLUTIONS (par ordre de recommandation)**

---

---

## **🌟 SOLUTION 1 : URLs Publiques Directes (RECOMMANDÉE)**

**Avantages** : ⚡ Meilleure performance | 💰 Pas de charge serveur | 🔒 Sécurisé via Supabase | 🚀 Solution native

### **Étapes à suivre :**

#### **1. Configurer le bucket Supabase pour l'accès public**
- Allez dans [Supabase Dashboard](https://app.supabase.com) → **Storage** → **Bucket `documents`**
- Cliquez sur **⋮** → **Edit bucket**
- Activez : ✅ **Public access**
- Sauvegardez

#### **2. Ajouter la variable d'environnement**
Dans votre fichier **`.env.local`** :
```env
NEXT_PUBLIC_UPLOAD_URL=https://<votre-project-ref>.supabase.co/storage/v1/object/public/documents
```
> **⚠️ Remplacez** `<votre-project-ref>` par l'identifiant de votre projet Supabase (trouvable dans l'URL de votre dashboard : `https://app.supabase.com/project/<votre-project-ref>`)

#### **3. Corriger la duplication du chemin**
Modifiez **`src/lib/api/sources.ts` ligne 54** :
```typescript
// AVANT (ligne 54) :
const cleanPath = source.path.replace(/^\/+/, '');

// APRÈS :
const cleanPath = source.path.replace(/^uploads\//, '').replace(/^\/+/, '');
```

#### **4. Redémarrer l'application**
```bash
npm run dev
```

#### **5. Test**
- Upload un fichier via `/documents`
- Posez une question à l'IA
- Cliquez sur le lien généré dans la réponse
- ✅ **Le fichier devrait s'ouvrir/télécharger directement**

---
---
### **🔍 Résultat attendu**
- **URL générée** :
  ```
  https://<votre-project-ref>.supabase.co/storage/v1/object/public/documents/1784576327769-mtuqg97b/0-00005355.docx
  ```
- **Comportement** : Le navigateur accède directement au fichier via le CDN Supabase

---

---
## **🛡️ SOLUTION 2 : Route Proxy API (si accès privé requis)**

**À utiliser si** : Vous ne voulez pas exposer directement Supabase Storage.

### **Étapes :**

#### **1. Créer la route proxy**
Créez le fichier **`src/app/api/uploads/[...path]/route.ts`** :
```typescript
import { storageClient } from '@/lib/supabase/storage/client';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathParts } = await params;
  const filePath = pathParts.join('/');

  try {
    const supabase = storageClient.getSupabaseClient();
    const { data: blob, error } = await supabase
      .storage
      .from('documents')
      .download(filePath);

    if (error || !blob) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    return new NextResponse(blob, {
      headers: {
        'Content-Type': blob.type || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${filePath.split('/').pop()}"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
}
```

#### **2. Configurer la variable d'environnement**
Dans **`.env.local`** :
```env
NEXT_PUBLIC_UPLOAD_URL=/api/uploads
```

#### **3. Corriger le chemin**
Modifiez **`src/lib/api/sources.ts` ligne 54** (comme en Solution 1) :
```typescript
const cleanPath = source.path.replace(/^uploads\//, '').replace(/^\/+/, '');
```

#### **4. Redémarrer et tester**
```bash
npm run dev
```
- ✅ Les liens pointeront vers `/api/uploads/1784576327769-mtuqg97b/0-00005355.docx`
- ✅ La route proxy télécharge depuis Supabase et sert le fichier

---

---
## **📝 SOLUTION 3 : Correction Minimale (Rapide mais non optimale)**

**Si vous voulez un fix immédiat sans changer l'architecture** :

1. **Dans `.env.local`** :
   ```env
   NEXT_PUBLIC_UPLOAD_URL=https://<votre-project-ref>.supabase.co/storage/v1/object/public/documents
   ```

2. **Dans `src/lib/api/sources.ts` ligne 54** :
   ```typescript
   const cleanPath = source.path.replace(/^uploads\//, '');
   ```

3. **Activez l'accès public** sur le bucket Supabase `documents`

⚠️ **Limite** : Ne corrige pas complètement la duplication mais fonctionnera dans la plupart des cas.

---

---
---
## **🎯 RECOMMANDATION FINALE**

| Critère | Solution 1 (URLs Publiques) | Solution 2 (Proxy) | Solution 3 (Minimale) |
|---------|-------------------------------|--------------------|-----------------------|
| **Performance** | ⭐⭐⭐⭐⭐ (CDN) | ⭐⭐ (Proxy) | ⭐⭐⭐⭐ (CDN) |
| **Sécurité** | ⭐⭐⭐⭐ (Supabase gère) | ⭐⭐⭐⭐⭐ (Contrôle total) | ⭐⭐⭐ (Supabase gère) |
| **Complexité** | ⭐ (Simple) | ⭐⭐⭐ (Code supplémentaire) | ⭐ (Simple) |
| **Maintenance** | ⭐ (Aucune) | ⭐⭐ (À surveiller) | ⭐ (Aucune) |
| **Coût** | Gratuit (CDN inclus) | Bande passante serveur | Gratuit |

**👉 Utilisez la SOLUTION 1** pour :
- ✅ Performance optimale
- ✅ Simplicité
- ✅ Solution durable

---

---
## **⚠️ POINTS D'ATTENTION IMPORTANTS**

---

### **1. Sécurité du Bucket Supabase**
Si vous activez l'accès public :
- ✅ **Seul** le bucket `documents` doit être public
- ✅ Vérifiez que les politiques **RLS (Row Level Security)** sont activées pour les autres buckets
- ✅ Ne stockez **pas** de fichiers sensibles dans ce bucket

> **🔒 Bonne pratique** : Créez un bucket dédié `public-documents` si vous voulez séparer les fichiers publics des privés.

---

### **2. Cache CDN**
Supabase Storage utilise un CDN avec cache :
- ✅ **Avantage** : Téléchargement rapide pour les fichiers fréquents
- ⚠️ **Inconvénient** : Les mises à jour de fichiers peuvent mettre quelques minutes à être visibles
- **Solution** : Si nécessaire, utilisez des **cache busters** (ajoutez un timestamp ou hash dans l'URL)

---

### **3. Vérification du Chemin**
Vérifiez dans Supabase que vos fichiers sont bien stockés sous :
```
documents/uploads/1784576327769-mtuqg97b/0-00005355.docx
```
et **non** :
```
documents/documents/uploads/...  ❌ (duplication)
```

> **Comment vérifier ?**
> - Dans Supabase Dashboard → Storage → `documents` → Parcourir les fichiers

---

---
## **🔧 DÉPANNAGE**

---

### **Problème : "404 Not Found" après application de la Solution 1**
| Cause Possible | Solution |
|----------------|----------|
| Bucket non public | Activez l'accès public dans Supabase |
| Mauvais project-ref | Vérifiez l'URL dans `.env.local` |
| Fichier non uploadé | Vérifiez que le fichier existe dans Supabase Storage |
| Chemin incorrect | Vérifiez le préfixe `uploads/` dans le path |

---

### **Problème : "403 Forbidden"**
| Cause | Solution |
|-------|----------|
| Bucket privé | Activez l'accès public **OU** utilisez la Solution 2 (proxy) |
| Token manquant | Pour le proxy, assurez-vous que `SUPABASE_ANON_KEY` est configuré |

---
---
### **Problème : Le lien pointe vers `/uploads/uploads/...`**
| Cause | Solution |
|-------|----------|
| Correction non appliquée | Vérifiez que `sources.ts:54` a bien été modifié |
| Cache Next.js | Redémarrez le serveur (`npm run dev`) |
| Variable mal configurée | Vérifiez `.env.local` |

---
---
## **📊 RÉSUMÉ VISUEL**

```mermaid
graph TD
    A[Utilisateur upload un fichier] --> B[Stockage dans Supabase Storage]
    B --> C[Chemin: documents/uploads/123/file.docx]
    C --> D[API retourne: {path: "uploads/123/file.docx", type: "upload"}]
    D --> E[NEXT_PUBLIC_UPLOAD_URL non défini]
    E --> F[baseUrl = '/uploads']
    F --> G[URL générée: /uploads/uploads/123/file.docx]
    G --> H[❌ 404 - Route inexistante]

    D --> I[NEXT_PUBLIC_UPLOAD_URL = URL Supabase]
    I --> J[URL générée: https://.../storage/v1/object/public/documents/123/file.docx]
    J --> K[✅ Accès direct via CDN Supabase]
```

---
---
## **🎯 ACTIONS RÉSUMÉES POUR LA SOLUTION 1**

| Étape | Action | Fichier/Outils |
|-------|--------|---------------|
| 1 | Activer accès public bucket `documents` | [Supabase Dashboard](https://app.supabase.com) |
| 2 | Ajouter `NEXT_PUBLIC_UPLOAD_URL=...` | `.env.local` |
| 3 | Corriger ligne 54 | `src/lib/api/sources.ts` |
| 4 | Redémarrer l'app | Terminal |
| 5 | Tester | Upload un fichier → Poser une question → Cliquer le lien |

**⏱️ Temps estimé** : 5-10 minutes

---
---
## **✨ RESULTAT ATTENDU**

Après application de la **Solution 1** :
```
Lien dans la réponse IA :
🔗 https://<project-ref>.supabase.co/storage/v1/object/public/documents/1784576327769-mtuqg97b/0-00005355.docx

Comportement :
✅ Le navigateur ouvre/télécharge le fichier directement
✅ Pas de 404
✅ Pas de proxy nécessaire
✅ Performant (CDN)
```

---
---
## **📚 DOCUMENTATION COMPLÉMENTAIRE**

- [Supabase Storage - Public Access](https://supabase.com/docs/guides/storage#public-access)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Supabase Storage API](https://supabase.com/docs/reference/javascript/storage-from-download)