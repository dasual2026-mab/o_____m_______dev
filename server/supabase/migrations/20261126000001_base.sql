-- 01 바탕: 스키마와 접속 역할. 기술설계_3 2.1
-- 서비스 표는 core, 고칠 수 없는 운영 기록은 audit에 둔다. 둘 다 앱에 내보이지 않는다.

create schema if not exists core;
create schema if not exists audit;

revoke all on schema core from public;
revoke all on schema audit from public;

-- 접속 역할 셋. 로그인과 비밀번호는 변경 파일에 적지 않는다.
-- 프로젝트를 만든 뒤 대표가 대시보드에서 따로 건다. docs/개발환경.md에 있다.
-- 행 단위 보안은 모든 표에 켜고 허용 규칙을 두지 않는다. 그래서 서버 역할은 그 검사를 건너뛴다.
do $$
declare r text;
begin
  foreach r in array array['svc_app', 'svc_admin', 'svc_jobs'] loop
    if not exists (select 1 from pg_roles where rolname = r) then
      execute format('create role %I nologin noinherit bypassrls', r);
    end if;
  end loop;
end $$;

-- 새로 만드는 함수는 아무나 부르지 못하게 한다.
alter default privileges in schema core revoke execute on functions from public;
alter default privileges in schema audit revoke execute on functions from public;

-- 접수 번호. 꼴은 앞 글자, 한국 날짜 여섯 자리, 무작위 숫자 네 자리다. 예: R-261103-0412
-- 같은 번호가 나오면 넣는 쪽이 다시 뽑는다. 표마다 겹칠 수 없게 걸어 둔다.
create function core.new_receipt_no(prefix text)
returns text
language sql
volatile
as $$
  select prefix || '-' || to_char(now() at time zone 'Asia/Seoul', 'YYMMDD') || '-' ||
         lpad((floor(random() * 10000))::int::text, 4, '0');
$$;

-- 한국 날짜. 날을 세는 경계는 한국 시각 0시다. 2.3
create function core.kst_today()
returns date
language sql
stable
as $$
  select (now() at time zone 'Asia/Seoul')::date;
$$;
