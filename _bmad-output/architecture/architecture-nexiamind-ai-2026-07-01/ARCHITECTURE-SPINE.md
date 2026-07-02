---
name: 'NexiaMind AI Architecture Spine'
type: architecture-spine
purpose: build-substrate
altitude: feature
paradigm: 'Layered Architecture with Domain-Driven Design'
scope: 'NexiaMind AI Chat Application with RAG capabilities'
status: draft
created: '2026-07-01'
updated: '2026-07-01'
binds: []
sources: []
companions: []
---

# Architecture Spine — NexiaMind AI

## Design Paradigm

**Layered Architecture with Domain-Driven Design**
- Presentation Layer: Next.js App Router (API routes and UI components)
- Application Layer: Business logic and orchestration
- Domain Layer: Core business entities and rules
- Infrastructure Layer: External services and data access

## Invariants & Rules

### AD-1 — Framework and Runtime

- **Binds:** all
- **Prevents:** Framework fragmentation and inconsistent runtime environments
- **Rule:** All frontend and API code must use Next.js 16.2.9 with React 19.2.4. Server-side logic must use Node.js compatible with Next.js requirements.

### AD-2 — State Management

- **Binds:** all
- **Prevents:** Inconsistent state management approaches across the application
- **Rule:** Application state must be managed through React context for client-side state and Supabase realtime subscriptions for server-synchronized state. No Redux or other external state management libraries.

### AD-3 — Data Access Layer

- **Binds:** all
- **Prevents:** Direct database access from multiple layers and inconsistent data access patterns
- **Rule:** All database access must go through the Supabase client (`@/lib/supabase/client.ts`). Business logic must use the service layer (`@/lib/api/*/service.ts`) rather than calling Supabase directly.

### AD-4 — API Design

- **Binds:** all API routes
- **Prevents:** Inconsistent API response formats and error handling
- **Rule:** All API routes must follow RESTful conventions, use consistent response formats with proper TypeScript interfaces, and implement centralized error handling through the API validator (`@/lib/api/validator.ts`).

### AD-5 — RAG Pipeline Architecture

- **Binds:** chat functionality
- **Prevents:** Tight coupling between retrieval, generation, and formatting components
- **Rule:** The RAG pipeline must be implemented as separate, composable modules (`retriever.ts`, `generator.ts`, `formatter.ts`) with clear interfaces defined in `types.ts`. Each component must be independently testable.

### AD-6 — Authentication and Authorization

- **Binds:** all protected routes
- **Prevents:** Inconsistent authentication patterns and security vulnerabilities
- **Rule:** All protected API routes must validate authentication through middleware that sets `x-user-id` and `x-user-email` headers. Authorization logic must be implemented in the service layer, not in route handlers.

### AD-7 — Error Handling and Logging

- **Binds:** all
- **Prevents:** Inconsistent error handling and lack of observability
- **Rule:** All errors must be logged using the centralized logger (`@/lib/logger.ts`) with appropriate context. API routes must return consistent error response formats with proper HTTP status codes.

### AD-8 — Testing Strategy

- **Binds:** all
- **Prevents:** Inconsistent testing approaches and lack of test coverage
- **Rule:** All business logic must have unit tests using Vitest. API routes must have integration tests. Test files must be co-located with their implementation files in `__tests__` directories.

## Consistency Conventions

| Concern | Convention |
| --- | --- |
| Naming (entities, files, interfaces, events) | PascalCase for types/interfaces, camelCase for variables/functions, kebab-case for files/directories |
| Data & formats (ids, dates, error shapes, envelopes) | ISO 8601 for dates, UUID v4 for IDs, consistent error response format with `error` and `details` fields |
| State & cross-cutting (mutation, errors, logging, config, auth) | Immutable state updates, centralized logging, environment variables for configuration |
| Code organization | Feature-based grouping with clear separation between UI, business logic, and data access |

## Stack

| Name | Version |
| --- | --- |
| Next.js | 16.2.9 |
| React | 19.2.4 |
| TypeScript | 5.x |
| Supabase | 2.108.2 |
| LangChain | 0.1.37 |
| Winston | 3.19.0 |
| Vitest | 2.1.3 |
| Tailwind CSS | 4.3.1 |

## Structural Seed

```text
src/
  app/
    api/
      auth/          # Authentication routes
      chat/          # Chat functionality routes
      documents/     # Document management routes
      admin/         # Admin functionality routes
    (ui)            # Future UI components
  lib/
    api/            # API service layer
      auth/          # Auth services
      chat/          # Chat services
      documents/     # Document services
    rag/            # RAG pipeline components
      chunker.ts      # Text chunking logic
      embeddings.ts   # Embedding generation
      retriever.ts    # Information retrieval
      generator.ts    # Response generation
      formatter.ts    # Response formatting
      types.ts        # Shared types
      index.ts        # Main exports
    supabase/       # Supabase integration
      client.ts      # Supabase client
      storage/       # Storage-related functionality
        client.ts    # Storage client
        indexer.ts    # Document indexing
        ocr.ts        # OCR processing
        types.ts      # Storage types
    logger.ts       # Centralized logging
    utils/          # Utility functions
```

## Capability → Architecture Map

| Capability / Area | Lives in | Governed by |
| --- | --- |
| User Authentication | `@/lib/api/auth/service.ts`, `@/app/api/auth/*` | AD-6, Supabase Auth |
| Chat Messaging | `@/lib/api/chat/service.ts`, `@/app/api/chat/*` | AD-5, AD-7, RAG Pipeline |
| Document Management | `@/lib/api/documents/service.ts`, `@/app/api/documents/*` | AD-3, Supabase Storage |
| RAG Retrieval | `@/lib/rag/retriever.ts` | AD-5 |
| RAG Generation | `@/lib/rag/generator.ts` | AD-5 |
| RAG Formatting | `@/lib/rag/formatter.ts` | AD-5 |
| Error Handling | `@/lib/api/validator.ts`, `@/lib/logger.ts` | AD-7 |
| Data Access | `@/lib/supabase/client.ts` | AD-3 |

## Deferred

- **Deployment Strategy**: Containerization (Docker) and orchestration approach to be determined based on production requirements
- **Scaling Strategy**: Horizontal scaling and load balancing approach to be determined based on traffic patterns
- **Monitoring and Observability**: Comprehensive monitoring solution (Prometheus/Grafana or similar) to be implemented
- **CI/CD Pipeline**: Automated deployment pipeline configuration to be defined
- **Internationalization**: Multi-language support to be added when needed
- **Advanced Caching**: Redis or similar caching layer for performance optimization
- **WebSocket Implementation**: Real-time updates via WebSockets to be implemented for enhanced user experience