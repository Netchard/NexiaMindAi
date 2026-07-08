# BLIND HUNTER - Review Prompt for ST-305

**ROLE:** You are the Blind Hunter. You receive ONLY the diff content below. You have NO access to:
- The spec file
- Project context
- Any other files
- Previous conversation

**YOUR GOAL:** Find issues in this code change adversarially. Look for:
- Security vulnerabilities
- Bugs and logical errors
- Performance issues
- Code quality problems
- Anti-patterns
- Missing error handling
- Edge cases not handled
- Inconsistent practices

**OUTPUT FORMAT:** Markdown list. Each finding: one-line title, severity (CRITICAL/HIGH/MEDIUM/LOW), and brief evidence from the diff.

**SEVERITY GUIDE:**
- CRITICAL: Security vuln, data loss, crash, breaking change
- HIGH: Logic error, incorrect behavior, performance degradation
- MEDIUM: Code quality, maintainability issue
- LOW: Style nit, minor improvement

---

## DIFF OUTPUT FOR ST-305: Afficher les Citations de Sources

### NEW FILE: src/types/citations.ts
```typescript
/**
 * Types partagés pour les citations de sources
 * Utilisés par les composants frontend et les endpoints API
 */

/**
 * Types de sources supportés
 * Correspond aux valeurs de la colonne `source` dans la table `documents`
 */
export type SourceType = 
  | 'supabase'
  | 'gitlab'
  | 'nexia'
  | 'upload';

/**
 * Représente une citation de source dans une réponse IA
 * Contient les métadonnées nécessaires pour afficher et lier à la source
 */
export interface SourceCitation {
  /** Identifiant unique de la citation (pour la numérotation) */
  id: string;
  /** Chemin vers le document source */
  path: string;
  /** Type de source (définit comment générer l'URL) */
  type: SourceType;
  /** Score de pertinence (0-1) - optionnel */
  relevance?: number;
  /** URL générée pour accéder à la source */
  url: string;
  /** Index de numérotation (1, 2, 3, ...) */
  index: number;
}

/**
 * Représente une source brute telle que retournée par l'API /api/chat/message
 * Ce format vient directement du backend
 */
export interface RawSource {
  /** Chemin vers le document source */
  path: string;
  /** Type de source */
  type: SourceType;
  /** Score de pertinence (0-1) - optionnel */
  relevance?: number;
}

/**
 * Section des citations dans un message
 * Ajouté aux messages assistant qui ont des sources
 */
export interface MessageCitations {
  /** Liste des citations parsées et prêtes à afficher */
  citations: SourceCitation[];
  /** Indicateur si des citations sont présentes */
  hasCitations: boolean;
}

/**
 * Options pour la génération des URLs de source
 * Permet de personnaliser les URLs base pour chaque type
 */
export interface SourceUrlConfig {
  supabase: string;
  gitlab: string;
  nexia: string;
  upload: string;
}

/**
 * Configuration par défaut pour les URLs de source
 * Peut être écrasée si nécessaire
 */
export const DEFAULT_SOURCE_URL_CONFIG: SourceUrlConfig = {
  supabase: 'https://app.supabase.com/project/ref/project-storage',
  gitlab: 'https://gitlab.com/nexiamind-ai',
  nexia: 'https://ged.nexiamind.fr',
  upload: '/uploads',
};
```

---

### NEW FILE: src/components/SourceCitation/types.ts
```typescript
/**
 * Types spécifiques aux composants SourceCitation
 * Complémentaires aux types partagés dans src/types/citations.ts
 */

import { SourceCitation } from '@/types/citations';

/**
 * Props pour le composant SourceCitation
 */
export interface SourceCitationProps {
  /** Données de la citation à afficher */
  citation: SourceCitation;
  /** Si le composant est désactivé (pour l'aperçu) */
  disabled?: boolean;
  /** Classe CSS supplémentaire */
  className?: string;
}

/**
 * Props pour le composant SourceCitationList
 */
export interface SourceCitationListProps {
  /** Liste des citations à afficher */
  citations: SourceCitation[];
  /** Titre de la section (par défaut: "📚 Sources :") */
  title?: string;
  /** Si la liste est désactivée */
  disabled?: boolean;
  /** Classe CSS supplémentaire */
  className?: string;
}
```

---

