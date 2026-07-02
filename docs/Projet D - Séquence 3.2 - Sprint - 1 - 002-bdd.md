## Table `profiles`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` |  |
| `email` | `text` |  |
| `full_name` | `text` |  Nullable |
| `role` | `text` |  |
| `avatar_url` | `text` |  Nullable |
| `preferences` | `jsonb` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |

## Table `documents`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `name` | `text` |  |
| `type` | `text` |  |
| `source` | `text` |  |
| `client_id` | `text` |  Nullable |
| `file_path` | `text` |  Nullable |
| `file_size` | `int8` |  Nullable |
| `language` | `text` |  Nullable |
| `mime_type` | `text` |  Nullable |
| `checksum` | `text` |  Nullable |
| `processed_at` | `timestamptz` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |

## Table `chunks`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `document_id` | `uuid` |  |
| `content` | `text` |  |
| `chunk_index` | `int4` |  |
| `token_count` | `int4` |  |
| `hash` | `text` |  Nullable |
| `metadata` | `jsonb` |  |
| `created_at` | `timestamptz` |  Nullable |

## Table `embeddings`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `chunk_id` | `uuid` |  |
| `vector` | `vector` |  |
| `created_at` | `timestamptz` |  Nullable |

## Table `conversations`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` |  |
| `title` | `text` |  Nullable |
| `description` | `text` |  Nullable |
| `is_archived` | `bool` |  Nullable |
| `client_id` | `text` |  Nullable |
| `metadata` | `jsonb` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |

## Table `messages`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `conversation_id` | `uuid` |  |
| `content` | `text` |  |
| `role` | `text` |  |
| `token_count` | `int4` |  Nullable |
| `sources` | `jsonb` |  Nullable |
| `metadata` | `jsonb` |  |
| `created_at` | `timestamptz` |  Nullable |

## Table `sync_logs`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `source` | `text` |  |
| `last_sync_at` | `timestamptz` |  Nullable |
| `documents_processed` | `int4` |  Nullable |
| `chunks_created` | `int4` |  Nullable |
| `embeddings_created` | `int4` |  Nullable |
| `documents_deleted` | `int4` |  Nullable |
| `status` | `text` |  Nullable |
| `error_message` | `text` |  Nullable |
| `metadata` | `jsonb` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

