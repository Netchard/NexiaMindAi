'use client'

/**
 * Page d'accueil (`/`) — hero, 2 CTA, 4 puces de suggestion, explicatif "3 étapes".
 * Remplace le template Next.js par défaut.
 *
 * Voir _bmad-output/implementation-artifacts/spec-accueil-page-fonctionnelle.md
 * et _bmad-output/planning-artifacts/ux-designs/ux-nexiamind-ai-2026-07-18-accueil/{DESIGN,EXPERIENCE}.md
 *
 * `/` est publique — la garde d'authentification est appliquée par action
 * (useAuth()), pas au niveau de la route. Pas de ConversationsProvider ici
 * (voir Design Notes du spec) : les fonctions de src/lib/api/conversations.ts
 * sont appelées directement, sans passer par le contexte React de /chat/*.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/Auth'
import { createNewConversation, getConversations } from '@/lib/api/conversations'
import { writePendingMessage } from '@/lib/utils/pendingMessage'

/**
 * Limite haute pour la recherche "Codexia" — au-delà de la limite par défaut
 * (50), une conversation existante plus ancienne serait manquée et un doublon
 * créé à tort. Reste une borne, pas une pagination complète : compromis
 * volontaire, voir deferred-work.md pour le cas d'un historique encore plus
 * long combiné à un cache périmé.
 */
const CODEXIA_SEARCH_LIMIT = 200

interface SuggestionChip {
  label: string
  /** Puce "Codexia" : cherche d'abord une conversation existante avant de créer */
  isCodexiaSearch?: boolean
}

const CHIPS: SuggestionChip[] = [
  { label: 'Que fait le logiciel Codexia ?', isCodexiaSearch: true },
  { label: 'Résume la notice Workflow' },
  { label: 'Explique la GED en 3 points' },
  { label: 'Où trouver le paramétrage des répertoires ?' },
]

const STEPS = [
  {
    n: '1',
    title: 'Demandez',
    body: 'Écrivez ou dictez votre question en langage naturel — comme à un collègue.',
  },
  {
    n: '2',
    title: 'Nexia cherche',
    body: "L'assistant parcourt vos documents, croise les passages pertinents et raisonne dessus.",
  },
  {
    n: '3',
    title: 'Réponse sourcée',
    body: 'Vous recevez une réponse claire, avec les documents cités pour tout vérifier.',
  },
]