### NEW FILE: src/components/SourceCitation/SourceCitation.tsx
```typescript
'use client';

/**
 * Composant SourceCitation - Affiche une seule citation de source
 * Respecte WCAG 2.1 AA et utilise le design system existant
 */

import React from 'react';
import { SourceCitationProps } from './types';

// Couleurs du design system (héritage de ST-303 et ST-304)
const colors = {
  primary: '#EF6C4D', // Corail
  primaryHover: '#E05A3E',
  secondary: '#1E2A3B', // Encre
  text: '#1E2A3B',
  textLight: '#6B7280',
  border: '#D1D5DB',
  background: '#FFFFFF',
};

/**
 * Composant pour afficher une seule citation
 */
export const SourceCitation: React.FC<SourceCitationProps> = ({
  citation,
  disabled = false,
  className = '',
}) => {
  // Générer l'ID unique pour l'aria-label
  const ariaId = `citation-${citation.id}`;

  return (
    <li
      className={`source-citation-item ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 0',
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      aria-label={`Source ${citation.index}: ${citation.path}`}
      id={ariaId}
    >
      {/* Numéro de la citation */}
      <span
        className="source-citation-number"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '24px',
          height: '24px',
          backgroundColor: colors.primary,
          color: colors.background,
          borderRadius: '50%',
          fontSize: '12px',
          fontWeight: 600,
          flexShrink: 0,
        }}
        aria-hidden="true"
      >
        {citation.index}
      </span>

      {/* Lien vers la source */}
      <a
        href={citation.url}
        target="_blank"
        rel="noopener noreferrer"
        className="source-citation-link"
        style={{
          color: colors.primary,
          textDecoration: 'none',
          fontSize: '14px',
          flex: 1,
          wordBreak: 'break-all',
        }}
        aria-label={`Ouvrir la source: ${citation.path}`}
        tabIndex={disabled ? -1 : 0}
        onClick={(e) => {
          if (disabled) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        {citation.path}
      </a>

      {/* Icône de lien externe */}
      <span
        className="source-citation-external-icon"
        style={{
          color: colors.textLight,
          fontSize: '14px',
          flexShrink: 0,
        }}
        aria-hidden="true"
      >
        →
      </span>

      {/* Styles spécifiques */}
      <style jsx>{`
        .source-citation-item:hover:not(:disabled) {
          text-decoration: underline;
        }

        .source-citation-item:focus {
          outline: 2px solid ${colors.primary};
          outline-offset: 2px;
        }

        .source-citation-item:focus-visible {
          outline: 2px solid #3B82F6;
          outline-offset: 2px;
        }

        .source-citation-link:hover {
          text-decoration: underline;
        }

        .source-citation-link:focus {
          outline: none;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .source-citation-item {
            flex-direction: column;
            align-items: flex-start;
            gap: '4px';
          }
          
          .source-citation-number {
            width: '20px';
            height: '20px';
            fontSize: '10px',
          }
          
          .source-citation-link {
            fontSize: '13px';
          }
        }
      `}</style>
    </li>
  );
};

// Nom du composant pour le débogage
SourceCitation.displayName = 'SourceCitation';

export default SourceCitation;
```

---

### NEW FILE: src/components/SourceCitation/SourceCitationList.tsx
```typescript
'use client';

/**
 * Composant SourceCitationList - Conteneur pour afficher une liste de citations
 * Respecte WCAG 2.1 AA et utilise le design system existant
 */

import React from 'react';
import { SourceCitationListProps } from './types';
import { SourceCitation } from './SourceCitation';

// Couleurs du design system (héritage de ST-303 et ST-304)
const colors = {
  primary: '#EF6C4D', // Corail
  secondary: '#1E2A3B', // Encre
  text: '#1E2A3B',
  textLight: '#6B7280',
  border: '#D1D5DB',
  background: '#FFFFFF',
};

/**
 * Composant pour afficher une liste de citations de sources
 */
export const SourceCitationList: React.FC<SourceCitationListProps> = ({
  citations,
  title = '📚 Sources :',
  disabled = false,
  className = '',
}) => {
  if (!citations || citations.length === 0) {
    return null;
  }

  return (
    <div
      className={`source-citation-list ${className}`}
      style={{
        width: '100%',
        marginTop: '16px',
        paddingTop: '16px',
        borderTop: `1px solid ${colors.border}`,
      }}
      role="region"
      aria-label="Liste des citations de sources"
    >
      {/* Titre de la section */}
      <h4
        className="source-citation-list-title"
        style={{
          marginBottom: '12px',
          fontSize: '14px',
          fontWeight: 600,
          color: colors.secondary,
        }}
      >
        {title}
      </h4>

      {/* Liste des citations */}
      <ul
        className="source-citation-list-items"
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
        }}
      >
        {citations.map((citation) => (
          <SourceCitation
            key={citation.id}
            citation={citation}
            disabled={disabled}
          />
        ))}
      </ul>

      {/* Styles spécifiques */}
      <style jsx>{`
        /* Responsive */
        @media (max-width: 1024px) {
          .source-citation-list {
            padding-top: '12px';
          }
          
          .source-citation-list-title {
            fontSize: '13px';
          }
        }

        @media (max-width: 768px) {
          .source-citation-list {
            padding-top: '10px';
          }
        }
      `}</style>
    </div>
  );
};

