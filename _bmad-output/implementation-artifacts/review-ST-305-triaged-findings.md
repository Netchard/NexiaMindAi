# ST-305 Code Review - Triage des Findings

**Story:** ST-305 - Afficher les Citations de Sources  
**Date:** 2026-07-08  
**Review Mode:** full (avec spec file)  
**Diff Source:** Uncommitted changes (15 fichiers, ~750 lignes)  
**Layers Executed:** Blind Hunter, Edge Case Hunter, Acceptance Auditor  
**Failed Layers:** aucune

---

## 📊 **Résumé du Triage**

| Catégorie | Count | À Fixer | Décision Requise | Différé | Rejeté |
|----------|-------|---------|------------------|---------|--------|
| **Total Brut** | 49 | - | - | - | - |
| **Après Deduplication** | 34 | - | - | - | - |
| **Classés** | 34 | 22 | 4 | 5 | 3 |

---

## 🎯 **Findings Classés par Priorité**

### 🔴 **CRITICAL - À FIXER AVANT MERGE (22 issues)**

#### **1. Bugs Bloquants**

| # | Titre | Source | Location | Classification | Détails |
|---|-------|--------|----------|---------------|---------|
| **1** | Prop `citations` non destructurée dans ChatMessage | blind | `ChatMessage.tsx:19` | **patch** | `citations` est dans l'interface (l.10) mais pas destructuré, utilisé à la l.54 → TypeScript error + crash |
| **2** | Liens avec URLs vides affichés | blind+edge | `SourceCitation.tsx:69-71`, `sources.ts:56` | **patch** | `url: url || ''` crée href="" invalide quand getSourceUrl retourne null (type inconnu) |
| **3** | Focus supprimé des liens (WCAG 2.4.7) | blind+auditor | `SourceCitation.tsx:126-128` | **patch** | `.source-citation-link:focus { outline: none }` viole l'accessibilité. **AC #7 VIOLATED** |
| **4** | Sélecteur CSS `:not(:disabled)` invalide | blind | `SourceCitation.tsx:108` | **patch** | `:not(:disabled)` sur `<li>` ne fonctionne jamais (li ne peut pas être disabled) |
| **5** | Tableau `citations` null casse le rendu | edge | `SourceCitationList.tsx:31` | **patch** | `citations.length` lance une erreur si `citations` est null (vs undefined) |

#### **2. Validation Manquante (Null/Undefined Checks)**

| # | Titre | Source | Location | Classification | Détails |
|---|-------|--------|----------|---------------|---------|
| **6** | `getSourceUrl` : param `source` non validé | edge | `sources.ts:15-16` | **patch** | Pas de check si `source` est null/undefined |
| **7** | `getSourceUrl` : type assertion bypass | edge | `sources.ts:23` | **patch** | `config[type as keyof SourceUrlConfig]` contourne la sécurité TypeScript |
| **8** | `getSourceUrl` : config values null/undefined | edge | `sources.ts:23-28` | **patch** | `!baseUrl` check ne gère pas les null explicites |
| **9** | `isValidSource` : param `source` non validé | edge | `sources.ts:85-93` | **patch** | Pas de check null/undefined |
| **10** | `isValidSource` : source.type non validé | edge | `sources.ts:88` | **patch** | `validTypes.includes(source.type)` lance une erreur si undefined |
| **11** | `isValidSource` : path as number/object | edge | `sources.ts:89-91` | **patch** | Si path est un nombre, `.trim()` lance une erreur |
| **12** | `filterAndConvertSources` : éléments null dans array | edge | `sources.ts:110` | **patch** | `isValidSource(null)` lance une erreur, devrait filtrer null d'abord |

#### **3. Génération d'URLs**

| # | Titre | Source | Location | Classification | Détails |
|---|-------|--------|----------|---------------|---------|
| **13** | Caractères spéciaux non encodés dans URLs | edge | `sources.ts:34` | **patch** | Espaces, #, ?, & dans path cassent l'URL. Utiliser `encodeURIComponent()` |
| **14** | Multiple leading slashes non normalisés | edge | `sources.ts:31` | **patch** | `///path` devient `/path` puis `//path`. Utiliser `replace(/^\/+/, '')` |
| **15** | Path vide produit URL malformée | edge | `sources.ts:34` | **patch** | Si path est "/" ou "///", `cleanPath` est vide, retourne `baseUrl/` |

#### **4. Intégration & Rendering**

| # | Titre | Source | Location | Classification | Détails |
|---|-------|--------|----------|---------------|---------|
| **16** | Liens désactivés toujours navigables | blind | `SourceCitation.tsx:69-91` | **patch** | Clic droit "Ouvrir dans nouvel onglet" contourne la prévention onClick |
| **17** | response.sources null non géré | edge | `page.tsx:109` | **patch** | `filterAndConvertSources(null)` lance une erreur |
| **18** | Mêmes sources en double = clés dupliquées | edge | `sources.ts:52`, `SourceCitation.tsx:71` | **patch** | Si même source apparaît 2x, `key={citation.id}` cause des warnings React |

#### **5. Génération d'IDs**

| # | Titre | Source | Location | Classification | Détails |
|---|-------|--------|----------|---------------|---------|
| **19** | IDs non sûrs avec caractères spéciaux | blind+edge | `sources.ts:52` | **patch** | Paths comme `file#1.pdf` ou `doc with spaces.txt` créent des IDs CSS invalides |

---

### 🟡 **DECISION NEEDED - Choix Architectural (4 issues)**

