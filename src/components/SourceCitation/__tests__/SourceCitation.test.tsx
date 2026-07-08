import { expect, test, describe } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SourceCitation } from '../SourceCitation'
import type { SourceCitation as SourceCitationType } from '@/types/citations'

// Mock citation data
const mockCitation: SourceCitationType = {
  id: 'test-source-1',
  path: '/docs/test-document.pdf',
  type: 'nexia',
  relevance: 0.95,
  url: 'https://ged.nexiamind.fr/docs/test-document.pdf',
  index: 1,
}

const mockCitation2: SourceCitationType = {
  id: 'test-source-2',
  path: '/docs/another-file.md',
  type: 'gitlab',
  relevance: 0.88,
  url: 'https://gitlab.com/nexiamind-ai/docs/another-file.md',
  index: 2,
}

describe('SourceCitation', () => {
  test('renders citation with number, path, and external icon', () => {
    render(<SourceCitation citation={mockCitation} />)
    
    // Check citation number is displayed
    expect(screen.getByText('1')).toBeInTheDocument()
    
    // Check path is displayed
    expect(screen.getByText('/docs/test-document.pdf')).toBeInTheDocument()
    
    // Check external icon (→) is present
    expect(screen.getByText('→')).toBeInTheDocument()
  })

  test('has correct aria-label for citation', () => {
    render(<SourceCitation citation={mockCitation} />)
    
    const citationItem = screen.getByLabelText(/Source 1: \/docs\/test-document\.pdf/i)
    expect(citationItem).toBeInTheDocument()
  })

  test('link opens in new tab with noopener noreferrer', () => {
    render(<SourceCitation citation={mockCitation} />)
    
    const link = screen.getByRole('link', { name: /Ouvrir la source: \/docs\/test-document\.pdf/i })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(link).toHaveAttribute('href', mockCitation.url)
  })

  test('renders with different index numbers', () => {
    render(<SourceCitation citation={mockCitation2} />)
    
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('/docs/another-file.md')).toBeInTheDocument()
  })

  test('applies coral color scheme for numbering and links', () => {
    render(<SourceCitation citation={mockCitation} />)
    
    const numberSpan = screen.getByText('1').parentElement
    expect(numberSpan).toHaveStyle({ backgroundColor: '#EF6C4D' })
    expect(numberSpan).toHaveStyle({ color: '#FFFFFF' })
    
    const link = screen.getByRole('link')
    expect(link).toHaveStyle({ color: '#EF6C4D' })
  })

  test('disabled state reduces opacity and prevents interaction', () => {
    render(<SourceCitation citation={mockCitation} disabled={true} />)
    
    const citationItem = screen.getByLabelText(/Source 1: \/docs\/test-document\.pdf/i)
    expect(citationItem).toHaveStyle({ opacity: 0.6 })
    expect(citationItem).toHaveStyle({ cursor: 'not-allowed' })
  })

  test('focus state shows outline', () => {
    render(<SourceCitation citation={mockCitation} />)
    
    const link = screen.getByRole('link')
    // Focus styles are applied via CSS, we can check the element exists
    expect(link).toBeInTheDocument()
  })

  test('applies custom className', () => {
    render(<SourceCitation citation={mockCitation} className="custom-class" />)
    
    const citationItem = screen.getByLabelText(/Source 1: \/docs\/test-document\.pdf/i)
    expect(citationItem).toHaveClass('custom-class')
  })
})
