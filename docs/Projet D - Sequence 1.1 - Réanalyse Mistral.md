Projet D - App 1.0 - Réanalyse par Mistral AI

Voici une **synthèse structurée du contexte du projet NexiaMind AI**, combinant et enrichissant les deux documents fournis, avec des **compléments concrets** pour affiner l’analyse préliminaire.

---

---

---

## **📌 Contexte Global du Projet**
**Client** : **NexaWorks** (entreprise en croissance)
**Problématique** :
- **Perte de temps** dans la recherche d’informations (documents, notes, FAQ, procédures, fiches projets, etc.).
- **Hétérogénéité des réponses** (chaque collaborateur trouve des informations différentes).
- **Connaissances inexploitées** (historique des tâches, retours clients, etc.).
- **Difficulté d’onboarding** pour les nouveaux arrivants.

**Solution proposée** :
**NexiaMind AI** = **Copilote métier intelligent** (application web fullstack) capable de :
✅ **Centraliser** les informations de l’entreprise.
✅ **Retrouver rapidement** des ressources via une **recherche sémantique** (RAG).
✅ **Dialoguer** avec les utilisateurs via un **assistant conversationnel** (IA + base vectorielle).
✅ **Produire des réponses contextualisées** (ex : résumés, extraits de contrats, historiques clients).

---
---

---

## **🎯 Mission des Étudiants (Vibe Coding)**
**Objectif** : **Concevoir et réaliser un MVP fonctionnel** en adoptant une **posture de product builder-orchestrateur**, pas de développeur classique.
**Méthode** :
- **Utiliser l’IA** comme levier principal (génération, ajustement, correction, amélioration itérative).
- **Assembler des briques techniques** existantes (APIs, bases vectorielles, frameworks).
- **Valider et tester** en continu (feedback utilisateurs, tests automatiques).

**Attendu** :
| Élément | Exemple de Livrable |
|---------|--------------------|
| **Cadre du besoin** | Diagramme des flux d’informations, matrice des sources (✅ déjà fait). |
| **Choix technique** | Stack : **Next.js (Front) + FastAPI (Back) + Supabase + pgvector + Mistral AI**. |
| **Intégration RAG** | Pipeline de données (collecte → vectorisation → recherche). |
| **Supervision qualité** | Métriques de pertinence des réponses, feedbacks utilisateurs. |
| **Amélioration itérative** | Roadmap avec sprints (ex : Phase 1 = Office 365 + Creatio). |

---
---

---

## **🔍 Analyse des Sources d’Information (Complétée)**

### **📂 Sources Existantes (Prioritaires)**
| Source | **Contenu** | **Méthode d’Intégration** | **Utilisation dans le RAG** | **Complexité** | **Criticité** |
|--------|------------|--------------------------|----------------------------|---------------|---------------|
| **Office 365** (Outlook, SharePoint, OneDrive, Teams) | Emails, documents, chats, notes | **Microsoft Graph API** (OAuth 2.0) | Indexation des emails/PDFs, vectorisation des documents | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **GED Interne** | PDFs scannés, contrats, factures | **API REST** (Alfresco/Nuxeo) + **OCR** (Tesseract) | Vectorisation des documents texte/image | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Creatio (CRM)** | Opportunités, contrats, tickets clients | **API REST/SOAP** (webhooks pour le temps réel) | Réponses contextualisées sur les clients (ex : "Dernier contrat avec Acme Corp") | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Partages de fichiers** (Google Drive, Dropbox, NAS) | Fichiers projets, archives | **API Google Drive/Dropbox** ou montage SMB/NFS | Ingestion des fichiers non structurés | ⭐ | ⭐⭐⭐ |

**🔹 Points clés à ajouter** :
- **Synchronisation** :
  - **Temps réel** pour les emails (Microsoft Graph) et les tickets (Creatio via webhooks).
  - **Par lots** (toutes les 6h) pour SharePoint/GED (coût serveur réduit).
- **Nettoyage des données** :
  - Filtrer les **emails promos/spams** (regex sur l’objet).
  - **Anonymiser** les données sensibles (RGPD) : noms, emails, numéros de téléphone (via **Presidio** ou regex).
  - **Déduplication** : Comparaison de hashs (MD5) des fichiers.
