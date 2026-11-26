-- 04 익명 얼굴 (2), 미사용자 (4), 질문과 설문 (3). 기술설계_3 3.10, 3.2, 3.4

-- 익명 얼굴 ---------------------------------------------------------------
create table core.faces (
  id             uuid primary key default gen_random_uuid(),
  file_path      text not null unique,
  tags           jsonb not null default '[]'::jsonb,
  state          text not null default 'pending_review'
                 check (state in ('active', 'removed', 'pending_review', 'rejected')),
  added_at       timestamptz not null default now(),
  removed_reason text
);
create index faces_active_idx on core.faces (id) where state = 'active';

create table core.face_jobs (
  id              uuid primary key default gen_random_uuid(),
  requested_count integer not null check (requested_count > 0),
  method          text not null,
  state           text not null default 'requested'
                  check (state in ('requested', 'running', 'done', 'failed')),
  operator_id     uuid,
  requested_at    timestamptz not null default now()
);

-- 미사용자 ----------------------------------------------------------------
-- 미사용자의 이름은 적지 않는다.
create table core.nonuser_numbers (
  id            uuid primary key default gen_random_uuid(),
  phone_hash    bytea not null unique,
  phone_enc     bytea not null,
  phone_key_id  integer not null,
  first_sent_at timestamptz not null default now(),
  sms_state     text not null default 'pending'
                check (sms_state in ('pending', 'sent', 'invalid', 'skipped')),
  sms_after     timestamptz
);
create index nonuser_numbers_sms_idx on core.nonuser_numbers (sms_after) where sms_state = 'pending';

-- 번호마다 한 번만 보내는 규칙을 이 표로 지킨다.
create table core.sms_notices (
  phone_key   bytea primary key,
  notified_at timestamptz not null default now(),
  method      text not null default 'sms' check (method in ('sms')),
  result      text not null check (result in ('sent', 'invalid'))
);

create table core.sms_optouts (
  phone_key    bytea primary key,
  opted_out_at timestamptz not null default now()
);

create table core.optout_checks (
  phone_key   bytea primary key,
  code_hash   bytea not null,
  expires_at  timestamptz not null,
  wrong_count integer not null default 0 check (wrong_count >= 0)
);
create index optout_checks_expires_at_idx on core.optout_checks (expires_at);

-- 질문과 설문 -------------------------------------------------------------
-- 질문 번호는 적지 않는다. 지금 보이는 질문을 쓴 차례로 세어 만든다.
create table core.questions (
  id               uuid primary key default gen_random_uuid(),
  owner_account_id uuid not null references core.accounts (id) on delete cascade,
  kind             text not null check (kind in ('question', 'survey')),
  body             text not null,
  written_at       timestamptz not null default now(),
  changed_at       timestamptz not null default now(),
  revision         integer not null default 1 check (revision >= 1),
  owner_hidden     boolean not null default false,
  mod_hidden_at    timestamptz,
  show_count       boolean not null default false,
  allow_multi      boolean not null default false,
  participants     integer not null default 0 check (participants >= 0)
);
create index questions_owner_idx on core.questions (owner_account_id, written_at);

create table core.survey_options (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references core.questions (id) on delete cascade,
  position    integer not null check (position >= 1),
  body        text not null,
  votes       integer not null default 0 check (votes >= 0),
  unique (question_id, position)
);

-- 계정 번호를 그대로 적지 않는다. 같은 사람인지만 가명 값으로 맞춰 본다.
create table core.survey_votes (
  question_id uuid not null references core.questions (id) on delete cascade,
  option_id   uuid not null references core.survey_options (id) on delete cascade,
  voter_key   bytea not null,
  primary key (question_id, option_id, voter_key)
);
create index survey_votes_voter_key_idx on core.survey_votes (voter_key);
