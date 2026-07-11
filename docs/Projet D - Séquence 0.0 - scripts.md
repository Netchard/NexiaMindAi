Voici **toutes les commandes CLI disponibles** pour alimenter votre pipeline RAG depuis les documents stockés :

---

## 🎯 **COMMANDE PRINCIPALE (Recommandée)**

### **Indexer TOUTES les sources (Supabase + GitLab + Nexia)**

```bash
# Méthode 1 : Via npm
npm run index:all

# Méthode 2 : Directement
node scripts/index-all.js
```

---

## 🗂️ **COMMANDES SPÉCIFIQUES PAR SOURCE**

### **1. Supabase Storage UNIQUEMENT**

```bash
# Indexation complète
npx ts-node scripts/index-supabase.ts

# Avec options
npx ts-node scripts/index-supabase.ts --prefix="documents/" --client="nexia" --type="pdf" --limit=100
```

### **2. GitLab UNIQUEMENT**

```bash
node scripts/index-gitlab.js
```

---

## ⚙️ **OPTIONS DISPONIBLES**

| Option | Script | Description |
|--------|--------|-------------|
| `--prefix=<path>` | `index-supabase.ts` | Chemin/préfixe dans le bucket |
| `--client=<name>` | `index-supabase.ts`, `index-all.js` | Filtrer par client |
| `--type=<type>` | `index-supabase.ts`, `index-all.js` | Type de document (pdf, docx, etc.) |
| `--dry-run` | `index-all.js`, `index-supabase.ts` | **Test sans sauvegarde** |
| `--limit=<n>` | `index-all.js`, `index-supabase.ts` | Limite de fichiers à traiter |
| `--bucket=<name>` | `index-supabase.ts` | Nom du bucket (défaut: `documents`) |

---

## 📡 **EXEMPLES PRATIQUES**

### **Indexer Supabase Storage pour le client "nexia"**
```bash
npx ts-node scripts/index-supabase.ts --client=nexia
```

### **Tester sans modifier la base (dry-run)**
```bash
npm run index:all:dry
# ou
npx ts-node scripts/index-supabase.ts --dry-run
```

### **Indexer uniquement les PDFs dans un dossier spécifique**
```bash
npx ts-node scripts/index-supabase.ts --prefix="documents/contrats/" --type=pdf --limit=50
```

---

## 🌐 **VIA API (Pour l'UI)**

Si vous préférez déclencher depuis l'interface ou un script distant :

```bash
# Rafraîchir une source spécifique
curl -X POST http://localhost:3000/api/chat/refresh \
  -H "Content-Type: application/json" \
  -H "x-user-id: user123" \
  -d '{"sourceId": "supabase", "client": "nexia"}'
```

---

## 📝 **RÉSUMÉ DES SCRIPTS DISPONIBLES**

| Commande | Script | Source | Dry-run |
|----------|--------|--------|---------|
| `npm run index:all` | `scripts/index-all.js` | ✅ Toutes | ❌ |
| `npm run index:all:dry` | `scripts/index-all.js` | ✅ Toutes | ✅ |
| `npx ts-node scripts/index-supabase.ts` | `scripts/index-supabase.ts` | ✅ Supabase | ❌ |
| `node scripts/index-gitlab.js` | `scripts/index-gitlab.js` | ✅ GitLab | ❌ |

---

## 💡 **RECOMMANDATION**

Pour **alimenter le RAG depuis Supabase Storage** :

```bash
# Pour un rafraîchissement complet de tous les documents
npm run index:all

# Pour tester sans risque avant de lancer en production
npm run index:all:dry
```

**⚠️ Important** : Assurez-vous que vos variables d'environnement sont correctement configurées :
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (pour les opérations admin)
- `MISTRAL_API_KEY` (pour générer les embeddings)

---

**Le script `npm run index:all` est la commande principale qui orchestrera l'indexation de toutes vos sources, y compris Supabase Storage.**