- **Métadonnées** :
  - Conserver **source**, **date**, **auteur**, **tags** pour le contexte RAG.
  - Exemple : `{source: "Creatio", type: "Contrat", client: "Acme Corp", date: "2026-06-15"}`

---

### **📥 Sources Complémentaires (À Intégrer en Phase 2)**
| Source | **Utilisation** | **API/Outils** | **Priorité** |
|--------|----------------|---------------|--------------|
| **Slack** | Historique des chats (questions fréquentes) | **Slack API** (scope `channels:history`) | ⭐⭐ |
| **Confluence** | Documentation technique | **Confluence API** (export Markdown) | ⭐⭐ |
| **Zendesk** | Tickets clients résolus | **Zendesk API** ( tickets + comments) | ⭐⭐⭐ |
| **Base SQL (PostgreSQL)** | Données clients, commandes | **psycopg2** (Python) + conversion en texte naturel | ⭐⭐⭐ |
| **Google Forms** | Feedback utilisateurs | **Google Forms API** | ⭐ |

**🔹 Exemple concret d’enrichissement** :
- **Question** : *"Quels sont les retours clients sur notre dernière campagne marketing ?"*
- **Sources utilisées** :
  - **Creatio** (module Marketing) → Données structurées sur la campagne.
  - **Zendesk** → Tickets liés à la campagne.
  - **Slack** → Discussions internes sur les retours.
- **Réponse RAG** :
  > *"La campagne 'Summer 2026' a reçu **85% de retours positifs** (source : Zendesk, 50 tickets analysés). Les points soulevés incluent [liste]. Le responsable marketing (John Doe) a noté dans Slack : [citation]."*

---
---

---
---

## **🏗️ Architecture Technique (Détail Complet)**

### **📊 Schéma du Pipeline de Données**
```mermaid
graph TD
    A[Sources Externes] -->|Collecte| B[API Connectors]
    B --> C[Prétraitement]
    C --> D[OCR]
    C --> E[Nettoyage]
    D --> F[Normalisation]
    E --> F
    F --> G[Chunking]
    G --> H[Vectorisation]
    H --> I[Base Vectorielle]
    I --> J[RAG Engine]
    J --> K[LLM (Mistral AI)]
    K --> L[Interface Utilisateur]
    L --> M[Feedback]
    M -->|Amélioration| J
```

---

### **🛠️ Composants Techniques (Stack Recommandée)**
| Composant | **Technologie** | **Rôle** | **Pourquoi ?** |
|-----------|----------------|----------|----------------|
| **Frontend** | **Next.js (React)** | Interface utilisateur moderne | SSR, optimisé SEO, écosystème riche. |
| **Backend** | **FastAPI (Python)** | API pour le RAG et les connecteurs | Léger, rapide, compatible avec LangChain. |
| **Base vectorielle** | **Supabase + pgvector** | Stockage des embeddings | Open source, scalable, intégré à Supabase. |
| **Embeddings** | **`sentence-transformers/all-MiniLM-L6-v2`** | Vectorisation des textes | Open source, optimisé pour le français. |
| **RAG** | **LangChain** ou **LlamaIndex** | Orchestration du RAG | Bibliothèques matures, compatibles Mistral. |
| **OCR** | **Tesseract (pytesseract)** | Extraction de texte des PDF/images | Précis pour le français. |
| **Orchestration** | **Apache Airflow** | Planification des syncs | Gestion des workflows par lots. |
| **Authentification** | **NextAuth.js** | Gestion des utilisateurs | Intégration facile avec Next.js. |
| **LLM** | **Mistral AI (via API)** | Génération des réponses | Performant, support du français, RGPD-compliant. |

**🔹 Alternative pour la base vectorielle** :
- **Weaviate** (si besoin de recherche hybride : vectorielle + keyword).
- **Pinecone** (si budget cloud acceptable, plus rapide pour les grosses bases).

---
---
---
---

## **🚀 Pipeline de Données (Détail Technique)**

### **1️⃣ Collecte**
- **Outils** :
  - **Microsoft Graph API** : Récupération des emails/SharePoint/OneDrive.
    ```python
    from msgraph import GraphServiceClient
    client = GraphServiceClient(credentials)
    messages = client.me.messages.get().execute()
    ```
  - **Creatio API** : Export des données CRM en JSON.
    ```python
    import requests
    response = requests.get("https://creatio.com/api/Opportunities", headers={"Authorization": "Bearer TOKEN"})
    ```
  - **Google Drive API** :
    ```python
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
    service = build('drive', 'v3', credentials=credentials)
    files = service.files().list().execute()
    ```
