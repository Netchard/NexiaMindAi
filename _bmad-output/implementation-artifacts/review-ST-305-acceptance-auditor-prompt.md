# ACCEPTANCE AUDITOR - Review Prompt for ST-305

**ROLE:** You are the Acceptance Auditor. Review this diff against the spec and context docs.

**YOUR GOAL:** Check for:
- Violations of acceptance criteria
- Deviations from spec intent
- Missing implementation of specified behavior
- Contradictions between spec constraints and actual code

**OUTPUT FORMAT:** Markdown list. Each finding: one-line title, which AC/constraint it violates, and evidence from the diff.

**SEVERITY:** All findings are HIGH by default (AC violations block acceptance).

---

## SPEC FILE CONTENT

**Story ID:** ST-305  
**Title:** Afficher les Citations de Sources  
**Status:** in-progress (but implementation claims complete)

### USER STORY
En tant que **développeur frontend**, je veux **afficher les sources citées dans les réponses IA avec des liens cliquables**, afin de **permettre aux utilisateurs de vérifier l'information et d'accéder directement aux documents sources**.

### ACCEPTANCE CRITERIA (10 total):

| # | Critère | Spec Status |
|---|---------|-------------|
| **AC #1** | Section "Sources" visible sous chaque réponse assistant | Required |
| **AC #2** | Liens cliquables vers les documents sources | Required |
| **AC #3** | Numérotation séquentielle des sources | Required |
| **AC #4** | Ouverture dans nouvel onglet (`target="_blank"`) | Required |
| **AC #5** | Affichage des métadonnées (nom/chemin) | Required |
| **AC #6** | Style cohérent avec design system | Required |
| **AC #7** | Accessibilité WCAG 2.1 AA | Required |
| **AC #8** | Responsive design (mobile/tablette/desktop) | Required |
| **AC #9** | Gestion d'erreur pour les sources indisponibles | Required |
| **AC #10** | Intégration sans conflit avec ST-303 | Required |

### DESIGN SYSTEM CONSTRAINTS (from spec):
- Couleurs : Corail `#EF6C4D` (primary), Encre `#1E2A3B` (secondary)
- Typographie : Geist Sans
- Border radius : 8/10/16px selon le contexte
- Design tokens : Voir `_bmad-output/planning-artifacts/ux-designs/ux-nexiamind-ai-2026-07-04-chat/DESIGN.md`

### TECHNICAL CONSTRAINTS (from spec):
- ✅ **Contrat API existant** : `/api/chat/message` retourne déjà `sources[]` avec `{path, type, relevance}`
- ✅ **Backend génère déjà** les citations dans le format `[Source: /chemin/vers/document]`
- ⚠️ **NE PAS modifier le backend** - frontend-only story
- ⚠️ **NE PAS réinventer le format** - le backend utilise déjà un format spécifique
- ⚠️ **URLs dynamiques** : utiliser `getSourceUrl()` pour chaque type (supabase, gitlab, nexia, upload)
- ⚠️ **Compatibilité ST-303** : ne pas casser l'affichage existant
- ⚠️ **Types de sources supportés** : supabase, gitlab, nexia, upload

### ARCHITECTURE CONSTRAINTS:
- Dossier prévu : `components/SourceCitation/`
- Structure : 
  - `src/types/citations.ts` (types partagés)
  - `src/components/SourceCitation/` (composants)
  - `src/lib/api/sources.ts` (client API)
- Intégration : ChatMessage doit afficher SourceCitationList sous le contenu assistant

---

## DIFF OUTPUT FOR ST-305

### NEW FILE: src/types/citations.ts
```typescript
export type SourceType = 'supabase' | 'gitlab' | 'nexia' | 'upload';

export interface SourceCitation {
  id: string;
  path: string;
  type: SourceType;
  relevance?: number;
  url: string;
  index: number;
}

export interface RawSource {
  path: string;
  type: SourceType;
  relevance?: number;
}

export const DEFAULT_SOURCE_URL_CONFIG = {
  supabase: 'https://app.supabase.com/project/ref/project-storage',
  gitlab: 'https://gitlab.com/nexiamind-ai',
  nexia: 'https://ged.nexiamind.fr',
  upload: '/uploads',
};
```

---

### NEW FILE: src/components/SourceCitation/SourceCitation.tsx
```typescript
'use client';
import React from 'react';
import { SourceCitationProps } from './types';

const colors = {
  primary: '#EF6C4D', // Corail
  primaryHover: '#E05A3E',
  secondary: '#1E2A3B', // Encre
  text: '#1E2A3B',
  textLight: '#6B7280',
  border: '#D1D5DB',
  background: '#FFFFFF',
};

export const SourceCitation: React.FC<SourceCitationProps> = ({
  citation,
  disabled = false,
  className = '',
}) => {
  const ariaId = `citation-${citation.id}`;

  return (
    <li
      className={`source-citation-item ${className}`}
      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', ... }}
      aria-label={`Source ${citation.index}: ${citation.path}`}
      id={ariaId}
    >
      <span className="source-citation-number" style={{ backgroundColor: colors.primary, color: colors.background, borderRadius: '50%', ... }}>
        {citation.index}
      </span>
      <a href={citation.url} target="_blank" rel="noopener noreferrer" ...>
        {citation.path}
      </a>
      <span className="source-citation-external-icon">→</span>
      <style jsx>{/* responsive styles */}</style>
    </li>
  );
};
```

---

