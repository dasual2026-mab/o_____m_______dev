-- 02 계정과 기기 (표 9개). 기술설계_3 3.1

create table core.identity_keys (
  id              uuid primary key default gen_random_uuid(),
  ci_hash         bytea not null unique,
  consent_version text not null,
  consented_at    timestamptz not null,
  withdrawn_at    timestamptz,
  purge_at        timestamptz
);
create index identity_keys_purge_at_idx on core.identity_keys (purge_at) where purge_at is not null;

create table core.accounts (
  id                uuid primary key default gen_random_uuid(),
  identity_id       uuid not null unique references core.identity_keys (id),
  admin_code        text not null unique,
  real_name         text not null,
  phone_hash        bytea,
  phone_enc         bytea,
  phone_key_id      integer,
  state             text not null default 'active' check (state in ('active', 'locked')),
  lock_reason       text check (lock_reason in ('reassigned', 'number_conflict')),
  locked_at         timestamptz,
  purge_at          timestamptz,
  reauth_required   boolean not null default false,
  started_at        timestamptz not null default now(),
  last_active_on    date not null default core.kst_today(),
  photo_path        text,
  restriction       text not null default 'none'
                    check (restriction in ('none', 'interim', 'h69', 'd69', 'permanent')),
  restriction_until timestamptz,
  ai_optout         boolean not null default false,
  check ((phone_enc is null) = (phone_key_id is null)),
  check ((state = 'locked') = (lock_reason is not null))
);
-- 번호 변환값은 번호가 있는 계정끼리 겹칠 수 없다.
create unique index accounts_phone_hash_key on core.accounts (phone_hash) where phone_hash is not null;
create index accounts_purge_at_idx on core.accounts (purge_at) where purge_at is not null;

create table core.device_links (
  id                uuid primary key default gen_random_uuid(),
  account_id        uuid not null references core.accounts (id) on delete cascade,
  state             text not null default 'linked' check (state in ('linked', 'revoked')),
  token_hash        bytea,
  refresh_hash      bytea,
  prev_refresh_hash bytea,
  platform          text not null check (platform in ('ios', 'android')),
  os_version        text,
  device_model      text,
  app_version       text,
  push_token        text,
  notify_prefs      jsonb,
  linked_at         timestamptz not null default now(),
  last_seen_on      date,
  revoked_at        timestamptz,
  revoke_reason     text check (revoke_reason in ('other_device', 'self', 'reauth', 'reassigned')),
  revoke_seen       boolean not null default false,
  -- 연결된 줄은 값이 모두 있어야 한다. 해제하면 인증값과 기기 정보를 비운다.
  check (
    (state = 'linked' and token_hash is not null and os_version is not null and device_model is not null
      and app_version is not null and notify_prefs is not null and last_seen_on is not null
      and revoked_at is null and revoke_reason is null)
    or
    (state = 'revoked' and token_hash is null and refresh_hash is null and prev_refresh_hash is null
      and push_token is null and notify_prefs is null
      and revoked_at is not null and revoke_reason is not null)
  )
);
-- 계정마다 연결됨 상태의 행은 하나다.
create unique index device_links_one_linked_key on core.device_links (account_id) where state = 'linked';
create index device_links_revoked_at_idx on core.device_links (revoked_at) where state = 'revoked';

create table core.consents (
  id           uuid primary key default gen_random_uuid(),
  account_id   uuid not null references core.accounts (id) on delete cascade,
  item         text not null,
  doc_version  text not null,
  agreed_at    timestamptz not null default now(),
  withdrawn_at timestamptz
);
create index consents_account_idx on core.consents (account_id);

create table core.verification_sessions (
  id           uuid primary key default gen_random_uuid(),
  purpose      text not null check (purpose in ('start', 'reauth', 'change_number', 'change_name')),
  provider_ref text not null,
  state        text not null default 'pending' check (state in ('pending', 'done', 'failed')),
  created_at   timestamptz not null default now()
);
create index verification_sessions_created_at_idx on core.verification_sessions (created_at);

create table core.access_logs (
  id          uuid primary key default gen_random_uuid(),
  identity_id uuid not null references core.identity_keys (id) on delete cascade,
  ip          text not null,
  at          timestamptz not null default now(),
  event       text not null check (event in ('link', 'refresh', 'reauth'))
);
create index access_logs_at_idx on core.access_logs (at);

create table core.abuse_counters (
  account_id     uuid not null references core.accounts (id) on delete cascade,
  kind           text not null check (kind in ('nonuser_send', 'contacts_match')),
  day            date not null,
  count          integer not null default 0 check (count >= 0),
  distinct_count integer not null default 0 check (distinct_count >= 0),
  primary key (account_id, kind, day)
);
create index abuse_counters_day_idx on core.abuse_counters (day);

-- 대상 값은 해시로만 적는다. IP 주소도 같다.
create table core.rate_limits (
  key_hash     bytea not null,
  window_start timestamptz not null,
  count        integer not null default 0 check (count >= 0),
  primary key (key_hash, window_start)
);
create index rate_limits_window_start_idx on core.rate_limits (window_start);

-- 계정 번호를 적지 않는다.
create table core.idempotency_keys (
  key_hash   bytea primary key,
  created_at timestamptz not null default now()
);
create index idempotency_keys_created_at_idx on core.idempotency_keys (created_at);
