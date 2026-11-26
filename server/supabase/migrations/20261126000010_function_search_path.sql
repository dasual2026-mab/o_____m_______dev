-- 10 함수의 검색 경로를 비워 고정한다.
-- Supabase 보안 점검(function_search_path_mutable)이 개발용 프로젝트에서 짚은 세 함수다.
-- 부르는 쪽의 검색 경로에 따라 다른 함수가 불리는 일을 막는다. 기본 함수(pg_catalog)는 그대로 쓰인다.

alter function core.new_receipt_no(text) set search_path = '';
alter function core.kst_today() set search_path = '';
alter function audit.forbid_change() set search_path = '';
