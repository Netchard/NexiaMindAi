/**
 * Types partagés pour les conversations
 * Utilisés par les composants frontend et les endpoints API
 */

import type { SourceCitation } from './citations';
import type { Filters, FilterState } from './filters';

export type { Filters };

/**
 * Rôle d'un message dans une conversation
 */
export type MessageRole = 'user' | 'assistant';

/**
 * Représente un message dans une conversation
 * Correspond à la structure retournée par l'API /api/chat/messages
 */
export interface ConversationMessage {
  /** Identifiant unique du message */
  id: string;
  /** ID de la conversation à laquelle ce message appartient */
  conversationId: string;
  /** Contenu du message */
  content: string;
  /** Rôle (user ou assistant) */
  role: MessageRole;
  /** Citations de sources (uniquement pour les messages assistant) */
  sources?: SourceCitation[];
  /** Date de création du message */
  createdAt: string;
  /** Échec d'envoi (message utilisateur optimiste dont l'appel API a échoué) */
  failed?: boolean;
}

/**
 * Représente une conversation avec ses métadonnées
 * Correspond à la structure retournée par l'API /api/chat/history
 */
export interface Conversation {
  /** Identifiant unique de la conversation */
  id: string;
  /** Titre de la conversation */
  title: string;
  /** Date de création */
  createdAt: string;
  /** Date de dernière mise à jour */
  updatedAt: string;
  /** Nombre de messages dans cette conversation */
  messageCount: number;
}

/**
 * État d'une conversation dans l'interface utilisateur
 * Inclut les messages et les filtres actifs
 */
export interface ConversationUIState {
  /** Métadonnées de la conversation */
  conversation: Conversation;
  /** Liste des messages de cette conversation */
  messages: ConversationMessage[];
  /** Filtres actifs pour cette conversation */
  filters: FilterState;
  /** Indicateur de chargement */
  isLoading?: boolean;
  /** Erreur éventuelle */
  error?: string | null;
}

/**
 * État global pour la gestion des conversations
 */
export interface ConversationsState {
  /** Liste de toutes les conversations de l'utilisateur */
  conversations: Conversation[];
  /** ID de la conversation active (null si aucune) */
  currentConversationId: string | null;
  /** Map des états UI par conversation ID */
  conversationStates: Record<string, ConversationUIState>;
  /** Indicateur de chargement global */
  isLoading: boolean;
  /** Erreur globale */
  error: string | null;
}

/**
 * Réponse de l'endpoint GET /api/chat/messages
 */
export interface MessagesResponse {
  messages: ConversationMessage[];
  total: number;
  offset: number;
  limit: number;
}

/**
 * Réponse de l'endpoint GET /api/chat/history
 */
export interface HistoryResponse {
  conversations: Conversation[];
  total: number;
  offset: number;
  limit: number;
}

/**
 * Réponse de l'endpoint PATCH /api/conversations/[id]/rename
 */
export interface RenameConversationResponse {
  conversation: {
    id: string;
    title: string;
    updatedAt: string;
  };
}

/**
 * Réponse de l'endpoint DELETE /api/conversations/[id]
 */
export interface DeleteConversationResponse {
  message: string;
  conversationId: string;
}

/**
 * Requête pour le renommage d'une conversation
 */
export interface RenameConversationRequest {
  title: string;
}

/**
 * Paramètres pour les endpoints dynamiques
 */
export interface ConversationParams {
  id: string;
}

/**
 * Action possible sur une conversation
 */
export type ConversationAction = 'rename' | 'delete' | 'select';

/**
 * Filtres par défaut pour une nouvelle conversation
 */
export const DEFAULT_CONVERSATION_FILTERS: Filters = {};

/**
 * Libellés pour les actions sur les conversations
 */
export const CONVERSATION_ACTION_LABELS = {
  rename: 'Renommer',
  delete: 'Supprimer',
  select: 'Sélectionner',
  new: 'Nouvelle conversation',
} as const;

/**
 * Messages de confirmation
 */
export const CONVERSATION_CONFIRMATIONS = {
  delete: 'Êtes-vous sûr de vouloir supprimer cette conversation ? Cette action est irréversible.',
} as const;
