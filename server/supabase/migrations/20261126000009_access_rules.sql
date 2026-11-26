-- 09 표마다의 접근 규칙. 기술설계_3 2.1과 7장
-- 1. 모든 표에 행 단위 보안을 켜고 허용 규칙은 하나도 두지 않는다.
-- 2. 앱의 공개 키 역할에는 어떤 권한도 주지 않는다.
-- 3. 서버의 접속 역할 셋에 7장의 표대로만 권한을 준다. 적히지 않은 일은 할 수 없다.
--
-- 새 표를 더하는 변경 파일은 그 파일 안에서 행 단위 보안을 켜고 권한을 준다.
-- 켜지 않은 표가 있으면 server/test의 검사가 실패한다.

-- 1. 행 단위 보안 --------------------------------------------------------
do $$
declare t record;
begin
  for t in select schemaname, tablename from pg_tables where schemaname in ('core', 'audit') loop
    execute format('alter table %I.%I enable row level security', t.schemaname, t.tablename);
  end loop;
end $$;

-- 2. 앱의 공개 키 역할 ---------------------------------------------------
-- anon, authenticated, service_role은 Supabase가 만든 역할이다. 있을 때만 거둔다.
do $$
declare r text;
begin
  foreach r in array array['anon', 'authenticated', 'service_role'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      execute format('revoke all on schema core, audit from %I', r);
      execute format('revoke all on all tables in schema core, audit from %I', r);
      execute format('revoke all on all sequences in schema core, audit from %I', r);
      execute format('revoke all on all functions in schema core, audit from %I', r);
    end if;
  end loop;
end $$;
revoke all on all tables in schema core, audit from public;
revoke all on all functions in schema core, audit from public;

-- 3. 서버의 접속 역할 ----------------------------------------------------
grant usage on schema core to svc_app, svc_admin, svc_jobs;
grant usage on schema audit to svc_admin, svc_jobs;
grant execute on function core.new_receipt_no(text) to svc_app, svc_admin;
grant execute on function core.kst_today() to svc_app, svc_admin, svc_jobs;

-- 예약 작업의 '지우기'는 기간이 지난 줄을 골라 지운다. 고르려면 읽어야 한다.
-- 그래서 내용이 든 칸을 뺀 나머지 칸만 읽게 한다.
create function core._grant_sweep(tbl regclass)
returns void
language plpgsql
as $$
declare cols text;
begin
  select string_agg(quote_ident(attname), ', ')
    into cols
    from pg_attribute
   where attrelid = tbl and attnum > 0 and not attisdropped
     and attname !~ '(_enc$|^body$|^question_body$|^real_name$|^ip$|^push_token$|^opinion$|^decision_note$|^memo$|^reason$)';
  execute format('grant select (%s) on %s to svc_jobs', cols, tbl);
  execute format('grant delete on %s to svc_jobs', tbl);
end $$;

-- 계정과 기기
grant select, insert, update, delete on core.identity_keys to svc_app;
grant select on core.identity_keys to svc_admin;
select core._grant_sweep('core.identity_keys');

grant select, insert, update, delete on core.accounts to svc_app;
grant select on core.accounts to svc_admin;
grant update (restriction, restriction_until, ai_optout) on core.accounts to svc_admin;
select core._grant_sweep('core.accounts');

grant select, insert, update, delete on core.device_links to svc_app;
select core._grant_sweep('core.device_links');

grant select, insert, update, delete on core.consents to svc_app;
grant select on core.consents to svc_admin;

grant select, insert, update, delete on core.verification_sessions to svc_app;
select core._grant_sweep('core.verification_sessions');

grant insert on core.access_logs to svc_app;
grant select on core.access_logs to svc_admin;
select core._grant_sweep('core.access_logs');

grant select, insert, update, delete on core.abuse_counters to svc_app;
grant select on core.abuse_counters to svc_admin;
select core._grant_sweep('core.abuse_counters');

grant select, insert, update, delete on core.rate_limits, core.idempotency_keys to svc_app;
select core._grant_sweep('core.rate_limits');
select core._grant_sweep('core.idempotency_keys');

-- 미사용자
grant select, insert, update, delete on core.nonuser_numbers to svc_app;
select core._grant_sweep('core.nonuser_numbers');

grant select, insert, update, delete on core.sms_notices, core.sms_optouts to svc_app;
grant select on core.sms_notices, core.sms_optouts to svc_admin;
grant insert on core.sms_notices, core.sms_optouts to svc_jobs;

grant select, insert, update, delete on core.optout_checks to svc_app;
select core._grant_sweep('core.optout_checks');

-- 대화방과 메시지. 관리자 서버는 읽지 못한다.
grant select, insert, update, delete on core.rooms to svc_app;
select core._grant_sweep('core.rooms');

grant select, insert, update, delete on core.room_senders to svc_app;

grant select, insert, update, delete on core.sent_rooms to svc_app;
select core._grant_sweep('core.sent_rooms');

grant select, insert, update, delete on core.messages to svc_app;
select core._grant_sweep('core.messages');

grant select, insert on core.send_logs to svc_app;
grant select on core.send_logs to svc_admin;
select core._grant_sweep('core.send_logs');

-- 질문과 설문
grant select, insert, update, delete on core.questions, core.survey_options to svc_app;
grant select (id, owner_account_id, kind, mod_hidden_at) on core.questions to svc_admin;
grant update (mod_hidden_at) on core.questions to svc_admin;

grant select, insert, update, delete on core.survey_votes to svc_app;

-- 6 · 9 사인. 관리자 서버는 접수 표를 읽지 못한다.
grant select, insert, update, delete on core.sign_sends to svc_app, svc_jobs;
grant select on core.sign_counts to svc_app;
grant select, insert, update on core.sign_counts to svc_jobs;
grant select on core.sign_batches to svc_admin;
grant select, insert, update on core.sign_batches to svc_jobs;

-- 신고와 차단과 제재
grant select, insert on core.reports to svc_app;
grant update (released_at, protect, protect_spend_enc) on core.reports to svc_app;
grant select, insert, update, delete on core.reports to svc_admin;
grant select (id, reason, target_kind, reporter_account_id, message_id, question_id, reported_at, ai_at)
  on core.reports to svc_jobs;
grant update (ai_reason, ai_score, ai_at) on core.reports to svc_jobs;

grant select, insert, delete on core.archives, core.archive_items to svc_app;
grant select on core.archives, core.archive_items to svc_admin;
grant select, delete on core.archives, core.archive_items to svc_jobs;

grant select, insert, update, delete on core.blocks to svc_app;
select core._grant_sweep('core.blocks');

grant select on core.sanctions, core.appeals to svc_app;
grant update (opinion) on core.sanctions to svc_app;
grant insert on core.appeals to svc_app;
grant select, insert, update, delete on core.sanctions, core.appeals to svc_admin;
grant select (id, account_id, kind, state, starts_at, ends_at, resets_on) on core.sanctions to svc_jobs;
grant update (state) on core.sanctions to svc_jobs;
grant select (id, sanction_id, state) on core.appeals to svc_jobs;
grant update (state) on core.appeals to svc_jobs;

grant select, insert, update, delete on core.carried_sanctions to svc_app;
grant insert on core.carried_sanctions to svc_admin;
select core._grant_sweep('core.carried_sanctions');

grant insert on core.detections to svc_app;
grant select, insert, update, delete on core.detections to svc_admin;

-- 토큰과 결제
grant select, insert, update, delete on core.wallets, core.token_lots, core.token_events to svc_app;
grant select, insert, update on core.wallets, core.token_lots, core.token_events to svc_admin;

grant select, insert, update, delete on core.purchases to svc_app;
grant select on core.purchases to svc_admin;
grant update (state, refunded_at) on core.purchases to svc_admin;
select core._grant_sweep('core.purchases');

grant insert on core.token_adjustments, core.refund_claims to svc_app;
grant select, insert, update, delete on core.token_adjustments, core.refund_claims to svc_admin;
select core._grant_sweep('core.token_adjustments');
select core._grant_sweep('core.refund_claims');

-- 문의와 안내
grant select, insert on core.inquiries, core.inquiry_files to svc_app;
grant select on core.inquiry_replies to svc_app;
grant select, insert, update, delete on core.inquiries, core.inquiry_files, core.inquiry_replies to svc_admin;
select core._grant_sweep('core.inquiries');
select core._grant_sweep('core.inquiry_files');
select core._grant_sweep('core.inquiry_replies');

grant select on core.official_notices to svc_app;
grant update (read_at, left_at) on core.official_notices to svc_app;
grant insert on core.official_notices to svc_admin;

grant select on core.announcements to svc_app;
grant select, insert, update, delete on core.announcements to svc_admin;

-- 운영
grant insert, select on audit.audit_logs, audit.operator_grants to svc_admin;
grant select (seq, at), delete on audit.audit_logs, audit.operator_grants to svc_jobs;

grant select, insert, update on core.stats_daily to svc_app, svc_jobs;
grant select on core.stats_daily to svc_admin;

grant select, insert, update, delete on
  core.operators, core.operator_devices, core.approval_requests, core.policy_values,
  core.policy_value_changes, core.legal_requests, core.evidence_bundles
  to svc_admin;

-- 익명 얼굴
grant select on core.faces, core.face_jobs to svc_app;
grant select, insert, update, delete on core.faces, core.face_jobs to svc_admin;
grant insert on core.faces, core.face_jobs to svc_jobs;

drop function core._grant_sweep(regclass);

-- 4. 설계 문서의 흐름에 꼭 필요해 7장의 표에 더한 권한 -------------------
-- 7장의 표에는 없지만 같은 문서 4장과 6장의 차례를 하려면 있어야 한다.
-- 작업 기록 T352_기록.md 3장에 까닭을 적었다. 기술설계_3 7장에 옮겨 적을 때까지 여기 모아 둔다.
grant insert on core.sign_counts to svc_app;                       -- 4.1 계정을 만들 때 받은 수 줄을 만든다
grant update (read_at) on core.send_logs to svc_app;               -- 4.4 발송 기록의 확인한 때를 적는다
grant insert on core.sanctions to svc_app;                         -- 4.1 다시 시작할 때 이어 갈 처분을 옮긴다
grant insert, delete on core.official_notices to svc_app;          -- 기술설계_4 3.9, 기술설계_3 3.8
grant select (id, restriction, restriction_until), update (restriction, restriction_until)
  on core.accounts to svc_jobs;                                    -- 6장 처분 갱신