- **Fréquence** :
  - **Emails** : Temps réel (webhooks Microsoft Graph).
  - **Creatio/GED** : Toutes les 6h (Airflow).
  - **Slack** : Toutes les 24h (limite des quotes API).

---

### **2️⃣ Prétraitement**
- **Nettoyage** :
  - Supprimer les emails avec `[PROMO]` ou `[SPAM]` dans l’objet.
  - Filtrer les fichiers > 10 Mo (trop longs pour le RAG).
  - **Anonymisation** (exemple avec `re` en Python) :
    ```python
    import re
    text = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[EMAIL]', text)
    ```
- **OCR** (pour les PDF/images) :
  ```python
  from PIL import Image
  import pytesseract
  text = pytesseract.image_to_string(Image.open('contract.pdf'))
  ```
- **Normalisation** :
  - Convertir tous les fichiers en **texte brut** ou **JSON** (pour les données structurées).
  - Exemple pour Excel → JSON :
    ```python
    import pandas as pd
    df = pd.read_excel("clients.xlsx")
    json_data = df.to_json(orient="records")
    ```

---

### **3️⃣ Structuration (Chunking + Métadonnées)**
- **Découpage en chunks** (512-1024 tokens) :
  ```python
  from langchain.text_splitter import RecursiveCharacterTextSplitter
  text_splitter = RecursiveCharacterTextSplitter(
      chunk_size=512,
      chunk_overlap=100,
      length_function=len
  )
  chunks = text_splitter.split_text(text)
  ```
- **Ajout de métadonnées** :
  ```python
  for chunk in chunks:
      chunk_with_metadata = {
          "text": chunk,
          "source": "Creatio",
          "type": "Contrat",
          "client": "Acme Corp",
          "date": "2026-06-15",
          "author": "John Doe"
      }
  ```

---
---
---
### **4️⃣ Vectorisation et Stockage**
- **Génération des embeddings** :
  ```python
  from sentence_transformers import SentenceTransformer
  model = SentenceTransformer('all-MiniLM-L6-v2')
  embeddings = model.encode([chunk["text"] for chunk in chunks])
  ```
- **Stockage dans Supabase + pgvector** :
  ```python
  from supabase import create_client
  import pgvector
  supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
  for i, embedding in enumerate(embeddings):
      supabase.table("documents").insert({
          "text": chunks[i]["text"],
          "embedding": embedding.tolist(),
          "metadata": chunks[i]
      }).execute()
  ```

---
### **5️⃣ Recherche RAG et Génération**
- **Recherche sémantique** :
  ```python
  def search_similar(query, k=3):
      query_embedding = model.encode([query])[0]
      results = supabase.table("documents").select("*").execute()
      # Comparaison de similarité cosinus (exemple simplifié)
      similar_chunks = sorted(
          results.data,
          key=lambda x: cosine_similarity(query_embedding, x["embedding"]),
          reverse=True
      )[:k]
      return similar_chunks
  ```
- **Prompt Engineering** (exemple pour Mistral AI) :
  ```python
  def generate_response(query, chunks):
      context = "\n".join([chunk["text"] for chunk in chunks])
      prompt = f"""
      Contexte : {context}
      Question : {query}
      Réponds en français, en utilisant uniquement le contexte ci-dessus.
      Si la réponse n'est pas dans le contexte, dis : "Je n'ai pas trouvé d'information pertinente."
      """
      response = mistral_api.generate(prompt)
      return response
  ```

---
---
---
---

## **🎨 Fonctionnalités Clés de l’Application**

| Fonctionnalité | **Description** | **Technologies** | **Exemple d’Utilisation** |
|----------------|----------------|------------------|--------------------------|
| **Authentification** | Connexion sécurisée (OAuth 2.0) | NextAuth.js | Utilisateur se connecte avec Google/Email. |
| **Tableau de bord** | Vue centralisée (stats, recherches récentes) | Next.js + Chart.js | "Nombre de documents indexés : 1,200". |
| **Recherche sémantique** | Barre de recherche avec suggestions | RAG + Mistral AI | "Trouver les contrats signés en juin 2026". |
| **Assistant conversationnel** | Chat avec historique | RAG + Mistral AI | "Quel est le CA du client Acme Corp ?". |
| **Gestion des documents** | Upload, tagging, suppression | FastAPI + Supabase | Utilisateur ajoute un PDF de contrat. |
| **Historique des échanges** | Conservation des conversations | Supabase (table `conversations`) | "Voir mes 5 dernières questions". |
| **Feedback utilisateur** | Notation des réponses (✅/❌) | Supabase | "Cette réponse était-elle utile ? [Oui/Non]". |

