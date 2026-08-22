create extension if not exists vector;

create table if not exists public.knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  storage_path text not null unique,
  mime_type text not null,
  file_size bigint not null default 0 check (file_size >= 0),
  source_type text not null default 'upload' check (source_type in ('upload')),
  status text not null default 'processing' check (status in ('processing', 'ready', 'failed')),
  error_message text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.knowledge_documents(id) on delete cascade,
  chunk_index integer not null check (chunk_index >= 0),
  content text not null check (char_length(content) between 1 and 12000),
  token_count integer not null default 0 check (token_count >= 0),
  metadata jsonb not null default '{}'::jsonb,
  embedding vector(1536) not null,
  created_at timestamptz not null default now(),
  unique (document_id, chunk_index)
);

create index if not exists knowledge_documents_status_created_at_idx
  on public.knowledge_documents(status, created_at desc);

create index if not exists knowledge_chunks_document_id_chunk_index_idx
  on public.knowledge_chunks(document_id, chunk_index asc);

create index if not exists knowledge_chunks_embedding_idx
  on public.knowledge_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

alter table public.knowledge_documents enable row level security;
alter table public.knowledge_chunks enable row level security;

drop trigger if exists knowledge_documents_set_updated_at on public.knowledge_documents;
create trigger knowledge_documents_set_updated_at
  before update on public.knowledge_documents
  for each row execute procedure public.set_row_updated_at();

create or replace function public.match_knowledge_chunks(
  p_query_embedding vector(1536),
  p_match_count integer default 6
)
returns table (
  document_id uuid,
  chunk_id uuid,
  title text,
  content text,
  similarity double precision
)
language sql
security definer
set search_path = public
as $$
  select
    d.id as document_id,
    c.id as chunk_id,
    d.title,
    c.content,
    1 - (c.embedding <=> p_query_embedding) as similarity
  from public.knowledge_chunks c
  inner join public.knowledge_documents d
    on d.id = c.document_id
  where d.status = 'ready'
  order by c.embedding <=> p_query_embedding
  limit greatest(p_match_count, 1);
$$;

revoke all on function public.match_knowledge_chunks(vector, integer) from public;
revoke all on function public.match_knowledge_chunks(vector, integer) from anon;
revoke all on function public.match_knowledge_chunks(vector, integer) from authenticated;
grant execute on function public.match_knowledge_chunks(vector, integer) to service_role;

insert into storage.buckets (id, name, public)
values ('knowledge-base', 'knowledge-base', false)
on conflict (id) do nothing;