// Nom du composant pour le débogage
SourceCitationList.displayName = 'SourceCitationList';

export default SourceCitationList;
```

---

### NEW FILE: src/components/SourceCitation/index.tsx
```typescript
/**
 * SourceCitation Components Index
 * Centralized exports for all source citation components
 */

export { default as SourceCitation } from './SourceCitation';
export { default as SourceCitationList } from './SourceCitationList';
export * from './types';
```

---

### NEW FILE: src/lib/api/sources.ts
```typescript
/**
 * Sources API client (frontend-only, no server-side deps).
 * Fournit les fonctions pour générer les URLs de source.
 * Ne pas importer depuis les route handlers directement.
 */

import { SourceCitation, RawSource, SourceType, DEFAULT_SOURCE_URL_CONFIG, SourceUrlConfig } from '@/types/citations';

/**
 * Génère une URL pour accéder à une source
 * @param source - La source avec path et type
 * @param config - Configuration optionnelle des URLs de base
 * @returns L'URL complète ou null si le type n'est pas supporté
 */
export function getSourceUrl(
  source: { path: string; type: SourceType },
  config: SourceUrlConfig = DEFAULT_SOURCE_URL_CONFIG
): string | null {
  // Vérifier que le type est valide
  const type = source.type;
  
  // Récupérer l'URL de base pour ce type
  const baseUrl = config[type as keyof SourceUrlConfig];
  
  if (!baseUrl) {
    console.warn(`Type de source inconnu: ${type}`);
    return null;
  }
  
  // Nettoyer le path (enlever les / de début si nécessaire)
  const cleanPath = source.path.replace(/^\//, '');
  
  // Construire l'URL complète
  return `${baseUrl}/${cleanPath}`;
}

/**
 * Convertit une source brute de l'API en SourceCitation
 * @param rawSource - La source telle que retournée par l'API
 * @param index - L'index de numérotation (1, 2, 3, ...)
 * @param config - Configuration optionnelle des URLs de base
 * @returns SourceCitation prête à afficher
 */
export function convertToSourceCitation(
  rawSource: RawSource,
  index: number,
  config: SourceUrlConfig = DEFAULT_SOURCE_URL_CONFIG
): SourceCitation {
  const url = getSourceUrl(rawSource, config);
  
  return {
    id: `${rawSource.type}-${rawSource.path}-${index}`,
    path: rawSource.path,
    type: rawSource.type,
    relevance: rawSource.relevance,
    url: url || '', // Si null, chaîne vide
    index,
  };
}

/**
 * Convertit un tableau de sources brutes en SourceCitation[]
 * @param rawSources - Les sources telles que retournées par l'API
 * @param config - Configuration optionnelle des URLs de base
 * @returns Tableau de SourceCitation prêtes à afficher
 */
export function convertToSourceCitations(
  rawSources: RawSource[] | undefined,
  config: SourceUrlConfig = DEFAULT_SOURCE_URL_CONFIG
): SourceCitation[] {
  if (!rawSources || rawSources.length === 0) {
    return [];
  }
  
  return rawSources.map((source, index) => 
    convertToSourceCitation(source, index + 1, config)
  );
}

/**
 * Vérifie si une source est valide (a un type supporté et un path non vide)
 * @param source - La source à vérifier
 * @returns true si la source est valide
 */
export function isValidSource(source: RawSource): boolean {
  const validTypes: SourceType[] = ['supabase', 'gitlab', 'nexia', 'upload'];
  return (
    validTypes.includes(source.type) &&
    source.path &&
    typeof source.path === 'string' &&
    source.path.trim() !== ''
  );
}

/**
 * Filtre et convertit les sources en citant celles qui sont valides
 * @param rawSources - Les sources brutes de l'API
 * @param config - Configuration optionnelle des URLs de base
 * @returns Tableau de SourceCitation filtré et converti
 */
export function filterAndConvertSources(
  rawSources: RawSource[] | undefined,
  config: SourceUrlConfig = DEFAULT_SOURCE_URL_CONFIG
): SourceCitation[] {
  if (!rawSources || rawSources.length === 0) {
    return [];
  }
  
  // Filtrer les sources valides
  const validSources = rawSources.filter(isValidSource);
  
  // Convertir en SourceCitation avec numérotation
  return validSources.map((source, index) => 
    convertToSourceCitation(source, index + 1, config)
  );
}

/**
 * Récupère la configuration par défaut des URLs de source
 * @returns La configuration par défaut
 */
export function getDefaultSourceUrlConfig(): SourceUrlConfig {
  return { ...DEFAULT_SOURCE_URL_CONFIG };
}

/**
 * Met à jour la configuration des URLs de source
 * @param partialConfig - Configuration partielle à fusionner
 * @returns Nouvelle configuration complète
 */
export function updateSourceUrlConfig(
  partialConfig: Partial<SourceUrlConfig>
): SourceUrlConfig {
  return { ...DEFAULT_SOURCE_URL_CONFIG, ...partialConfig };
}

export default {
  getSourceUrl,
  convertToSourceCitation,
  convertToSourceCitations,
  isValidSource,
  filterAndConvertSources,
  getDefaultSourceUrlConfig,
  updateSourceUrlConfig,
};
```

---

### MODIFIED FILE: src/components/Chat/types.ts
**OLD:**
```typescript
import type { SourceCitation } from '@/types/citations';

export interface ChatMessageData {
  id: string
  role: 'user' | 'assistant'
  content: string
  failed?: boolean
  /** Citations de sources pour les messages assistant */
  citations?: SourceCitation[]
}
```

---

### MODIFIED FILE: src/components/Chat/api.ts
**OLD:**
```typescript
/**
 * Chat API client (frontend-only, no server-side deps).
 * Mirrors the request/response contracts of src/app/api/chat/{message,history}/route.ts —
 * do not import from those route.ts files directly (see story Dev Notes: they pull in
 * next/server + server-only env vars, which would crash a client bundle on load).
 */

import type { RawSource } from '@/types/citations';

export interface SendMessageResponse {
  id: string
  conversationId: string
  role: 'assistant'
  content: string
  formattedContent?: string
  /**
   * Sources citées dans la réponse, telles que retournées par le backend
   * Tableau de sources brutes à parser côté frontend (ST-305)
   */
  sources?: RawSource[]
  metadata: {
    model: string
    tokensUsed: number
    processingTime: number
    timestamp: string
  }
}
```

---

### MODIFIED FILE: src/components/Chat/ChatMessage.tsx
**OLD:**
```typescript
'use client'

import { SourceCitationList } from '@/components/SourceCitation';
import type { SourceCitation } from '@/types/citations';

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  showAvatar: boolean
  citations?: SourceCitation[]
}