---
---
---
---

## **📅 Roadmap et Planification (À Ajouter)**

### **🗓️ Phases du Projet**
| Phase | **Objectifs** | **Livrables** | **Durée** | **Équipe** |
|-------|---------------|---------------|-----------|------------|
| **Phase 1 : Fondations** | Mise en place de l’infrastructure + intégration des sources prioritaires (Office 365 + Creatio) | - Backend FastAPI + Supabase <br> - Pipeline de données (collecte → vectorisation) <br> - Frontend basique (Next.js) | 2 semaines | 2 étudiants |
| **Phase 2 : RAG et IA** | Implémentation du RAG + assistant conversationnel | - Moteur de recherche sémantique <br> - Intégration Mistral AI <br> - Tests de pertinence | 2 semaines | 2 étudiants |
| **Phase 3 : Fonctionnalités Utilisateur** | Dashboard, historique, feedback | - Tableau de bord <br> - Système de feedback <br> - Gestion des documents | 1 semaine | 1 étudiant |
| **Phase 4 : Améliorations** | Sources complémentaires (Slack, Zendesk) + optimisations | - Intégration Slack/Zendesk <br> - Fine-tuning des prompts <br> - Tests utilisateurs | 1 semaine | 2 étudiants |
| **Phase 5 : Déploiement** | Mise en production + documentation | - Déploiement Vercel/Netlify <br> - Doc technique (README, API) <br> - Présentation finale | 3 jours | Tous |

---
---
### **📌 Jalons Critiques**
| Jalon | **Description** | **Date** |
|-------|----------------|----------|
| **M0** | Kickoff + choix de la stack | 2026-06-17 |
| **M1** | Backend + Supabase opérationnel | 2026-06-24 |
| **M2** | Pipeline de données (Office 365) testé | 2026-06-30 |
| **M3** | RAG fonctionnel (réponses basiques) | 2026-07-07 |
| **M4** | MVP complet (toutes les fonctionnalités) | 2026-07-14 |
| **M5** | Déploiement en production | 2026-07-15 |
| **M6** | Présentation finale + démo | 2026-07-18 |

---
---
---
---

## **⚠️ Points de Vigilance et Risques (À Compléter)**

### **🔴 Risques Techniques**
| Risque | **Impact** | **Mitigation** | **Responsable** |
|--------|------------|----------------|------------------|
| **Limite des APIs** (ex : Microsoft Graph rate limits) | Ralentissement de la synchronisation | - Utiliser des **batch requests** <br> - Planifier les syncs en **heures creuses** | Backend Team |
| **Taille des embeddings** (coût Supabase) | Dépassement du budget | - Limiter la taille des chunks (512 tokens) <br> - Utiliser **HNSW** pour l’indexation (pgvector) | Data Team |
| **Anonymisation incomplète** (RGPD) | Sanctions légales | - Valider avec **Presidio** (Microsoft) <br> - Audit manuel des données | Juridique |
| **Latence du RAG** | Expérience utilisateur dégradée | - **Cache** des requêtes fréquentes <br> - Optimiser les index vectoriels | Backend Team |
| **Compatibilité des formats** (PDF scannés, images) | Erreurs d’OCR | - Tester avec **Tesseract 5.0** <br> - Prévoir un **fallback** (texte brut) | Data Team |

---
### **🟡 Risques Fonctionnels**
| Risque | **Impact** | **Mitigation** |
|--------|------------|----------------|
| **Réponses non pertinentes** | Perte de confiance des utilisateurs | - **Fine-tuning** des prompts <br> - **Feedback utilisateur** intégré |
| **Doublons dans la base** | Réponses redondantes | - **Déduplication** via hash (MD5) <br> - **Filtrage par métadonnées** |
| **Manque de données** (sources non accessibles) | Base de connaissances incomplète | - **Prioriser** les sources critiques (Office 365 + Creatio) <br> - **Documenter** les limitations |

