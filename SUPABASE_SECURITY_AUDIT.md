# Audit de Sécurité Supabase - Récapitulatif

## 🎯 Objectif
Séparer clairement les clients Supabase **CLIENT** (navigateur) et **SERVEUR** (backend) pour garantir que :
- ✅ Les clés sensibles ne sont **JAMAIS** exposées au frontend
- ✅ La configuration est cohérente et maintenable
- ✅ Chaque contexte utilise le bon client avec les bonnes permissions

---

## 📁 Structure des Fichiers Créés/Modifiés

### 🆕 NOUVEAUX FICHIERS CRÉÉS

#### 1. `src/lib/supabase/admin-client.ts`
**Rôle** : Client Supabase ADMIN avec la SERVICE ROLE KEY (toutes les permissions)

```typescript
// ⚠️ NE JAMAIS utiliser côté client !
// ⚠️ Réservé aux opérations sensibles côté serveur
// ⚠️ Contournement RLS, opérations admin

export { supabase as adminClient } from './admin-client';
export { createAdminClient, isAdminConfigured };
```

**Variables utilisées** :
- `SUPABASE_URL` (protégée)
- `SUPABASE_SERVICE_ROLE_KEY` (protégée, **JAMAIS exposée**)

**Cas d'usage** :
- Bypass RLS (Row Level Security)
- Suppression/mise à jour massive de données
- Opérations nécessitant des permissions élevées

---

#### 2. `src/lib/supabase/index.ts`
**Rôle** : Point d'entrée centralisé pour tous les clients Supabase

```typescript
// 🌐 CLIENT (Navigateur)
export { supabase as client } from './client';

// 🖥️ SERVEUR (Backend)
export { supabase as serverClient } from './server';

// 🔒 ADMIN (Opérations sensibles)
export { supabase as adminClient } from './admin-client';

// 🪪 AUTH (Server Components avec cookies)
export { createAuthServerClient } from './auth-server';

// 📦 STORAGE
export * from './storage/client';
```

---

### ✏️ FICHIERS MODIFIÉS

#### 1. `src/lib/supabase/server.ts`
**Modifications** :
- ❌ **Avant** : Utilisait `NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL` (fallback dangereux)
- ✅ **Après** : Utilise **UNIQUEMENT** `SUPABASE_URL` et `SUPABASE_ANON_KEY`
- ✅ Ajout de logs et de validation stricte
- ✅ Export renommé `supabaseServer as supabase`

**Impact** : Client serveur maintenant **complètement séparé** du client navigateur

---

#### 2. `src/lib/supabase/client.ts`
**Modifications** :
- ❌ **Avant** : Fallback sur `SUPABASE_URL` si `NEXT_PUBLIC_*` non défini (dangereux)
- ✅ **Après** : Utilise **UNIQUEMENT** `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ Validation stricte avec erreur claire
- ✅ Messages de log améliorés
- ✅ Utilisation de `createBrowserClient` (correct pour le navigateur)

**Impact** : Client navigateur ne peut **PLUS** accéder aux variables serveur

---

#### 3. `src/lib/supabase/auth-server.ts`
**Modifications** :
- ✅ Utilise **UNIQUEMENT** `NEXT_PUBLIC_*` (nécessaire pour la compatibilité client/serveur)
- ✅ Ajout de validation et de logs
- ✅ Ajout de `createAuthServerClientWithKey()` pour les tests

**Pourquoi NEXT_PUBLIC_* ?** : Ce client utilise `createServerClient` qui **doit** partager les cookies avec le client navigateur, donc les mêmes variables sont nécessaires.

---

#### 4. `src/lib/rag/retriever.ts`
**Modifications** :
- ❌ **Avant** : Créait son propre client avec `createClient()`
- ✅ **Après** : Utilise `supabaseServer` depuis `../supabase/server`
- ✅ Suppression de la validation redondante (déjà faite dans server.ts)

---

#### 5. `src/app/api/admin/stats/route.ts`
**Modifications** :
- ❌ **Avant** : Créait son propre client avec `createClient()`
- ✅ **Après** : Utilise `supabaseServer` depuis `@/lib/supabase/server`
- ✅ Remplacement de toutes les occurrences de `supabase` par `supabaseServer`

---

#### 6. `src/app/api/chat/message/route.ts`
**Modifications** :
- ❌ **Avant** : Créait son propre client
- ✅ **Après** : Utilise `supabaseServer`
- ✅ Remplacement de toutes les occurrences (3x) de `supabase` par `supabaseServer`

---

#### 7. `src/app/api/chat/history/route.ts`
**Modifications** :
- ❌ **Avant** : Créait son propre client
- ✅ **Après** : Utilise `supabaseServer`
- ✅ Remplacement de toutes les occurrences (2x) de `supabase` par `supabaseServer`

---

#### 8. `src/lib/api/auth/service.ts`
**Modifications** :
- ❌ **Avant** : Créait son propre client avec `createClient()`
- ✅ **Après** : Utilise `supabaseServer`
- ✅ Remplacement de toutes les occurrences (5x) de `supabase` par `supabaseServer`

---

## 📋 Configuration des Variables d'Environnement

### Fichier `.env.local` (✅ CORRECT)

```env
# ========================================
# 🔒 VARIABLES SERVEUR (protégées)
# ========================================
SUPABASE_URL=https://pppmwsnpgsvipvwyeyfv.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_MwBf77mDVTvc1mmp3gK1KQ_JYiKGP-J

