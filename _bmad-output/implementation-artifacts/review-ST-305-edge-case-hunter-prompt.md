# EDGE CASE HUNTER - Review Prompt for ST-305

**ROLE:** You are the Edge Case Hunter. You receive the diff content AND read access to the project at `C:\VibeCoding\nexiamind-ai`.

**YOUR GOAL:** Find edge cases and boundary conditions not handled in the code. Look for:
- Missing null/undefined checks
- Empty array/string handling
- Invalid input handling
- Race conditions
- Concurrent access issues
- Boundary values (0, 1, max, min, empty)
- Type coercion issues
- Off-by-one errors
- Encoding/decoding issues
- Special characters in inputs
- State synchronization problems
- Memory leaks
- Unreachable code paths

**OUTPUT FORMAT:** Markdown list. Each finding: one-line title, severity (CRITICAL/HIGH/MEDIUM/LOW), evidence from diff OR file reference, and suggested fix.

**SEVERITY GUIDE:**
- CRITICAL: Causes crash, data corruption, or security issue at boundaries
- HIGH: Incorrect behavior for edge inputs
- MEDIUM: Missing validation for edge case
- LOW: Could be more robust

**PROJECT ACCESS:** You may reference files in `C:\VibeCoding\nexiamind-ai\` to understand the broader context.

---

## DIFF OUTPUT FOR ST-305: Afficher les Citations de Sources

### NEW FILE: src/types/citations.ts
```typescript
export type SourceType = 
  | 'supabase'
  | 'gitlab'
  | 'nexia'
  | 'upload';

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

export interface MessageCitations {
  citations: SourceCitation[];
  hasCitations: boolean;
}

export interface SourceUrlConfig {
  supabase: string;
  gitlab: string;
  nexia: string;
  upload: string;
}

export const DEFAULT_SOURCE_URL_CONFIG: SourceUrlConfig = {
  supabase: 'https://app.supabase.com/project/ref/project-storage',
  gitlab: 'https://gitlab.com/nexiamind-ai',
  nexia: 'https://ged.nexiamind.fr',
  upload: '/uploads',
};
```

---

### NEW FILE: src/components/SourceCitation/SourceCitation.tsx
**KEY SECTIONS:**
```typescript
<a
  href={citation.url}
  target="_blank"
  rel="noopener noreferrer"
  // ...
  onClick={(e) => {
    if (disabled) {
      e.preventDefault();
      e.stopPropagation();
    }
  }}
>
  {citation.path}
</a>
```

---

### NEW FILE: src/lib/api/sources.ts
**CRITICAL FUNCTIONS:**
```typescript
export function getSourceUrl(
  source: { path: string; type: SourceType },
  config: SourceUrlConfig = DEFAULT_SOURCE_URL_CONFIG
): string | null {
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

export function filterAndConvertSources(
  rawSources: RawSource[] | undefined,
  config: SourceUrlConfig = DEFAULT_SOURCE_URL_CONFIG
): SourceCitation[] {
  if (!rawSources || rawSources.length === 0) {
    return [];
  }
  const validSources = rawSources.filter(isValidSource);
  return validSources.map((source, index) => 
    convertToSourceCitation(source, index + 1, config)
  );
}

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
```

---

### MODIFIED: src/components/Chat/ChatMessage.tsx
```typescript
interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  showAvatar: boolean
  citations?: SourceCitation[]
}

// In assistant message return:
{citations && citations.length > 0 && (
  <SourceCitationList 
    citations={citations} 
    title="📚 Sources :" 
    data-testid="chat-sources"
  />
)}
```

---

### MODIFIED: src/app/chat/page.tsx
```typescript
// Line 63:
const history = await getHistory()

// Line 109:
const citations = filterAndConvertSources(response.sources)

// Line 113-117:
{
  id: response.id, 
  role: 'assistant', 
  content: response.content,
  citations: citations.length > 0 ? citations : undefined,
}
```

---

## CONTEXT FILES YOU MAY ACCESS:
- `C:\VibeCoding\nexiamind-ai\_bmad-output\implementation-artifacts\4-305-afficher-les-citations-de-sources.md` (spec)
- `C:\VibeCoding\nexiamind-ai\src\components\Chat\ChatMessage.tsx` (full file)
- `C:\VibeCoding\nexiamind-ai\src\app\chat\page.tsx` (full file)
- Any other project files for context

---

## FOCUS AREAS FOR EDGE CASES:

1. **URL Generation** (`getSourceUrl`):
   - What if `source.type` is not in SourceType union?
   - What if `source.path` contains special characters?
   - What if `source.path` is `//path`?
   - What if config has invalid URLs?

2. **Source Validation** (`isValidSource`):
   - What if `source` is null or undefined?
   - What if `source.type` is null/undefined?
   - What if `source.path` is a number or object?

3. **Filtering & Conversion** (`filterAndConvertSources`):
   - What if `rawSources` contains null/undefined elements?
   - What if all sources are invalid?
   - What if relevance is negative or > 1?

4. **Component Rendering** (SourceCitation, SourceCitationList):
   - What if `citation.url` is empty string?
   - What if `citation.path` is very long?
   - What if `citation.index` is 0 or negative?
   - What if citations array is null (not just undefined)?

5. **Integration** (ChatMessage, page.tsx):
   - What if `response.sources` is null?
   - What if `response.sources` contains invalid sources?
   - What if getHistory throws?
   - What if filterAndConvertSources returns empty?

6. **ID Generation** (`convertToSourceCitation`):
   - What if path contains special characters that break CSS selectors?
   - What if same source appears twice?

---

## END OF DIFF

**YOUR TASK:** Review the diff AND access the project to find edge cases. Output findings as specified.
