-- 05 대화방과 메시지 (5), 6 · 9 사인 (3). 기술설계_3 3.3, 3.5

-- 방에는 보낸 사람을 가리키는 칸이 없다.
create table core.rooms (
  id                   uuid primary key default gen_random_uuid(),
  recipient_account_id uuid references core.accounts (id) on delete cascade,
  recipient_nonuser_id uuid references core.nonuser_numbers (id) on delete set null,
  detached             boolean not null default false,
  question_id          uuid references core.questions (id) on delete set null,
  question_body        text,
  question_written_at  timestamptz,
  question_revision    integer,
  face_id              uuid not null references core.faces (id),
  state                text not null default 'active' check (state in ('active', 'send_failed')),
  created_at           timestamptz not null default now(),
  last_message_at      timestamptz not null default now(),
  recipient_removed_at timestamptz,
  sender_removed_at    timestamptz,
  -- 받는 쪽은 계정이나 미사용자 번호 가운데 하나다. 받는 쪽 연결이 없는 방은 둘 다 비운다.
  -- 수신 거부 처리는 미사용자 번호 줄을 지우기 전에 detached를 먼저 켠다.
  check (
    (detached and recipient_account_id is null and recipient_nonuser_id is null)
    or (not detached and num_nonnulls(recipient_account_id, recipient_nonuser_id) = 1)
  )
);
create index rooms_recipient_account_idx on core.rooms (recipient_account_id, last_message_at)
  where recipient_account_id is not null;
create index rooms_recipient_nonuser_idx on core.rooms (recipient_nonuser_id)
  where recipient_nonuser_id is not null;

-- 보낸 사람의 신원 키 번호를 연결 암호화 키로 잠근 값. 방이 지워지면 함께 지워진다.
create table core.room_senders (
  room_id    uuid primary key references core.rooms (id) on delete cascade,
  sender_enc bytea not null,
  key_id     integer not null
);

-- 보낸 사람이 자기 보낸 방을 볼 때 서버가 이 목록을 풀어 방을 찾는다.
create table core.sent_rooms (
  id               uuid primary key default gen_random_uuid(),
  owner_account_id uuid not null references core.accounts (id) on delete cascade,
  room_enc         bytea not null,
  key_id           integer not null,
  recipient_key    bytea
);
create index sent_rooms_owner_idx on core.sent_rooms (owner_account_id);
create index sent_rooms_recipient_key_idx on core.sent_rooms (owner_account_id, recipient_key)
  where recipient_key is not null;

-- 보낸 사용자를 적지 않는다. 방 안에서 어느 쪽이 썼는지만 적는다.
create table core.messages (
  id                     uuid primary key default gen_random_uuid(),
  room_id                uuid not null references core.rooms (id) on delete cascade,
  from_sender            boolean not null,
  body_enc               bytea not null,
  key_id                 integer not null,
  sent_at                timestamptz not null default now(),
  read_at                timestamptz,
  expires_at             timestamptz not null,
  delivery               text not null default 'delivered'
                         check (delivery in ('delivered', 'blocked', 'protected', 'no_recipient')),
  counterpart_removed_at timestamptz,
  spend_enc              bytea not null,
  spend_key_id           integer not null
);
create index messages_room_sent_idx on core.messages (room_id, sent_at);
create index messages_expires_at_idx on core.messages (expires_at);

-- 본문을 적지 않는다. 보낸 때부터 3개월 뒤 지운다.
create table core.send_logs (
  id                    uuid primary key default gen_random_uuid(),
  sent_at               timestamptz not null default now(),
  read_at               timestamptz,
  sender_enc            bytea not null,
  sender_key_id         integer not null,
  sender_key            bytea not null,
  recipient_identity_id uuid references core.identity_keys (id) on delete set null,
  recipient_phone_hash  bytea
);
create index send_logs_sent_at_idx on core.send_logs (sent_at);
create index send_logs_sender_key_idx on core.send_logs (sender_key, sent_at);

-- 6 · 9 사인 -------------------------------------------------------------
-- 보낸 사람을 가리키는 칸도, 시각도 없다.
-- 한 사람이 한 사람에게 하나만 보내는 규칙은 가명 값이 겹칠 수 없게 하여 지킨다.
create table core.sign_sends (
  pair_key             bytea primary key,
  recipient_account_id uuid not null references core.accounts (id) on delete cascade,
  applied              integer check (applied in (6, 9)),
  pending              integer check (pending in (6, 9)),
  check (applied is not null or pending is not null)
);
create index sign_sends_pending_idx on core.sign_sends (recipient_account_id) where pending is not null;

-- 앱이 읽는 것은 이 표뿐이다.
create table core.sign_counts (
  account_id uuid primary key references core.accounts (id) on delete cascade,
  six        integer not null default 0 check (six >= 0),
  nine       integer not null default 0 check (nine >= 0),
  changed_on date
);

-- 반영 날짜가 겹칠 수 없게 하여 같은 날 두 번 반영되지 않게 한다.
create table core.sign_batches (
  day          date primary key,
  started_at   timestamptz not null default now(),
  finished_at  timestamptz,
  state        text not null default 'running' check (state in ('running', 'done', 'failed')),
  applied_rows integer not null default 0 check (applied_rows >= 0)
);