| # | Titre | Source | Location | AC/Constraint | Détails |
|---|-------|--------|----------|--------------|---------|
| **20** | URLs de base hardcodées | blind | `citations.ts:74-78` | - | `DEFAULT_SOURCE_URL_CONFIG` contient des URLs de production. Faut-il utiliser des env vars ? |
| **21** | Valeurs de couleurs magiques | blind | `SourceCitation.tsx:11-20`, `SourceCitationList.tsx:12-20` | AC #6 | Couleurs dupliquées dans deux fichiers. Faut-il utiliser des CSS vars ou tokens partagés ? |
| **22** | Niveau de titre hardcodé | blind | `SourceCitationList.tsx:48-58` | - | `<h4>` utilisé sans contexte de hiérarchie. Quel niveau est approprié ? |
| **23** | Métadonnées : "nom" vs "chemin" | auditor | SourceCitation.tsx:90 | **AC #5** | Seulement `path` est affiché. Le spec demande "nom/chemin". Est-ce que `path` suffit pour "nom" ? |

---

### 🟢 **DEFER - Problèmes Pré-existants (5 issues)**

| # | Titre | Source | Location | Raison |
|---|-------|--------|----------|--------|
| **24** | Emoji hardcodé non i18n | blind+auditor | `SourceCitationList.tsx:27` | Hors scope de ST-305, problème général |
| **25** | Icône texte au lieu de composant | blind | `SourceCitation.tsx:103` | Décision design system, pas spécifique à ST-305 |
| **26** | Valeurs string pour unités CSS | blind | `SourceCitation.tsx:133,135,...` | Style préférentiel, pas bloquant |
| **27** | Typographie Geist Sans non spécifiée | auditor | - | Héritée du parent, pas responsable de ST-305 |
| **28** | Border radius manquant | auditor | - | Style optionnel, pas bloquant pour les AC |

---

### ❌ **DISMISSED - Faux Positifs (3 issues)**

| # | Titre | Source | Raison |
|---|-------|--------|--------|
| **29** | getSourceUrl non exploité | auditor | **FAUX** - `getSourceUrl` EST appelé dans `convertToSourceCitation` (l.49) qui est appelé dans `filterAndConvertSources` (l.113-114) |
| **30** | Inconsistent focus color | blind | **MINOR** - Couleur de focus cohérente avec le design, style acceptable |
| **31** | Duplicate focus styles | blind | **MINOR** - :focus et :focus-visible sont tous deux valides et nécessaires |

---

## 📋 **Résumé par Fichier**

| Fichier | Issues | CRITICAL | HIGH | MEDIUM | LOW |
|---------|--------|----------|------|--------|-----|
| `src/lib/api/sources.ts` | 11 | 5 | 6 | 0 | 0 |
| `src/components/SourceCitation/SourceCitation.tsx` | 10 | 4 | 3 | 3 | 0 |
| `src/components/SourceCitation/SourceCitationList.tsx` | 4 | 1 | 1 | 2 | 0 |
| `src/components/Chat/ChatMessage.tsx` | 1 | 1 | 0 | 0 | 0 |
| `src/app/chat/page.tsx` | 1 | 1 | 0 | 0 | 0 |
| `src/types/citations.ts` | 1 | 0 | 0 | 1 | 0 |

---

## 🎯 **AC Status Après Review**

| AC | Statut | Bloqué Par | Notes |
|----|--------|------------|-------|
| **AC #1** | ✅ **PASS** | - | Section visible via SourceCitationList |
| **AC #2** | ⚠️ **PARTIAL** | #2 | Liens cliquables OUI, mais URLs vides possibles |
| **AC #3** | ✅ **PASS** | - | Numérotation séquentielle via index |
| **AC #4** | ✅ **PASS** | - | target="_blank" + rel="noopener noreferrer" |
| **AC #5** | ⚠️ **PARTIAL** | #23 | Path affiché, mais "nom" non clair |
| **AC #6** | ⚠️ **PARTIAL** | #21 | Couleurs correctes, mais dupliquées |
| **AC #7** | ❌ **FAIL** | #3 | **Violation WCAG 2.4.7** - focus outline supprimé |
| **AC #8** | ✅ **PASS** | - | @media queries présentes |
| **AC #9** | ⚠️ **PARTIAL** | #2, #6-12 | Filtrage des sources, mais null checks manquants |
| **AC #10** | ✅ **PASS** | - | Intégration non-breaking avec ST-303 |

---

## 🏆 **Verdict Global**

**❌ REVIEW FAILED - 22 issues CRITICAL/PATCH à fixer**

### **Bloqueurs pour Merge (9 issues):**
1. Prop destructuring manquant (crash imminent)
2. URLs vides affichées
3. **Violation WCAG 2.4.7** (AC #7 échoue)
4. Sélecteur CSS invalide
5. Tableau citations null casse le rendu
6-12. Validations null/undefined manquantes (7 issues)
13. Caractères spéciaux non encodés dans URLs

### **Recommandation:**
- **NE PAS merger** dans l'état actuel
- Fixer les 22 issues classées **patch** avant nouvelle révision
- Résoudre les 4 issues **decision_needed** avec l'équipe
- Les 5 issues **defer** peuvent attendre

---

## 📝 **Next Steps**

1. **Corriger les issues patch** (priorité aux bloquants)
2. **Discuter des decisions needed** avec l'équipe
3. **Re-lancer la code review** après corrections
4. **Mettre à jour le status** dans sprint-status.yaml une fois clean

---

*Generated by Mistral Vibe - Code Review Workflow v1.0*
*Review conducted: 2026-07-08*
