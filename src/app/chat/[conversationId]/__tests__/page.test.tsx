import { Suspense } from 'react'
import { expect, test, describe, vi, beforeEach } from 'vitest'
import { render, waitFor, act } from '@testing-library/react'
import ConversationPage from '../page'

const { onSendMessage } = vi.hoisted(() => ({ onSendMessage: vi.fn() }))

let mockIsLoading = false

vi.mock('@/components/Conversations', () => ({
  useConversations: () => ({
    conversations: [],
    currentMessages: [],
    conversationStates: {},
    isLoading: mockIsLoading,
    error: null,
    onSendMessage,
    onRenameConversation: vi.fn(),
    onDeleteConversation: vi.fn(),
    getFiltersForConversation: () => ({}),
  }),
}))

vi.mock('@/components/Chat', () => ({
  ChatInput: () => null,
  ChatMessageList: () => null,
}))

vi.mock('@/components/Conversation', () => ({
  ConversationHeader: () => null,
}))

// `use(params)` suspend au premier rendu même pour une promesse déjà résolue
// (React n'a pas encore attaché son propre suivi `.then` dessus) — un
// `act(async () => ...)` est nécessaire pour laisser ce premier cycle de
// suspension/résolution se dérouler avant que les assertions ne s'exécutent.
async function renderPage(conversationId = 'conv-123') {
  let utils!: ReturnType<typeof render>
  await act(async () => {
    utils = render(
      <Suspense fallback={null}>
        <ConversationPage params={Promise.resolve({ conversationId })} />
      </Suspense>
    )
  })
  return utils
}

beforeEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
  mockIsLoading = false
})

describe('ConversationPage — pending-message handoff (from accueil)', () => {
  test('sends the pending message once on mount and clears it from sessionStorage', async () => {
    sessionStorage.setItem(
      'nexiamind:pending-message:conv-123',
      JSON.stringify({ text: 'Résume la notice Workflow', ts: Date.now() })
    )

    await renderPage('conv-123')

    await waitFor(() =>
      expect(onSendMessage).toHaveBeenCalledWith('conv-123', 'Résume la notice Workflow', {})
    )
    expect(onSendMessage).toHaveBeenCalledTimes(1)
    expect(sessionStorage.getItem('nexiamind:pending-message:conv-123')).toBeNull()
  })

  test('does nothing when no pending message exists for this conversation', async () => {
    await renderPage('conv-empty')
    expect(onSendMessage).not.toHaveBeenCalled()
  })

  test('waits for the initial conversation load to settle before sending (avoids the loadConversationMessages race)', async () => {
    mockIsLoading = true
    sessionStorage.setItem(
      'nexiamind:pending-message:conv-123',
      JSON.stringify({ text: 'Explique la GED en 3 points', ts: Date.now() })
    )

    const { rerender } = await renderPage('conv-123')
    expect(onSendMessage).not.toHaveBeenCalled()
    // La clé doit rester en attente tant que isLoading est vrai.
    expect(sessionStorage.getItem('nexiamind:pending-message:conv-123')).not.toBeNull()

    mockIsLoading = false
    await act(async () => {
      rerender(
        <Suspense fallback={null}>
          <ConversationPage params={Promise.resolve({ conversationId: 'conv-123' })} />
        </Suspense>
      )
    })

    await waitFor(() =>
      expect(onSendMessage).toHaveBeenCalledWith('conv-123', 'Explique la GED en 3 points', {})
    )
  })

  test('ignores a stale pending message left over from an interrupted navigation (older than the TTL)', async () => {
    sessionStorage.setItem(
      'nexiamind:pending-message:conv-123',
      JSON.stringify({ text: 'Vieux message', ts: Date.now() - 120_000 })
    )

    await renderPage('conv-123')

    expect(onSendMessage).not.toHaveBeenCalled()
    expect(sessionStorage.getItem('nexiamind:pending-message:conv-123')).toBeNull()
  })
})
