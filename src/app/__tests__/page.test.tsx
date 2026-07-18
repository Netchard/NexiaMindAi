import { expect, test, describe, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Home from '../page'
import { readAndClearPendingMessage } from '@/lib/utils/pendingMessage'

const { push } = vi.hoisted(() => ({ push: vi.fn() }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

const { useAuthMock } = vi.hoisted(() => ({ useAuthMock: vi.fn() }))

vi.mock('@/components/Auth', () => ({
  useAuth: useAuthMock,
}))

const { createNewConversation, getConversations } = vi.hoisted(() => ({
  createNewConversation: vi.fn(),
  getConversations: vi.fn(),
}))

vi.mock('@/lib/api/conversations', () => ({
  createNewConversation,
  getConversations,
}))

function mockAuth(overrides: { user: { id: string } | null; loading: boolean }) {
  useAuthMock.mockReturnValue({
    session: null,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    resetPassword: vi.fn(),
    exchangeRecoveryCode: vi.fn(),
    updatePassword: vi.fn(),
    ...overrides,
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
  mockAuth({ user: null, loading: false })
})

describe('Home page (/)', () => {
  test('renders the hero, both CTAs, the 4 suggestion chips and the 3-step explainer', () => {
    render(<Home />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/à portée de conversation/i)
    expect(screen.getByRole('button', { name: 'Discuter avec Nexia' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Commencer une conversation' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Explorer les documents' })).toBeInTheDocument()

    expect(screen.getByText('Que fait le logiciel Codexia ?')).toBeInTheDocument()
    expect(screen.getByText('Résume la notice Workflow')).toBeInTheDocument()
    expect(screen.getByText('Explique la GED en 3 points')).toBeInTheDocument()
    expect(screen.getByText('Où trouver le paramétrage des répertoires ?')).toBeInTheDocument()

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Trois pas, et vous avez la réponse')
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3)
  })

  test('redirects an unauthenticated visitor to login when clicking the primary CTA', () => {
    mockAuth({ user: null, loading: false })
    render(<Home />)

    fireEvent.click(screen.getByRole('button', { name: 'Discuter avec Nexia' }))

    expect(push).toHaveBeenCalledWith('/auth/login?redirect=%2Fchat')
    expect(createNewConversation).not.toHaveBeenCalled()
  })

  test('redirects an unauthenticated visitor to login when clicking a suggestion chip', () => {
    mockAuth({ user: null, loading: false })
    render(<Home />)

    fireEvent.click(screen.getByText('Résume la notice Workflow'))

    expect(push).toHaveBeenCalledWith('/auth/login?redirect=%2Fchat')
    expect(createNewConversation).not.toHaveBeenCalled()
    expect(getConversations).not.toHaveBeenCalled()
  })

  test('treats an indeterminate auth status (loading) as unauthenticated', () => {
    mockAuth({ user: null, loading: true })
    render(<Home />)

    fireEvent.click(screen.getByRole('button', { name: 'Commencer une conversation' }))

    expect(push).toHaveBeenCalledWith('/auth/login?redirect=%2Fchat')
  })

  test('authenticated: primary CTA navigates straight to /chat', () => {
    mockAuth({ user: { id: 'u1' }, loading: false })
    render(<Home />)

    fireEvent.click(screen.getByRole('button', { name: 'Discuter avec Nexia' }))

    expect(push).toHaveBeenCalledWith('/chat')
    expect(createNewConversation).not.toHaveBeenCalled()
  })

  test('authenticated: closing CTA has the same behavior as the primary CTA', () => {
    mockAuth({ user: { id: 'u1' }, loading: false })
    render(<Home />)

    fireEvent.click(screen.getByRole('button', { name: 'Commencer une conversation' }))

    expect(push).toHaveBeenCalledWith('/chat')
  })

  test('authenticated: clicking a generic chip creates a conversation, stores the pending message, then navigates to it', async () => {
    mockAuth({ user: { id: 'u1' }, loading: false })
    createNewConversation.mockResolvedValue({ conversationId: 'conv-123' })
    render(<Home />)

    fireEvent.click(screen.getByText('Résume la notice Workflow'))

    await waitFor(() => expect(push).toHaveBeenCalledWith('/chat/conv-123'))
    expect(createNewConversation).toHaveBeenCalledWith('Nouvelle conversation')
    expect(readAndClearPendingMessage('conv-123')).toBe('Résume la notice Workflow')
  })

  test('a second click while a chip request is in flight is ignored (no duplicate conversation)', async () => {
    mockAuth({ user: { id: 'u1' }, loading: false })
    let resolveCreate: (value: { conversationId: string }) => void = () => {}
    createNewConversation.mockReturnValue(new Promise((resolve) => { resolveCreate = resolve }))
    render(<Home />)

    const chip = screen.getByText('Résume la notice Workflow')
    fireEvent.click(chip)
    fireEvent.click(chip)
    fireEvent.click(chip)

    resolveCreate({ conversationId: 'conv-123' })
    await waitFor(() => expect(push).toHaveBeenCalledWith('/chat/conv-123'))

    expect(createNewConversation).toHaveBeenCalledTimes(1)
  })

  test('authenticated: Codexia chip navigates directly to the matching conversation without creating one', async () => {
    mockAuth({ user: { id: 'u1' }, loading: false })
    getConversations.mockResolvedValue({
      conversations: [
        {
          id: 'conv-existing',
          title: 'Que fait Codexia et à quoi ça sert ?',
          createdAt: '2026-07-17T00:00:00.000Z',
          updatedAt: '2026-07-17T00:00:00.000Z',
          messageCount: 4,
        },
      ],
      total: 1,
      offset: 0,
      limit: 50,
    })
    render(<Home />)

    fireEvent.click(screen.getByText('Que fait le logiciel Codexia ?'))

    await waitFor(() => expect(push).toHaveBeenCalledWith('/chat/conv-existing'))
    expect(createNewConversation).not.toHaveBeenCalled()
    expect(readAndClearPendingMessage('conv-existing')).toBeNull()
  })

  test('authenticated: Codexia search uses a higher limit so an older match is not missed', async () => {
    mockAuth({ user: { id: 'u1' }, loading: false })
    getConversations.mockResolvedValue({ conversations: [], total: 0, offset: 0, limit: 200 })
    createNewConversation.mockResolvedValue({ conversationId: 'conv-new' })
    render(<Home />)

    fireEvent.click(screen.getByText('Que fait le logiciel Codexia ?'))

    await waitFor(() => expect(getConversations).toHaveBeenCalled())
    expect(getConversations.mock.calls[0][0]).toBeGreaterThan(50)
  })

  test('authenticated: Codexia chip falls back to the generic create flow when no conversation matches', async () => {
    mockAuth({ user: { id: 'u1' }, loading: false })
    getConversations.mockResolvedValue({ conversations: [], total: 0, offset: 0, limit: 50 })
    createNewConversation.mockResolvedValue({ conversationId: 'conv-new' })
    render(<Home />)

    fireEvent.click(screen.getByText('Que fait le logiciel Codexia ?'))

    await waitFor(() => expect(push).toHaveBeenCalledWith('/chat/conv-new'))
    expect(createNewConversation).toHaveBeenCalledWith('Nouvelle conversation')
    expect(readAndClearPendingMessage('conv-new')).toBe('Que fait le logiciel Codexia ?')
  })

  test('shows a local error and does not navigate when conversation creation fails', async () => {
    mockAuth({ user: { id: 'u1' }, loading: false })
    createNewConversation.mockRejectedValue(new Error('network error'))
    render(<Home />)

    fireEvent.click(screen.getByText('Explique la GED en 3 points'))

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(push).not.toHaveBeenCalled()
  })

  test('shows a local error and does not navigate when the Codexia lookup fails', async () => {
    mockAuth({ user: { id: 'u1' }, loading: false })
    getConversations.mockRejectedValue(new Error('network error'))
    render(<Home />)

    fireEvent.click(screen.getByText('Que fait le logiciel Codexia ?'))

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(push).not.toHaveBeenCalled()
    expect(createNewConversation).not.toHaveBeenCalled()
  })

  test('disabled secondary CTA exposes the correct a11y contract and never navigates', () => {
    mockAuth({ user: { id: 'u1' }, loading: false })
    render(<Home />)

    const button = screen.getByRole('button', { name: 'Explorer les documents' })
    expect(button.tagName).toBe('BUTTON')
    expect(button).toHaveAttribute('type', 'button')
    expect(button).toHaveAttribute('aria-disabled', 'true')
    expect(button).not.toHaveAttribute('disabled')

    const describedById = button.getAttribute('aria-describedby')
    expect(describedById).toBeTruthy()
    const tooltip = document.getElementById(describedById as string)
    expect(tooltip).not.toBeNull()
    expect(tooltip).toHaveTextContent('Bientôt disponible')

    fireEvent.click(button)
    fireEvent.keyDown(button, { key: 'Enter' })
    fireEvent.keyDown(button, { key: ' ' })
    expect(push).not.toHaveBeenCalled()
  })

  test('disabled secondary CTA tooltip appears on focus and is dismissible via Escape without losing focus', () => {
    mockAuth({ user: { id: 'u1' }, loading: false })
    render(<Home />)

    const button = screen.getByRole('button', { name: 'Explorer les documents' })
    const describedById = button.getAttribute('aria-describedby') as string
    const tooltip = document.getElementById(describedById) as HTMLElement

    // Toujours présent dans le DOM, seulement masqué visuellement avant tout focus/survol.
    expect(tooltip.className).toMatch(/invisible|opacity-0/)

    fireEvent.focus(button)
    expect(tooltip.className).toMatch(/visible/)
    expect(tooltip.className).toMatch(/opacity-100/)

    fireEvent.keyDown(button, { key: 'Escape' })
    expect(tooltip.className).toMatch(/invisible|opacity-0/)
  })
})
