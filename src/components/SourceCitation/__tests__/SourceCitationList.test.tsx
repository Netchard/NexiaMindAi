import { expect, test, describe } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SourceCitationList } from '../SourceCitationList'
import type { SourceCitation } from '@/types/citations'

// Mock citations data
const mockCitations: SourceCitation[] = [
  {
    id: 'test-source-1',
    path: '/docs/test-document.pdf',
    type: 'nexia',
    relevance: 0.95,
    url: 'https://ged.nexiamind.fr/docs/test-document.pdf',
    index: 1,
  },
  {
    id: 'test-source-2',
    path: '/docs/another-file.md',
    type: 'gitlab',
    relevance: 0.88,
    url: 'https://gitlab.com/nexiamind-ai/docs/another-file.md',
    index: 2,
  },
]

const singleCitation: SourceCitation[] = [
  {
    id: 'single-source',
    path: '/docs/single.pdf',
    type: 'nexia',
    url: 'https://ged.nexiamind.fr/docs/single.pdf',
    index: 1,
  },
]

describe('SourceCitationList', () => {
  test('renders list with custom title', () => {
    render(<SourceCitationList citations={mockCitations} title="Custom Title" />)
    
    expect(screen.getByText('Custom Title')).toBeInTheDocument()
  })

  test('renders default title when not provided', () => {
    render(<SourceCitationList citations={mockCitations} />)
    
    expect(screen.getByText('📚 Sources :')).toBeInTheDocument()
  })

  test('renders multiple citations', () => {
    render(<SourceCitationList citations={mockCitations} />)
    
    // Should render both citations
    expect(screen.getByText('/docs/test-document.pdf')).toBeInTheDocument()
    expect(screen.getByText('/docs/another-file.md')).toBeInTheDocument()
    
    // Should have numbering
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  test('renders single citation correctly', () => {
    render(<SourceCitationList citations={singleCitation} />)
    
    expect(screen.getByText('/docs/single.pdf')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  test('returns null when citations array is empty', () => {
    const { container } = render(<SourceCitationList citations={[]} />)
    
    expect(container.firstChild).toBeNull()
  })

  test('returns null when citations is undefined', () => {
    const { container } = render(<SourceCitationList citations={undefined} />)
    
    expect(container.firstChild).toBeNull()
  })

  test('has correct role and aria-label', () => {
    render(<SourceCitationList citations={mockCitations} />)
    
    const listContainer = screen.getByRole('region', { name: /Liste des citations de sources/i })
    expect(listContainer).toBeInTheDocument()
  })

  test('applies custom className', () => {
    render(<SourceCitationList citations={mockCitations} className="custom-list" />)
    
    const listContainer = screen.getByRole('region', { name: /Liste des citations de sources/i })
    expect(listContainer).toHaveClass('custom-list')
  })

  test('disabled state is passed to individual citations', () => {
    render(<SourceCitationList citations={mockCitations} disabled={true} />)
    
    // Each citation should have reduced opacity
    const citationItems = screen.getAllByRole('listitem')
    citationItems.forEach(item => {
      expect(item).toHaveStyle({ opacity: 0.6 })
    })
  })

  test('has border top separator', () => {
    render(<SourceCitationList citations={mockCitations} />)
    
    const listContainer = screen.getByRole('region', { name: /Liste des citations de sources/i })
    expect(listContainer).toHaveStyle({ borderTop: '1px solid #D1D5DB' })
  })

  test('has proper padding and margin', () => {
    render(<SourceCitationList citations={mockCitations} />)
    
    const listContainer = screen.getByRole('region', { name: /Liste des citations de sources/i })
    expect(listContainer).toHaveStyle({ paddingTop: '16px' })
    expect(listContainer).toHaveStyle({ marginTop: '16px' })
  })
})
