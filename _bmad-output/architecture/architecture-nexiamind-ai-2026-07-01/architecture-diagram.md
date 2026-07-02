# NexiaMind AI Architecture Diagram

```mermaid
graph TD
    A[User Interface] -->|HTTP Requests| B[Next.js API Routes]
    B -->|Business Logic| C[Service Layer]
    C -->|Data Access| D[Supabase Client]
    D -->|CRUD Operations| E[Supabase Database]
    
    C -->|RAG Processing| F[RAG Pipeline]
    F -->|Retrieval| G[Retriever]
    F -->|Generation| H[Generator]
    F -->|Formatting| I[Formatter]
    
    E -->|Document Storage| J[Supabase Storage]
    J -->|OCR Processing| K[OCR Service]
    J -->|Indexing| L[Indexer Service]
    
    M[Authentication Middleware] -->|User Context| B
    N[Logger] -->|Error Logging| B
    N -->|Error Logging| C
    N -->|Error Logging| F
    
    style A fill:#4CAF50,stroke:#388E3C
    style B fill:#2196F3,stroke:#1976D2
    style C fill:#FF9800,stroke:#F57C00
    style D fill:#9C27B0,stroke:#7B1FA2
    style E fill:#607D8B,stroke:#455A64
    style F fill:#00BCD4,stroke:#0097A7
    style G fill:#8BC34A,stroke:#689F38
    style H fill:#FF5722,stroke:#E64A19
    style I fill:#795548,stroke:#5D4037
    style J fill:#CDDC39,stroke:#AFB42B
    style K fill:#607D8B,stroke:#455A64
    style L fill:#9E9E9E,stroke:#616161
    style M fill:#E91E63,stroke:#C2185B
    style N fill:#FFEB3B,stroke:#FBC02D
```

## Layered Architecture Overview

1. **Presentation Layer**: Next.js UI components and API routes
2. **Application Layer**: Business logic and service orchestration
3. **Domain Layer**: Core business rules and entities
4. **Infrastructure Layer**: External services (Supabase, RAG components)

## Data Flow

1. User interacts with UI → Next.js API routes
2. API routes validate auth → call service layer
3. Service layer orchestrates business logic → calls Supabase or RAG pipeline
4. RAG pipeline processes documents → generates responses
5. Responses returned through the same chain with proper formatting

## Key Integration Points

- **Authentication**: Middleware injects user context into all requests
- **RAG Pipeline**: Composable components for retrieval, generation, formatting
- **Data Access**: Centralized Supabase client with service layer abstraction
- **Error Handling**: Centralized logging across all layers