### NEW FILE: src/components/SourceCitation/SourceCitationList.tsx
```typescript
'use client';
import React from 'react';
import { SourceCitationListProps } from './types';
import { SourceCitation } from './SourceCitation';

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
      style={{ width: '100%', marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${colors.border}` }}
      role="region"
      aria-label="Liste des citations de sources"
    >
      <h4 className="source-citation-list-title" style={{ fontSize: '14px', fontWeight: 600, color: colors.secondary }}>
        {title}
      </h4>
      <ul className="source-citation-list-items" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {citations.map((citation) => (
          <SourceCitation key={citation.id} citation={citation} disabled={disabled} />
        ))}
      </ul>
    </div>
  );
};
```

---

### NEW FILE: src/lib/api/sources.ts
```typescript
import { SourceCitation, RawSource, SourceType, DEFAULT_SOURCE_URL_CONFIG, SourceUrlConfig } from '@/types/citations';

export function getSourceUrl(source: { path: string; type: SourceType }, config: SourceUrlConfig = DEFAULT_SOURCE_URL_CONFIG): string | null {
  const baseUrl = config[type as keyof SourceUrlConfig];
  if (!baseUrl) {
    console.warn(`Type de source inconnu: ${type}`);
    return null;
  }
  const cleanPath = source.path.replace(/^\//, '');
  return `${baseUrl}/${cleanPath}`;
}

export function isValidSource(source: RawSource): boolean {
  const validTypes: SourceType[] = ['supabase', 'gitlab', 'nexia', 'upload'];
  return (
    validTypes.includes(source.type) &&
    source.path &&
    typeof source.path === 'string' &&
    source.path.trim() !== ''
  );
}

export function filterAndConvertSources(rawSources: RawSource[] | undefined, config: SourceUrlConfig = DEFAULT_SOURCE_URL_CONFIG): SourceCitation[] {
  if (!rawSources || rawSources.length === 0) {
    return [];
  }
  const validSources = rawSources.filter(isValidSource);
  return validSources.map((source, index) => convertToSourceCitation(source, index + 1, config));
}

export function convertToSourceCitation(rawSource: RawSource, index: number, config: SourceUrlConfig = DEFAULT_SOURCE_URL_CONFIG): SourceCitation {
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
```

---

### MODIFIED: src/components/Chat/types.ts
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

### MODIFIED: src/components/Chat/api.ts
```typescript
import type { RawSource } from '@/types/citations';

export interface SendMessageResponse {
  id: string
  conversationId: string
  role: 'assistant'
  content: string
  formattedContent?: string
  /** Sources citées dans la réponse, telles que retournées par le backend */
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

### MODIFIED: src/components/Chat/ChatMessage.tsx
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

export default function ChatMessage({ role, content, showAvatar, citations }: ChatMessageProps) {
  if (role === 'user') {
    // ... user message
  }

  return (
    <div className="flex items-end gap-2.5">
      {/* ... avatar ... */}
      <div className="flex max-w-[78%] flex-col gap-2.5">
        <div className="..." data-testid="chat-bubble-assistant">
          {content}
        </div>
        {citations && citations.length > 0 && (
          <SourceCitationList citations={citations} title="📚 Sources :" data-testid="chat-sources" />
        )}
      </div>
    </div>
  );
}
```

---

### MODIFIED: src/components/Chat/ChatMessageList.tsx
```typescript
// Line 70-75:
<div key={message.id} className="py-1">
  <ChatMessage 
    role={message.role} 
    content={message.content} 
    showAvatar={showAvatar}
    citations={message.citations}
  />
  {/* ... */}
</div>
```

---

### MODIFIED: src/app/chat/page.tsx
```typescript
// Line 10: Import
import { filterAndConvertSources } from '@/lib/api/sources';
import type { RawSource } from '@/types/citations';

// Line 63: Fixed await
const history = await getHistory()

// Line 109: Parse sources
const citations = filterAndConvertSources(response.sources)

// Line 113-117: Create message with citations
{
  id: response.id, 
  role: 'assistant', 
  content: response.content,
  citations: citations.length > 0 ? citations : undefined,
}
```

---

## CONTEXT DOCS REFERENCES
- ST-303: `4-303-creer-l-interface-de-chat.md` - Previous story for chat interface
- ST-304: `4-304-implementer-les-filtres-de-recherche.md` - Parallel story for filters
- Architecture: `_bmad-output/planning-artifacts/architecture-nexiamind-ai/architecture.md`
- Design: `_bmad-output/planning-artifacts/ux-designs/ux-nexiamind-ai-2026-07-04-chat/DESIGN.md`

---

## YOUR TASK

Review the diff above against:
1. **All 10 Acceptance Criteria** - Are they ALL satisfied?
2. **Spec constraints** - Any violations?
3. **Design system** - Colors, typography, spacing correct?
4. **Architecture** - Files in correct locations?
5. **Integration** - Compatible with ST-303? Non-breaking changes?

For each AC, verify:
- ✅ **AC #1**: Section "Sources" visible? (Look for SourceCitationList in ChatMessage)
- ✅ **AC #2**: Links clickable? (Check <a> tags with href)
- ✅ **AC #3**: Sequential numbering? (Check citation.index usage)
- ✅ **AC #4**: Opens in new tab? (Check target="_blank" + rel="noopener noreferrer")
- ✅ **AC #5**: Metadata displayed? (Check citation.path rendered)
- ✅ **AC #6**: Consistent style? (Check colors match design system)
- ✅ **AC #7**: WCAG 2.1 AA? (Check aria-label, focus states, keyboard nav)
- ✅ **AC #8**: Responsive? (Check @media queries)
- ✅ **AC #9**: Error handling? (Check filterAndConvertSources, isValidSource)
- ✅ **AC #10**: ST-303 integration? (Check no breaking changes to existing code)

**OUTPUT:** List of findings where AC are NOT satisfied or constraints are violated.

---

## END OF PROMPT