/**
 * ChatMessage Component
 * Renders a single message bubble. User bubbles are coral-gradient, right-aligned;
 * assistant bubbles stay light (deliberate contrast break, DESIGN.md > Colors) and
 * are left-aligned with an avatar shown once per group.
 */
export default function ChatMessage({ role, content, showAvatar }: ChatMessageProps) {
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[78%] whitespace-pre-wrap rounded-chat-lg rounded-tr-[5px] bg-gradient-to-br from-chat-primary to-chat-primary-active px-[17px] py-3.5 text-[14.5px] leading-relaxed text-chat-on-primary shadow-[0_8px_22px_-12px_rgba(244,105,63,.55)]"
          data-testid="chat-bubble-user"
        >
          {content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-end gap-2.5">
      {showAvatar ? (
        <div
          className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full bg-gradient-to-br from-chat-primary to-chat-primary-active text-[11px] font-bold text-chat-on-primary"
          aria-hidden="true"
          data-testid="chat-assistant-avatar"
        >
          N
        </div>
      ) : (
        <div className="w-[26px] flex-none" aria-hidden="true" />
      )}
      <div className="flex max-w-[78%] flex-col gap-2.5">
        <div
          className="whitespace-pre-wrap rounded-chat-lg rounded-tl-[5px] bg-chat-assistant-bg px-[17px] py-3.5 text-[14.5px] leading-relaxed text-chat-assistant-text"
          data-testid="chat-bubble-assistant"
        >
          {content}
        </div>
        {/* Affichage des citations de sources (ST-305) */}
        {citations && citations.length > 0 && (
          <SourceCitationList 
            citations={citations} 
            title="📚 Sources :" 
            data-testid="chat-sources"
          />
        )}
      </div>
    </div>
  )
}
```

---

### MODIFIED FILE: src/components/Chat/ChatMessageList.tsx
**KEY CHANGE:** Added `citations={message.citations}` prop pass to ChatMessage component (line 74)

---

### MODIFIED FILE: src/app/chat/page.tsx
**KEY CHANGES:**
1. Import `filterAndConvertSources` from '@/lib/api/sources'
2. Import `RawSource` from '@/types/citations'
3. Line 109: `const citations = filterAndConvertSources(response.sources)`
4. Line 113-117: Pass citations to assistant message: `citations: citations.length > 0 ? citations : undefined`
5. Line 63: Fixed missing await: `const history = await getHistory()`

---

### TEST FILES (3 new):
- `src/components/SourceCitation/__tests__/SourceCitation.test.tsx` (95 lines)
- `src/components/SourceCitation/__tests__/SourceCitationList.test.tsx` (118 lines)
- `src/lib/api/__tests__/sources.test.ts` (256 lines)

---

## END OF DIFF

**YOUR TASK:** Review the above diff ONLY. Find all issues you can. Output findings as specified.
