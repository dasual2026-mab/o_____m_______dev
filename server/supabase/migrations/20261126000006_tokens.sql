-- 06 토큰과 결제 (표 6개). 기술설계_3 3.7

-- 고친 시각을 적지 않는다. 발송할 때 이 줄을 잠가 같은 계정의 요청이 차례로 처리되게 한다.
create table core.wallets (
  account_id         uuid primary key references core.accounts (id) on delete cascade,
  balance            integer not null default 0 check (balance >= 0),
  nonuser_free_count integer not null default 0 check (nonuser_free_count between 0 and 5)
);

-- 결제한 때부터 5년 뒤 지운다. 탈퇴하면 계정 칸만 비운다.
create table core.purchases (
  id                      uuid primary key default gen_random_uuid(),
  receipt_no              text not null unique check (receipt_no like 'C-%'),
  account_id              uuid references core.accounts (id) on delete set null,
  store                   text not null check (store in ('apple', 'google')),
  store_tx_id             text not null,
  product                 text not null,
  price                   integer not null check (price >= 0),
  purchased_at            timestamptz not null,
  verified_at             timestamptz not null default now(),
  state                   text not null default 'verified' check (state in ('verified', 'refunded')),
  refunded_at             timestamptz,
  tokens                  integer not null check (tokens > 0),
  remaining_at_withdrawal integer check (remaining_at_withdrawal >= 0),
  -- 같은 결제로 토큰이 두 번 들어가지 않게 한다.
  unique (store, store_tx_id)
);
create index purchases_account_idx on core.purchases (account_id) where account_id is not null;
create index purchases_purchased_at_idx on core.purchases (purchased_at);

create table core.token_lots (
  id          uuid primary key default gen_random_uuid(),
  account_id  uuid not null references core.accounts (id) on delete cascade,
  kind        text not null check (kind in ('welcome', 'purchase', 'grant', 'correction', 'returned')),
  paid        boolean not null,
  purchase_id uuid references core.purchases (id) on delete set null,
  amount      integer not null check (amount > 0),
  remaining   integer not null check (remaining >= 0),
  created_at  timestamptz not null default now(),
  check (remaining <= amount)
);
create index token_lots_spend_idx on core.token_lots (account_id, paid, created_at) where remaining > 0;

-- 사용은 날, 방 종류, 토큰 묶음마다 한 줄에 합쳐 적는다.
-- 어느 방인지, 누구에게 보냈는지, 몇 시에 보냈는지 적지 않는다.
create table core.token_events (
  id         uuid primary key default gen_random_uuid(),
  account_id uuid not null references core.accounts (id) on delete cascade,
  day        date not null,
  type       text not null
             check (type in ('purchase', 'welcome', 'grant', 'returned', 'adjust', 'reclaim', 'use')),
  room_kind  text check (room_kind in ('received', 'sent')),
  lot_id     uuid not null references core.token_lots (id) on delete cascade,
  amount     integer not null check (amount > 0),
  ref_no     text,
  check ((type = 'use') = (room_kind is not null))
);
create unique index token_events_use_key on core.token_events (account_id, day, room_kind, lot_id)
  where type = 'use';
create index token_events_account_day_idx on core.token_events (account_id, day);

-- 결제에 딸린 것은 결제 기록과 함께 5년 둔다. 그 밖의 것은 탈퇴 처리가 지운다.
create table core.token_adjustments (
  id          uuid primary key default gen_random_uuid(),
  receipt_no  text not null unique check (receipt_no like 'G-%'),
  account_id  uuid references core.accounts (id) on delete set null,
  direction   text not null check (direction in ('grant', 'reclaim')),
  kind        text not null,
  lot_id      uuid references core.token_lots (id) on delete set null,
  amount      integer not null check (amount > 0),
  reason      text not null,
  memo        text,
  ref_no      text,
  operator_id uuid,
  at          timestamptz not null default now()
);
create index token_adjustments_account_idx on core.token_adjustments (account_id)
  where account_id is not null;

-- 이메일과 환불 계좌는 암호문으로 적는다. 환불이 끝난 때부터 5년 뒤 지운다.
create table core.refund_claims (
  id               uuid primary key default gen_random_uuid(),
  purchase_id      uuid references core.purchases (id) on delete set null,
  email_enc        bytea not null,
  bank_account_enc bytea not null,
  key_id           integer not null,
  tokens           integer not null check (tokens > 0),
  fee              integer not null default 0 check (fee >= 0),
  amount           integer not null check (amount >= 0),
  state            text not null default 'filed'
                   check (state in ('filed', 'processing', 'done', 'rejected')),
  filed_at         timestamptz not null default now(),
  closed_at        timestamptz
);
create index refund_claims_closed_at_idx on core.refund_claims (closed_at) where closed_at is not null;
