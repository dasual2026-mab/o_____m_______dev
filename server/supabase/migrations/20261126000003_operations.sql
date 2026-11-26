-- 03 운영 (표 10개). 기술설계_3 3.9
-- audit_logs, operator_grants, stats_daily는 설계 문서의 칸 그대로다.
-- 그 밖의 일곱 표는 담는 것만 정해져 있어 가장 적은 칸으로 만들었다.
-- 칸의 세부는 관리자 콘솔을 만들 때 관리자 기획서 3장을 따라 더한다.

-- 운영자 로그인은 Supabase의 로그인 기능을 쓴다. auth_user_id가 그 계정 번호다.
create table core.operators (
  id           uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique,
  grade        text not null,
  state        text not null default 'invited'
               check (state in ('invited', 'active', 'suspended', 'removed')),
  created_at   timestamptz not null default now()
);

create table core.operator_devices (
  id            uuid primary key default gen_random_uuid(),
  operator_id   uuid not null references core.operators (id) on delete cascade,
  label         text not null,
  registered_at timestamptz not null default now(),
  revoked_at    timestamptz
);
create index operator_devices_operator_idx on core.operator_devices (operator_id);

create table core.approval_requests (
  id           uuid primary key default gen_random_uuid(),
  receipt_no   text not null unique check (receipt_no like 'S-%'),
  kind         text not null,
  state        text not null default 'requested'
               check (state in ('requested', 'approved', 'rejected', 'expired')),
  reason       text not null,
  requested_by uuid not null,
  decided_by   uuid,
  created_at   timestamptz not null default now(),
  decided_at   timestamptz
);

create table core.policy_values (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

create table core.policy_value_changes (
  id          uuid primary key default gen_random_uuid(),
  receipt_no  text not null unique check (receipt_no like 'V-%'),
  key         text not null,
  before      jsonb,
  after       jsonb,
  reason      text not null,
  operator_id uuid not null,
  at          timestamptz not null default now()
);

-- 권리침해 신청인의 이름과 연락처는 암호문으로 적고 처리를 끝낸 때부터 3년 뒤 지운다.
create table core.legal_requests (
  id            uuid primary key default gen_random_uuid(),
  receipt_no    text not null unique check (receipt_no like 'L-%'),
  kind          text not null check (kind in ('rights_infringement', 'investigation', 'preservation')),
  state         text not null default 'open' check (state in ('open', 'closed')),
  requester_enc bytea,
  key_id        integer,
  filed_at      timestamptz not null default now(),
  closed_at     timestamptz,
  purge_at      timestamptz,
  check ((requester_enc is null) = (key_id is null))
);
create index legal_requests_purge_at_idx on core.legal_requests (purge_at) where purge_at is not null;

create table core.evidence_bundles (
  id               uuid primary key default gen_random_uuid(),
  receipt_no       text not null unique check (receipt_no like 'B-%'),
  legal_request_id uuid references core.legal_requests (id) on delete set null,
  operator_id      uuid not null,
  created_at       timestamptz not null default now()
);

create table core.stats_daily (
  day    date not null,
  metric text not null,
  bucket text not null default '',
  value  bigint not null default 0,
  primary key (day, metric, bucket)
);

-- 운영자 처리 기록. 넣기만 할 수 있다. 줄마다 바로 앞 줄의 확인값을 품는다.
create table audit.audit_logs (
  seq         bigint generated always as identity primary key,
  at          timestamptz not null default now(),
  operator_id uuid not null,
  device      text not null,
  network     text not null,
  action      text not null,
  target_code text,
  target_no   text,
  reason      text,
  memo        text,
  change      jsonb,
  prev_hash   bytea not null,
  row_hash    bytea not null
);
create index audit_logs_at_idx on audit.audit_logs (at);

-- 운영자 권한을 부여, 변경, 말소한 내역. 3년 둔다.
create table audit.operator_grants (
  seq         bigint generated always as identity primary key,
  at          timestamptz not null default now(),
  operator_id uuid not null,
  action      text not null check (action in ('grant', 'change', 'revoke')),
  scope       text not null check (scope in ('console', 'database', 'external')),
  before      text,
  after       text,
  granted_by  uuid not null,
  reason      text not null,
  prev_hash   bytea not null,
  row_hash    bytea not null
);
create index operator_grants_at_idx on audit.operator_grants (at);

-- 두 기록 표는 어느 역할도 고치거나 비울 수 없다. 권한으로 막고 한 번 더 막는다.
create function audit.forbid_change()
returns trigger
language plpgsql
as $$
begin
  raise exception '운영 기록은 고칠 수 없습니다: %.%', tg_table_schema, tg_table_name
    using errcode = 'insufficient_privilege';
end $$;

create trigger audit_logs_no_update before update on audit.audit_logs
  for each row execute function audit.forbid_change();
create trigger audit_logs_no_truncate before truncate on audit.audit_logs
  for each statement execute function audit.forbid_change();
create trigger operator_grants_no_update before update on audit.operator_grants
  for each row execute function audit.forbid_change();
create trigger operator_grants_no_truncate before truncate on audit.operator_grants
  for each statement execute function audit.forbid_change();