const LOGIN_REDIRECT = '/auth/login?redirect=%2Fchat'

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function Home() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tooltipHovered, setTooltipHovered] = useState(false)
  const [tooltipFocused, setTooltipFocused] = useState(false)
  const [tooltipDismissed, setTooltipDismissed] = useState(false)
  // Visible sur survol OU focus indépendamment (WCAG 1.4.13) — un état
  // partagé unique se faisait écraser par mouseleave même quand le bouton
  // gardait le focus clavier après un passage de souris.
  const tooltipVisible = (tooltipHovered || tooltipFocused) && !tooltipDismissed

  // Statut indéterminé (loading === true) traité comme non connecté (voir I/O matrix).
  const isAuthenticated = !loading && user !== null

  const handlePrimaryCtaClick = () => {
    if (!isAuthenticated) {
      router.push(LOGIN_REDIRECT)
      return
    }
    router.push('/chat')
  }

  const handleChipClick = async (chip: SuggestionChip) => {
    if (!isAuthenticated) {
      router.push(LOGIN_REDIRECT)
      return
    }
    // Garde anti double-clic : un deuxième clic pendant la requête en cours
    // créerait une conversation en doublon avant que la navigation n'ait eu
    // lieu (pas de désactivation native possible, le bouton reste un simple
    // <button> synchrone au clic).
    if (isSubmitting) return
    setIsSubmitting(true)
    setError(null)

    if (chip.isCodexiaSearch) {
      try {
        const { conversations } = await getConversations(CODEXIA_SEARCH_LIMIT)
        const match = conversations.find((c) => c.title.toLowerCase().includes('codexia'))
        if (match) {
          router.push(`/chat/${match.id}`)
          return
        }
      } catch {
        setError('Impossible de vérifier vos conversations existantes. Veuillez réessayer.')
        setIsSubmitting(false)
        return
      }
    }

    try {
      const { conversationId } = await createNewConversation('Nouvelle conversation')
      // Échec silencieux si sessionStorage est indisponible (quota, navigation
      // privée) : la conversation existe déjà côté serveur, mieux vaut y
      // naviguer sans le message pré-rempli que d'afficher une fausse erreur
      // de création et abandonner une conversation déjà créée.
      writePendingMessage(conversationId, chip.label)
      router.push(`/chat/${conversationId}`)
    } catch {
      setError('Impossible de créer la conversation. Veuillez réessayer.')
      setIsSubmitting(false)
    }
  }

  // CTA secondaire "Explorer les documents" — toujours désactivé, ne consulte
  // jamais useAuth() (voir Component Patterns). aria-disabled seul ne bloque
  // pas l'activation : le gestionnaire reste explicitement no-op.
  const handleDisabledCtaClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
  }

  const handleDisabledCtaKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Escape') {
      // Dismissible par Échap sans perdre le focus du bouton (WCAG 1.4.13).
      setTooltipDismissed(true)
      return
    }
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault()
    }
  }

  return (
    <div className="flex flex-1 flex-col bg-[#0a1524]">
      <section className="mx-auto w-full max-w-[1280px] px-6 pt-20 pb-24 sm:px-10">
        {/* Badge "Assistant RAG • en ligne" */}
        <div
          className="mb-6 inline-flex items-center gap-2.5 rounded-full border px-4 py-1.5 text-[12.5px] font-semibold uppercase tracking-[0.04em]"
          style={{
            background: 'rgba(242,101,44,0.08)',
            borderColor: 'rgba(242,101,44,0.35)',
            color: '#FF8A56',
          }}
        >
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full motion-safe:animate-pulse"
            style={{ background: '#FF8A56', boxShadow: '0 0 10px #FF8A56' }}
          />
          Assistant RAG • en ligne
        </div>

        {/* Titre du hero */}
        <h1
          className="font-display max-w-3xl text-[38px] font-semibold leading-[1.04] tracking-[-0.015em] sm:text-[60px]"
          style={{ color: '#F6F8FC' }}
        >
          Toute la connaissance de l&apos;entreprise,{' '}
          <em style={{ color: '#FF8A56' }}>à portée de conversation.</em>
        </h1>

        {/* Sous-titre du hero */}
        <p className="mt-6 max-w-[520px] text-lg leading-relaxed" style={{ color: '#A8B0C0' }}>
          Posez votre question à Nexia. Elle explore vos documents techniques, croise les sources
          et vous répond en quelques secondes — références à l&apos;appui.
        </p>

        {/* CTA du hero */}
        <div className="mt-8 flex flex-wrap items-center gap-3.5">
          <button
            type="button"
            onClick={handlePrimaryCtaClick}
            className="inline-flex items-center gap-2.5 rounded-[12px] bg-gradient-to-br from-chat-primary to-chat-primary-active px-7 py-4 text-[19px] font-bold text-chat-on-primary shadow-[0_12px_30px_rgba(244,105,63,.55)] transition-[filter] hover:brightness-[1.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chat-primary motion-reduce:transition-none"
          >
            Discuter avec Nexia
            <ArrowIcon />
          </button>

          <div
            className="relative inline-block"
            onMouseEnter={() => {
              setTooltipDismissed(false)
              setTooltipHovered(true)
            }}
            onMouseLeave={() => setTooltipHovered(false)}
          >
            <button
              type="button"
              aria-disabled="true"
              aria-describedby="cta-secondary-tooltip"
              onFocus={() => {
                setTooltipDismissed(false)
                setTooltipFocused(true)
              }}
              onBlur={() => setTooltipFocused(false)}
              onClick={handleDisabledCtaClick}
              onKeyDown={handleDisabledCtaKeyDown}
              className="inline-flex cursor-not-allowed items-center gap-2.5 rounded-[12px] border px-7 py-4 text-[19px] font-bold opacity-[0.55] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chat-primary motion-reduce:transition-none"
              style={{
                background: 'rgba(255,255,255,0.03)',
                borderColor: 'rgba(255,255,255,0.12)',
                color: '#DFE4EE',
              }}
            >
              Explorer les documents
            </button>
            <span
              id="cta-secondary-tooltip"
              role="tooltip"
              className={`absolute left-1/2 top-full z-10 mt-2 w-max max-w-[220px] -translate-x-1/2 rounded-md border px-3 py-2 text-xs transition-opacity motion-reduce:transition-none ${
                tooltipVisible ? 'visible opacity-100' : 'invisible opacity-0'
              }`}
              style={{
                background: '#0E1B2E',
                borderColor: '#2A3B58',
                color: '#B7C3D6',
              }}
            >
              Bientôt disponible
            </span>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 max-w-md rounded-md border border-chat-error-border bg-chat-error-surface px-3.5 py-2.5 text-sm text-chat-error-soft"
          >
            {error}
          </div>
        )}

        {/* Puces de suggestion */}
        <div className="mt-11">
          <p
            className="mb-3.5 text-[13px] font-semibold uppercase tracking-[0.05em]"
            style={{ color: '#8D9CB5' }}
          >
            Essayez une question — cliquez pour lancer le chat
          </p>
          <div className="flex flex-wrap gap-2.5">
            {CHIPS.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => handleChipClick(chip)}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors hover:border-[rgba(242,101,44,0.5)] hover:bg-[rgba(242,101,44,0.08)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chat-primary motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-[rgba(255,255,255,0.1)] disabled:hover:bg-transparent disabled:hover:text-inherit"
                style={{
                  background: 'rgba(255,255,255,0.035)',
                  borderColor: 'rgba(255,255,255,0.1)',
                  color: '#CDD4E0',
                }}
              >
                <span aria-hidden="true" style={{ color: '#FF8A56' }}>
                  →
                </span>
                <span>{chip.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Explicatif "3 étapes" */}
      <section className="mx-auto w-full max-w-[1280px] px-6 pb-24 sm:px-10">
        <div className="mb-10 text-center">
          <h2
            className="font-display text-[30px] font-semibold sm:text-[38px]"
            style={{ color: '#F6F8FC' }}
          >
            Trois pas, et vous avez la réponse
          </h2>
          <p className="mt-3 text-base" style={{ color: '#A8B0C0' }}>
            Nexia transforme des milliers de pages en réponses claires et sourcées.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {STEPS.map((step) => (
            <div
              key={step.n}
              className="rounded-[18px] border border-[rgba(255,255,255,0.07)] p-6 transition-colors hover:border-[rgba(242,101,44,0.35)] motion-reduce:transition-none"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01))',
              }}
            >
              <div
                className="font-display mb-4 flex h-[46px] w-[46px] items-center justify-center rounded-[12px] border text-[22px] font-bold"
                style={{
                  background: 'rgba(242,101,44,0.12)',
                  borderColor: 'rgba(242,101,44,0.3)',
                  color: '#FF8A56',
                }}
              >
                {step.n}
              </div>
              <h3 className="text-[19px] font-bold" style={{ color: '#F2F5FA' }}>
                {step.title}
              </h3>
              <p className="mt-2 text-[14.5px] leading-relaxed" style={{ color: '#98A1B3' }}>
                {step.body}
              </p>
            </div>
          ))}
        </div>

        {/* CTA de clôture — même comportement et même garde d'auth que le CTA primaire */}
        <div className="mt-12 flex justify-center">
          <button
            type="button"
            onClick={handlePrimaryCtaClick}
            className="inline-flex items-center gap-2.5 rounded-[12px] bg-gradient-to-br from-chat-primary to-chat-primary-active px-[30px] py-[15px] text-[19px] font-bold text-chat-on-primary shadow-[0_12px_30px_rgba(244,105,63,.4)] transition-[filter] hover:brightness-[1.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chat-primary motion-reduce:transition-none"
          >
            Commencer une conversation
            <ArrowIcon />
          </button>
        </div>
      </section>
    </div>
  )
}
