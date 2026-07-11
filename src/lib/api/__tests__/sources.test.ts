import { expect, test, describe, vi } from 'vitest'
import {
  getSourceUrl,
  convertToSourceCitation,
  convertToSourceCitations,
  isValidSource,
  filterAndConvertSources,
  getDefaultSourceUrlConfig,
  updateSourceUrlConfig,
} from '../sources'
import type { RawSource, SourceCitation, SourceUrlConfig } from '@/types/citations'

describe('sources API client', () => {
  describe('getSourceUrl', () => {
    test('returns correct URL for supabase source', () => {
      const source = { path: '/docs/test.pdf', type: 'supabase' as const }
      const url = getSourceUrl(source)
      expect(url).toBe('https://app.supabase.com/project/ref/project-storage/docs/test.pdf')
    })

    test('returns correct URL for gitlab source', () => {
      const source = { path: '/repo/file.md', type: 'gitlab' as const }
      const url = getSourceUrl(source)
      expect(url).toBe('https://gitlab.com/nexiamind-ai/repo/file.md')
    })

    test('returns correct URL for nexia source', () => {
      const source = { path: '/ged/document.pdf', type: 'nexia' as const }
      const url = getSourceUrl(source)
      expect(url).toBe('https://ged.nexiamind.fr/ged/document.pdf')
    })

    test('returns correct URL for upload source', () => {
      const source = { path: '/uploads/file.txt', type: 'upload' as const }
      const url = getSourceUrl(source)
      expect(url).toBe('/uploads/uploads/file.txt')
    })

    test('removes leading slash from path', () => {
      const source = { path: '/docs/test.pdf', type: 'nexia' as const }
      const url = getSourceUrl(source)
      expect(url).toBe('https://ged.nexiamind.fr/docs/test.pdf')
    })

    test('returns null for unknown source type', () => {
      const source = { path: '/test.pdf', type: 'unknown' as any }
      const url = getSourceUrl(source)
      expect(url).toBeNull()
    })

    test('uses custom config when provided', () => {
      const customConfig: SourceUrlConfig = {
        supabase: 'https://custom.supabase.com',
        gitlab: 'https://custom.gitlab.com',
        nexia: 'https://custom.nexia.com',
        upload: '/custom-uploads',
      }
      const source = { path: '/test.pdf', type: 'nexia' as const }
      const url = getSourceUrl(source, customConfig)
      expect(url).toBe('https://custom.nexia.com/test.pdf')
    })
  })

  describe('convertToSourceCitation', () => {
    test('converts raw source to SourceCitation with correct index', () => {
      const rawSource: RawSource = {
        path: '/docs/test.pdf',
        type: 'nexia',
        relevance: 0.95,
      }
      const citation = convertToSourceCitation(rawSource, 1)
      
      expect(citation).toEqual({
        id: 'nexia-/docs/test.pdf-1',
        path: '/docs/test.pdf',
        type: 'nexia',
        relevance: 0.95,
        url: 'https://ged.nexiamind.fr/docs/test.pdf',
        index: 1,
      })
    })

    test('generates correct id format', () => {
      const rawSource: RawSource = {
        path: '/file.md',
        type: 'gitlab',
      }
      const citation = convertToSourceCitation(rawSource, 3)
      
      expect(citation.id).toBe('gitlab-/file.md-3')
    })

    test('handles missing relevance', () => {
      const rawSource: RawSource = {
        path: '/docs/test.pdf',
        type: 'nexia',
      }
      const citation = convertToSourceCitation(rawSource, 1)
      
      expect(citation.relevance).toBeUndefined()
    })

    test('returns empty string for url when type is unknown', () => {
      const rawSource = { path: '/test.pdf', type: 'unknown' as any }
      const citation = convertToSourceCitation(rawSource, 1)
      
      expect(citation.url).toBe('')
    })
  })

  describe('convertToSourceCitations', () => {
    test('converts array of raw sources to SourceCitations', () => {
      const rawSources: RawSource[] = [
        { path: '/doc1.pdf', type: 'nexia', relevance: 0.95 },
        { path: '/doc2.md', type: 'gitlab', relevance: 0.88 },
      ]
      const citations = convertToSourceCitations(rawSources)
      
      expect(citations).toHaveLength(2)
      expect(citations[0].index).toBe(1)
      expect(citations[1].index).toBe(2)
    })

    test('returns empty array for undefined input', () => {
      const citations = convertToSourceCitations(undefined)
      expect(citations).toEqual([])
    })

    test('returns empty array for empty array', () => {
      const citations = convertToSourceCitations([])
      expect(citations).toEqual([])
    })
  })

  describe('isValidSource', () => {
    test('returns true for valid supabase source', () => {
      const source: RawSource = { path: '/test.pdf', type: 'supabase' }
      expect(isValidSource(source)).toBe(true)
    })

    test('returns true for valid gitlab source', () => {
      const source: RawSource = { path: '/test.md', type: 'gitlab' }
      expect(isValidSource(source)).toBe(true)
    })

    test('returns true for valid nexia source', () => {
      const source: RawSource = { path: '/test.pdf', type: 'nexia' }
      expect(isValidSource(source)).toBe(true)
    })

    test('returns true for valid upload source', () => {
      const source: RawSource = { path: '/test.txt', type: 'upload' }
      expect(isValidSource(source)).toBe(true)
    })

    test('returns false for unknown type', () => {
      const source = { path: '/test.pdf', type: 'unknown' as any }
      expect(isValidSource(source)).toBe(false)
    })

    test('returns false for empty path', () => {
      const source: RawSource = { path: '', type: 'nexia' }
      expect(isValidSource(source)).toBe(false)
    })

    test('returns false for whitespace path', () => {
      const source: RawSource = { path: '   ', type: 'nexia' }
      expect(isValidSource(source)).toBe(false)
    })

    test('returns false for null path', () => {
      const source = { path: null as any, type: 'nexia' }
      expect(isValidSource(source)).toBe(false)
    })
  })

  describe('filterAndConvertSources', () => {
    test('filters out invalid sources and converts valid ones', () => {
      const rawSources: RawSource[] = [
        { path: '/valid1.pdf', type: 'nexia' },
        { path: '', type: 'nexia' }, // invalid - empty path
        { path: '/valid2.md', type: 'gitlab' },
        { path: '/invalid.pdf', type: 'unknown' as any }, // invalid - unknown type
      ]
      const citations = filterAndConvertSources(rawSources)
      
      expect(citations).toHaveLength(2)
      expect(citations[0].path).toBe('/valid1.pdf')
      expect(citations[1].path).toBe('/valid2.md')
      // Re-indexed after filtering
      expect(citations[0].index).toBe(1)
      expect(citations[1].index).toBe(2)
    })

    test('returns empty array for all invalid sources', () => {
      const rawSources = [
        { path: '', type: 'nexia' },
        { path: '/test.pdf', type: 'unknown' as any },
      ]
      const citations = filterAndConvertSources(rawSources)
      expect(citations).toEqual([])
    })

    test('returns empty array for undefined input', () => {
      const citations = filterAndConvertSources(undefined)
      expect(citations).toEqual([])
    })
  })

  describe('getDefaultSourceUrlConfig', () => {
    test('returns the default configuration', () => {
      const config = getDefaultSourceUrlConfig()
      
      expect(config).toEqual({
        supabase: 'https://app.supabase.com/project/ref/project-storage',
        gitlab: 'https://gitlab.com/nexiamind-ai',
        nexia: 'https://ged.nexiamind.fr',
        upload: '/uploads',
      })
    })

    test('returns a new object each time', () => {
      const config1 = getDefaultSourceUrlConfig()
      const config2 = getDefaultSourceUrlConfig()
      
      expect(config1).not.toBe(config2)
    })
  })

  describe('updateSourceUrlConfig', () => {
    test('merges partial config with defaults', () => {
      const partialConfig = {
        nexia: 'https://new.nexia.fr',
      }
      const updated = updateSourceUrlConfig(partialConfig)
      
      expect(updated.nexia).toBe('https://new.nexia.fr')
      expect(updated.supabase).toBe('https://app.supabase.com/project/ref/project-storage')
      expect(updated.gitlab).toBe('https://gitlab.com/nexiamind-ai')
      expect(updated.upload).toBe('/uploads')
    })

    test('overrides multiple values', () => {
      const partialConfig = {
        supabase: 'https://new.supabase.com',
        gitlab: 'https://new.gitlab.com',
      }
      const updated = updateSourceUrlConfig(partialConfig)
      
      expect(updated.supabase).toBe('https://new.supabase.com')
      expect(updated.gitlab).toBe('https://new.gitlab.com')
      expect(updated.nexia).toBe('https://ged.nexiamind.fr')
      expect(updated.upload).toBe('/uploads')
    })
  })
})