---
---
---
---

## **📊 Métriques de Succès (KPIs)**

| KPI | **Objectif** | **Mesure** | **Outil** |
|-----|--------------|------------|-----------|
| **Taux de pertinence** | ≥ 90% des réponses jugées utiles | Feedback utilisateur (✅/❌) | Supabase |
| **Temps de réponse** | < 2 secondes | Mesure du temps RAG + LLM | FastAPI (logs) |
| **Nombre de documents indexés** | ≥ 10,000 | Compte des entrées dans Supabase | Supabase Dashboard |
| **Taux d’adoption** | ≥ 80% des collaborateurs actifs | Nombre de sessions quotidiennes | Analytics (Google/Next.js) |
| **Taux de rétention** | ≥ 70% après 1 mois | Utilisateurs actifs sur 30 jours | Supabase |

---
---
---
---

## **💡 Recommandations Finales (À Intégrer dans l’Analyse)**

### **1️⃣ Pour le Product Builder**
- **Commencer petit** :
  - **MVP minimal** : Office 365 (emails + SharePoint) + RAG basique.
  - **Valider** avec 5 utilisateurs tests avant de scaler.
- **Itérer rapidement** :
  - **Sprints de 1 semaine** avec démo à la fin.
  - **Prioriser** les feedbacks utilisateurs (ex : "Je veux chercher dans les contrats").
- **Documenter** :
  - **README** avec :
    - Architecture technique (diagramme).
    - Guide d’utilisation (ex : "Comment poser une question ?").
    - Procédure de déploiement.

---
### **2️⃣ Pour l’Équipe Technique**
- **Backend** :
  - Utiliser **FastAPI** pour sa simplicité et sa compatibilité avec LangChain.
  - **Dockeriser** l’application pour faciliter le déploiement.
- **Frontend** :
  - **Next.js** + **Tailwind CSS** pour un design moderne et responsive.
  - Intégrer **React Query** pour la gestion des états (recherche, historique).
- **Data** :
  - **Supabase** pour la base vectorielle (pgvector) + authentification.
  - **Airflow** pour orchestrer les synchronisations (ex : toutes les 6h).

---
### **3️⃣ Pour le Déploiement**
- **Hébergement** :
  - **Frontend** : Vercel ou Netlify (gratuit pour les projets étudiants).
  - **Backend** : Render ou Railway (gratuits avec limites).
  - **Base de données** : Supabase (gratuit jusqu’à 500 Mo de stockage).
- **CI/CD** :
  - **GitHub Actions** pour automatiser les tests et le déploiement.
- **Monitoring** :
  - **Logs** : FastAPI (Uvicorn) + **Sentry** pour les erreurs.
  - **Performance** : **Lighthouse** (Next.js) pour le frontend.

---
---
---
---
## **📝 Prochaines Étapes (Actionable)**
| Étape | **Description** | **Responsable** | **Échéance** |
|-------|----------------|----------------|--------------|
| **1. Valider le périmètre** | Confirmer les sources prioritaires (Office 365 + Creatio) avec NexaWorks | Product Owner | 2026-06-18 |
| **2. Configurer l’environnement** | Créer les comptes Supabase, Mistral AI, GitHub | Tech Lead | 2026-06-19 |
| **3. Développer le backend** | FastAPI + intégration Microsoft Graph API | Backend Dev | 2026-06-24 |
| **4. Mettre en place le pipeline** | Collecte + vectorisation des emails (Office 365) | Data Engineer | 2026-06-26 |
| **5. Tester le RAG** | Valider la pertinence des réponses avec 5 utilisateurs | QA | 2026-06-28 |
| **6. Développer le frontend** | Next.js + recherche sémantique | Frontend Dev | 2026-07-05 |
| **7. Intégrer Creatio** | Connecteur API + vectorisation des contrats | Backend Dev | 2026-07-07 |
| **8. Déployer en bêta** | Version test sur Vercel/Render | Tech Lead | 2026-07-10 |
| **9. Recueillir les feedbacks** | Session de test avec NexaWorks | Product Owner | 2026-07-12 |
| **10. Finaliser le MVP** | Corrections + documentation | Toute l’équipe | 2026-07-15 |