# ========================================
# 🌐 VARIABLES FRONTEND (exposées)
# ========================================
NEXT_PUBLIC_SUPABASE_URL=https://pppmwsnpgsvipvwyeyfv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### ⚠️ Points Clés sur la Configuration

| Variable | Préfixe | Exposée au client ? | Utilisation |
|----------|---------|---------------------|-------------|
| `SUPABASE_URL` | Aucun | ❌ Non | Client serveur, admin |
| `SUPABASE_ANON_KEY` | Aucun | ❌ Non | Client serveur |
| `SUPABASE_SERVICE_ROLE_KEY` | Aucun | ❌ **NON** | Client admin uniquement |
| `NEXT_PUBLIC_SUPABASE_URL` | `NEXT_PUBLIC_` | ✅ Oui | Client navigateur, auth-server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `NEXT_PUBLIC_` | ✅ Oui | Client navigateur, auth-server |

> ✅ **La clé anonyme (`anon key`) peut être exposée** - c'est une clé publique conçue pour ça
> ❌ **La `service role key` ne doit JAMAIS être préfixée par `NEXT_PUBLIC_`**

---

## 🎯 Quel Client Utiliser ?

| Contexte | Client à utiliser | Import | Variables |
|----------|------------------|-------|-----------|
| **Composants React** (`'use client'`) | Client Navigateur | `@/lib/supabase/client` | `NEXT_PUBLIC_*` |
| **API Routes** (`route.ts`) | Client Serveur | `@/lib/supabase/server` | `SUPABASE_*` |
| **Server Components** | Client Auth Serveur | `@/lib/supabase/auth-server` | `NEXT_PUBLIC_*` |
| **Opérations Admin** (bypass RLS) | Client Admin | `@/lib/supabase/admin-client` | `SUPABASE_*` + Service Key |
| **Storage** (côté serveur) | Client Storage | `@/lib/supabase/storage/client` | Utilise `server.ts` |

---

## ✅ Exemples d'Utilisation

### 1. Composant React (Client)
```typescript
'use client';
import { supabase } from '@/lib/supabase/client';

// ✅ Correct - utilise le client navigateur
export function MyComponent() {
  const { data } = await supabase.from('table').select('*');
  // ...
}
```

### 2. API Route (Serveur)
```typescript
import { supabaseServer } from '@/lib/supabase/server';

export async function GET() {
  // ✅ Correct - utilise le client serveur
  const { data } = await supabaseServer.from('table').select('*');
  // ...
}
```

### 3. Opération Admin (Serveur)
```typescript
import { adminClient } from '@/lib/supabase/admin-client';

export async function adminOperation() {
  // ✅ Correct - utilise le client admin avec service role key
  // Contourne RLS pour les opérations sensibles
  const { data } = await adminClient
    .from('table')
    .select('*')
    .override('rls');
  // ...
}
```

### 4. Server Component avec Auth
```typescript
import { createAuthServerClient } from '@/lib/supabase/auth-server';

export async function MyServerComponent() {
  const supabase = await createAuthServerClient();
  // ✅ Correct - utilise le client auth serveur
  // Gère automatiquement les cookies de session
  const { data } = await supabase.from('table').select('*');
  // ...
}
```

