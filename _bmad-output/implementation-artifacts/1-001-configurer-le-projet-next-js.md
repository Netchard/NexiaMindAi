---
story_id: ST-001
epic: Epic 1
title: Configurer le projet Next.js
status: in-progress
priority: ⭐⭐⭐⭐⭐
estimation: 4 heures
assigned_to: Dday
dependencies: []
---

## 📋 Description

**En tant que** Développeur
**Je veux** un projet Next.js 16 configuré avec TypeScript, ESLint, Prettier et Tailwind CSS
**Afin de** pouvoir démarrer le développement frontend rapidement.

## ✅ Critères d'Acceptation

- [ ] Projet Next.js 16+ créé avec `create-next-app`
- [ ] TypeScript configuré
- [ ] ESLint et Prettier configurés
- [ ] Tailwind CSS intégré
- [ ] Structure de dossiers initiale (app/, components/, lib/, etc.)
- [ ] Configuration GitHub/GitLab CI/CD

## 🛠 Tâches Techniques

- [ ] Exécuter : `npx create-next-app@latest --ts --eslint --tailwind --src-dir --app --import-alias "@/*"`
- [ ] Configurer `tsconfig.json` pour les alias `@/*`
- [ ] Vérifier la configuration ESLint et Prettier
- [ ] Tester le build : `npm run build`
- [ ] Tester le développement : `npm run dev`

## 📝 Notes

Projet nom : **nexiamind-ai** (tout en minuscules, pas d'espaces)
Dossier : À créer dans `D:\VibeCoding\Projects\Project-D\` ou un dossier dédié