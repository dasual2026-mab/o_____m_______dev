-- 08 문의와 안내 (표 5개). 기술설계_3 3.8

create table core.inquiries (
  id           uuid primary key default gen_random_uuid(),
  receipt_no   text not null unique check (receipt_no like 'Q-%'),
  account_id   uuid references core.accounts (id) on delete set null,
  channel      text not null check (channel in ('app', 'email')),
  kind         text not null check (kind in ('inquiry', 'rights', 'email_report')),
  type         text not null,
  body         text not null,
  email_enc    bytea,
  email_key_id integer,
  app_version  text,
  device_info  text,
  state        text not null default 'open' check (state in ('open', 'answered', 'closed')),
  filed_at     timestamptz not null default now(),
  closed_at    timestamptz,
  purge_at     timestamptz,
  check ((email_enc is null) = (email_key_id is null))
);
create index inquiries_account_idx on core.inquiries (account_id, filed_at) where account_id is not null;
create index inquiries_purge_at_idx on core.inquiries (purge_at) where purge_at is not null;

create table core.inquiry_files (
  id         uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references core.inquiries (id) on delete cascade,
  file_path  text not null
);
create index inquiry_files_inquiry_idx on core.inquiry_files (inquiry_id);

create table core.inquiry_replies (
  id          uuid primary key default gen_random_uuid(),
  inquiry_id  uuid not null references core.inquiries (id) on delete cascade,
  body        text not null,
  sent_at     timestamptz not null default now(),
  via         text not null check (via in ('app', 'email', 'both')),
  operator_id uuid not null
);
create index inquiry_replies_inquiry_idx on core.inquiry_replies (inquiry_id);

-- '오엠' 공식 대화방은 따로 표를 두지 않는다.
-- 화면에서 빠지지 않은 안내가 하나라도 있으면 방이 있는 것이다.
create table core.official_notices (
  id         uuid primary key default gen_random_uuid(),
  account_id uuid not null references core.accounts (id) on delete cascade,
  kind       text not null,
  title      text not null,
  body       text not null,
  ref_no     text,
  reply_id   uuid references core.inquiry_replies (id) on delete set null,
  sent_at    timestamptz not null default now(),
  read_at    timestamptz,
  left_at    timestamptz
);
create index official_notices_account_idx on core.official_notices (account_id, sent_at);

-- 개인정보가 없다.
create table core.announcements (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  body           text not null,
  published_at   timestamptz not null default now(),
  unpublished_at timestamptz,
  operator_id    uuid not null
);
create index announcements_published_idx on core.announcements (published_at);
