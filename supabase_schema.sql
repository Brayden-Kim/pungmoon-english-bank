create table if not exists public.submissions (
  id text primary key,
  exam_title text not null,
  mode text not null,
  student_name text not null,
  student_key text not null,
  submitted_at timestamptz not null,
  total_score integer not null,
  correct_count integer not null,
  total_questions integer not null,
  question_results jsonb not null default '[]'::jsonb
);

alter table public.submissions
  alter column id type text using id::text;

alter table public.submissions
  add column if not exists exam_set_id text;

alter table public.submissions
  alter column exam_set_id drop not null;

create table if not exists public.student_progress (
  student_key text primary key,
  student_name text not null,
  incorrect_questions jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.submissions
  add column if not exists student_key text;

alter table public.submissions
  add column if not exists exam_title text not null default '',
  add column if not exists mode text not null default 'random_shuffle',
  add column if not exists student_name text not null default '',
  add column if not exists submitted_at timestamptz not null default now(),
  add column if not exists total_score integer not null default 0,
  add column if not exists correct_count integer not null default 0,
  add column if not exists total_questions integer not null default 0,
  add column if not exists question_results jsonb not null default '[]'::jsonb;

alter table public.student_progress
  add column if not exists student_key text,
  add column if not exists student_name text not null default '',
  add column if not exists incorrect_questions jsonb not null default '[]'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

update public.submissions
set student_key = regexp_replace(lower(trim(coalesce(student_name, ''))), '\s+', '', 'g')
where student_key is null or btrim(student_key) = '';

alter table public.submissions
  alter column student_key set not null;

create index if not exists submissions_student_key_idx
  on public.submissions (student_key);
create index if not exists submissions_submitted_at_idx
  on public.submissions (submitted_at desc);

alter table public.submissions enable row level security;
alter table public.student_progress enable row level security;

drop policy if exists "Allow public submission access" on public.submissions;
create policy "Allow public submission access"
  on public.submissions
  for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "Allow public progress access" on public.student_progress;
create policy "Allow public progress access"
  on public.student_progress
  for all
  to anon, authenticated
  using (true)
  with check (true);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'submissions'
  ) then
    alter publication supabase_realtime add table public.submissions;
  end if;
end $$;