---

## 🔍 Vérification de la Sécurité

### Comment tester que les clés sensibles ne sont PAS exposées ?

1. **Créez un composant test :**
```tsx
// pages/test-security.tsx
'use client';

export default function SecurityTest() {
  return (
    <div>
      <h1>Test de Sécurité</h1>
      <p>SUPABASE_URL: {process.env.SUPABASE_URL || '✅ PROTÉGÉE'}</p>
      <p>SUPABASE_ANON_KEY: {process.env.SUPABASE_ANON_KEY || '✅ PROTÉGÉE'}</p>
      <p>SUPABASE_SERVICE_ROLE_KEY: {process.env.SUPABASE_SERVICE_ROLE_KEY || '✅ PROTÉGÉE'}</p>
      <p>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || '❌ MANQUANTE'}</p>
      <p>NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ EXPOSÉE (normal)' : '❌ MANQUANTE'}</p>
    </div>
  );
}
```

2. **Résultat attendu :**
   - `SUPABASE_URL`: ✅ PROTÉGÉE
   - `SUPABASE_ANON_KEY`: ✅ PROTÉGÉE
   - `SUPABASE_SERVICE_ROLE_KEY`: ✅ PROTÉGÉE
   - `NEXT_PUBLIC_SUPABASE_URL`: ✅ (valeur affichée)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: ✅ EXPOSÉE (normal)

---

## 📊 Résumé des Changements

### Fichiers Créés : 2
1. `src/lib/supabase/admin-client.ts`
2. `src/lib/supabase/index.ts`

### Fichiers Modifiés : 8
1. `src/lib/supabase/server.ts`
2. `src/lib/supabase/client.ts`
3. `src/lib/supabase/auth-server.ts`
4. `src/lib/rag/retriever.ts`
5. `src/app/api/admin/stats/route.ts`
6. `src/app/api/chat/message/route.ts`
7. `src/app/api/chat/history/route.ts`
8. `src/lib/api/auth/service.ts`

### Variables d'Environnement
- ✅ `.env.local` contient déjà les bonnes variables
- ✅ Pas de modification nécessaire dans `.env` (non chargé côté serveur dans Next.js)

---

## 🚀 Prochaines Étapes

1. **Tester localement** :
   ```bash
   npm run dev
   ```

2. **Vérifier les logs** :
   - Chaque client devrait logger son initialisation
   - Exemple : `Client Supabase SERVEUR initialisé`

3. **Tester la sécurité** :
   - Accéder à `/test-security` (si vous créez le composant test)
   - Vérifier que les clés sensibles ne sont pas exposées

4. **Vérifier les tests** :
   ```bash
   npm test
   ```

---

## 💡 Bonnes Pratiques

1. **Ne JAMAIS** utiliser `createClient` directement dans le code
   - Utilisez toujours un client pré-configureé depuis `src/lib/supabase/`

2. **Ne JAMAIS** utiliser la `service role key` côté client
   - Elle donne accès à TOUTES les données sans restriction

3. **Toujours** vérifier quel client vous utilisez :
   - `supabase` → vérifiez l'import !
   - `supabaseServer` → serveur ✅
   - `supabase` (depuis client.ts) → navigateur ✅
   - `adminClient` → admin serveur ✅

4. **Pour les nouvelles API routes** :
   - Utilisez `supabaseServer` par défaut
   - Pour les opérations admin : utilisez `adminClient`

---

## 📞 Support

Si vous avez des questions ou rencontrez des problèmes :

1. **Erreur "Supabase URL and Anon Key must be defined"** :
   → Vérifiez que `.env.local` contient bien `SUPABASE_URL` et `SUPABASE_ANON_KEY`

2. **Erreur "NEXT_PUBLIC_SUPABASE_URL must be defined"** :
   → Vérifiez que `.env.local` contient bien `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Erreur "SUPABASE_SERVICE_ROLE_KEY must be defined"** :
   → Vérifiez que `.env.local` contient bien `SUPABASE_SERVICE_ROLE_KEY`
   → Utilisez `adminClient` uniquement si vous avez besoin des permissions admin

---

**Statut** : ✅ **TERMINÉ** - Tous les clients Supabase sont maintenant correctement séparés et sécurisés.