---
---
---
## **📎 Annexes (À Ajouter à l’Analyse)**
### **📄 1. Exemple de Prompt pour le RAG**
```text
Tu es NexiaMind AI, l'assistant intelligent de NexaWorks.
Ton rôle est de répondre aux questions des collaborateurs en utilisant **uniquement** les informations fournies dans le contexte ci-dessous.

**Contexte :**
---
[Insertion des chunks pertinents ici]
---

**Question :** [Question de l'utilisateur]

**Instructions :**
1. Si la réponse est dans le contexte, reformule-la de manière claire et concise en français.
2. Si la réponse n'est pas dans le contexte, réponds : "Je n'ai pas trouvé d'information pertinente dans nos bases de données. Veuillez reformuler votre demande ou contacter le support."
3. Cite toujours tes sources (ex : "Source : Contrat #2026-0045, signée le 15/06/2026").
4. Ne réponds **jamais** avec des informations inventées ou externes au contexte.

**Réponse :**
```

---
### **📄 2. Structure de la Base de Données (Supabase)**
```sql
-- Table des documents vectorisés
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text TEXT NOT NULL,               -- Contenu du chunk
    embedding vector(384) NOT NULL,   -- Embedding (all-MiniLM-L6-v2 = 384 dimensions)
    metadata JSONB NOT NULL,          -- {source, type, client, date, author, ...}
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des utilisateurs
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des conversations
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    query TEXT NOT NULL,
    response TEXT NOT NULL,
    feedback BOOLEAN,                -- true = réponse utile, false = non utile
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour la recherche vectorielle
CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

---
### **📄 3. Budget Estimatif (Coûts)**
| Poste | **Détail** | **Coût Mensuel** | **Gratuit ?** |
|-------|------------|-------------------|---------------|
| **Supabase** | Base vectorielle (500 Mo) | 0 € | ✅ Oui |
| **Mistral AI** | API (1M tokens/mois) | ~25 € | ❌ Non (budget étudiant possible) |
| **Vercel** | Hébergement frontend | 0 € | ✅ Oui |
| **Render** | Hébergement backend | 0 € (free tier) | ✅ Oui |
| **Microsoft Graph API** | Accès Office 365 | 0 € (gratuit pour les entreprises) | ✅ Oui |
| **Creatio API** | Accès CRM | Dépend du contrat (à vérifier) | ⚠️ À confirmer |

---
---
---
## **🎯 Conclusion et Synthèse**
### **Ce qui a été fait** (dans l’analyse préliminaire existante) :
✅ **Cartographie complète des sources** (Office 365, GED, Creatio, partages de fichiers).
✅ **Pipeline de données détaillé** (collecte → vectorisation → RAG).
✅ **Recommandations techniques** (stack, outils, bibliothèques).
✅ **Exemples concrets** (flux de réponse, prompts).

### **Ce qui a été ajouté ici** :
🔹 **Roadmap et planification** (phases, jalons, durée).
🔹 **Détails techniques** (code snippets pour chaque étape du pipeline).
🔹 **Gestion des risques** (tableau des risques + mitigations).
🔹 **KPIs et métriques de succès**.
🔹 **Structure de la base de données** (Supabase + pgvector).
🔹 **Budget estimatif**.
🔹 **Exemples de prompts RAG optimisés**.
🔹 **Recommandations actionnables** (prochaines étapes, responsabilités).

---
### **Prochaines Actions Immédiates** :
1. **Valider avec NexaWorks** :
   - Accès aux APIs (Microsoft Graph, Creatio).
   - Budget disponible (ex : abonnement Mistral AI).
2. **Configurer l’environnement** :
   - Créer un projet **Supabase** (avec extension `pgvector`).
   - Obtenir une **clé API Mistral AI** (ou utiliser le modèle local si possible).
3. **Lancer le développement** :
   - **Backend** : FastAPI + intégration Microsoft Graph (Phase 1).
   - **Data** : Pipeline de vectorisation (test avec 100 emails).

---
**Question ouverte** :
Veux-tu que je détaille davantage :
- [ ] **L’implémentation technique** (ex : code complet pour le connecteur Microsoft Graph) ?
- [ ] **Les tests utilisateurs** (scénarios de test, feedback form) ?
- [ ] **La documentation** (README, guide utilisateur) ?
- [ ] **Le déploiement** (CI/CD, monitoring) ?
