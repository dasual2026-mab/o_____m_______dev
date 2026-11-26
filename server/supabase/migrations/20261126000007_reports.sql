-- 07 신고와 차단과 제재 (표 8개). 기술설계_3 3.6
-- 운영자를 가리키는 칸(decided_by 등)은 운영자 표에 묶지 않는다.
-- 운영자를 지우는 방식은 관리자 콘솔을 만들 때 정한다.

create table core.reports (
  id                  uuid primary key default gen_random_uuid(),
  receipt_no          text not null unique check (receipt_no like 'R-%'),
  reporter_account_id uuid references core.accounts (id) on delete set null,
  target_kind         text not null check (target_kind in ('message', 'room', 'question', 'photo')),
  -- 대상 방과 메시지와 질문이 지워져도 번호는 그대로 둔다. 그래서 묶지 않는다.
  room_id             uuid,
  message_id          uuid,
  question_id         uuid,
  target_enc          bytea not null,
  target_key_id       integer not null,
  target_key          bytea not null,
  reason              text not null,
  priority            boolean not null default false,
  protect             boolean not null default false,
  protect_spend_enc   bytea,
  state               text not null default 'reviewing' check (state in ('reviewing', 'reviewed', 'held')),
  decision            text check (decision in ('upheld', 'dismissed', 'false_report')),
  violations          jsonb,
  decision_note       text,
  decided_by          uuid,
  approved_by         uuid,
  decided_at          timestamptz,
  reported_at         timestamptz not null default now(),
  box_until           timestamptz not null,
  keep_until          timestamptz not null,
  released_at         timestamptz,
  evidence_hash       bytea not null,
  ai_reason           text,
  ai_score            integer check (ai_score between 0 and 100),
  ai_at               timestamptz
);
create index reports_reporter_idx on core.reports (reporter_account_id, reported_at)
  where reporter_account_id is not null;
create index reports_target_key_idx on core.reports (target_key);
create index reports_queue_idx on core.reports (state, priority, reported_at);
create index reports_ai_pending_idx on core.reports (reported_at) where ai_at is null;
create index reports_keep_until_idx on core.reports (keep_until);

-- 차단한 사람과 차단된 사람의 짝을 계정 번호 그대로 적지 않는다.
create table core.blocks (
  id                 uuid primary key default gen_random_uuid(),
  blocker_account_id uuid not null references core.accounts (id) on delete cascade,
  kind               text not null check (kind in ('message', 'room', 'from_report', 'question_author')),
  target_key         bytea not null,
  target_enc         bytea not null,
  target_key_id      integer not null,
  counted            boolean not null default true,
  immediate          boolean not null default false,
  report_id          uuid references core.reports (id) on delete set null,
  blocked_at         timestamptz not null default now(),
  box_until          timestamptz
);
create index blocks_blocker_idx on core.blocks (blocker_account_id, target_key);
create index blocks_target_key_idx on core.blocks (target_key);

create table core.archives (
  id          uuid primary key default gen_random_uuid(),
  report_id   uuid references core.reports (id) on delete cascade,
  block_id    uuid references core.blocks (id) on delete cascade,
  captured_at timestamptz not null default now(),
  keep_until  timestamptz not null,
  legal_hold  boolean not null default false,
  check (num_nonnulls(report_id, block_id) = 1)
);
create index archives_report_idx on core.archives (report_id) where report_id is not null;
create index archives_block_idx on core.archives (block_id) where block_id is not null;
create index archives_keep_until_idx on core.archives (keep_until);

-- 메시지와 다른 키(보관용 암호화 키)로 잠근다.
create table core.archive_items (
  id         uuid primary key default gen_random_uuid(),
  archive_id uuid not null references core.archives (id) on delete cascade,
  position   integer not null check (position >= 1),
  role       text not null check (role in ('target', 'context', 'protected')),
  kind       text not null check (kind in ('message', 'question', 'photo')),
  body_enc   bytea,
  file_path  text,
  written_at timestamptz not null,
  key_id     integer not null,
  unique (archive_id, position),
  check (num_nonnulls(body_enc, file_path) = 1)
);

-- 신고된 내용을 옮겨 적지 않는다.
create table core.sanctions (
  id             uuid primary key default gen_random_uuid(),
  account_id     uuid not null references core.accounts (id) on delete cascade,
  kind           text not null
                 check (kind in ('hide_only', 'warning', 'suspend_69h', 'suspend_69d', 'permanent',
                                 'photo_removed', 'terminated')),
  step           integer check (step >= 1),
  violation_type text not null,
  clause         text not null,
  target_kind    text not null,
  report_id      uuid references core.reports (id) on delete set null,
  state          text not null check (state in ('pending', 'active', 'ended', 'cancelled')),
  notified_at    timestamptz,
  starts_at      timestamptz,
  ends_at        timestamptz,
  resets_on      date,
  decision_note  text,
  decided_by     uuid not null,
  approved_by    uuid,
  carried        boolean not null default false,
  opinion        text,
  opinion_due_at timestamptz,
  interim_hold   boolean not null default false
);
create index sanctions_account_idx on core.sanctions (account_id, state);
create index sanctions_ends_at_idx on core.sanctions (ends_at) where state = 'active';

create table core.appeals (
  id          uuid primary key default gen_random_uuid(),
  receipt_no  text not null unique check (receipt_no like 'P-%'),
  sanction_id uuid not null references core.sanctions (id) on delete cascade,
  reason      text not null,
  filed_at    timestamptz not null default now(),
  state       text not null default 'filed' check (state in ('filed', 'reviewing', 'decided')),
  result      text check (result in ('upheld', 'dismissed')),
  reviewed_by uuid,
  notified_at timestamptz
);
create index appeals_sanction_idx on core.appeals (sanction_id);

-- 탈퇴한 뒤에도 이어 갈 처분. 신고된 내용, 받는 사람, 신고한 사람은 적지 않는다.
create table core.carried_sanctions (
  id               uuid primary key default gen_random_uuid(),
  identity_id      uuid not null references core.identity_keys (id) on delete cascade,
  kind             text not null,
  violation_type   text not null,
  clause           text not null,
  target_kind      text not null,
  notified_on      date,
  ends_on          date,
  resets_on        date,
  decision_note    text,
  decided_at       timestamptz,
  appeal_result    text,
  after_withdrawal boolean not null default false
);
create index carried_sanctions_identity_idx on core.carried_sanctions (identity_id);
create index carried_sanctions_resets_on_idx on core.carried_sanctions (resets_on) where resets_on is not null;

-- 숫자만 적는다. 번호나 상대는 적지 않는다.
create table core.detections (
  id         uuid primary key default gen_random_uuid(),
  receipt_no text not null unique check (receipt_no like 'A-%'),
  account_id uuid not null references core.accounts (id) on delete cascade,
  kind       text not null,
  value      integer not null,
  state      text not null default 'open' check (state in ('open', 'handled', 'dismissed')),
  handled_by uuid,
  created_at timestamptz not null default now()
);
create index detections_queue_idx on core.detections (state, created_at);
