-- 개발용 프로젝트에서 잠금을 확인하는 조회. 읽기만 한다.
-- npx supabase db query --remote --file scripts/verify-remote.sql
select
  (select count(*) from pg_tables where schemaname in ('core', 'audit')) as tables,
  (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname in ('core', 'audit') and c.relkind = 'r' and not c.relrowsecurity) as rls_off,
  (select count(*) from pg_policies where schemaname in ('core', 'audit')) as policies,
  (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
    cross join (values ('anon'), ('authenticated'), ('service_role')) r(role)
    where n.nspname in ('core', 'audit') and c.relkind = 'r'
      and (has_table_privilege(r.role, c.oid, 'select') or has_table_privilege(r.role, c.oid, 'insert')
        or has_table_privilege(r.role, c.oid, 'update') or has_table_privilege(r.role, c.oid, 'delete')
        or has_any_column_privilege(r.role, c.oid, 'select'))) as public_key_grants,
  (select count(*) from (values ('anon'), ('authenticated'), ('service_role')) r(role)
    where has_schema_privilege(r.role, 'core', 'usage') or has_schema_privilege(r.role, 'audit', 'usage')) as public_key_schema_usage,
  (select string_agg(rolname || ':' || rolbypassrls::text || ':' || rolcanlogin::text, ', ' order by rolname)
     from pg_roles where rolname like 'svc\_%') as server_roles,
  (select count(*) from supabase_migrations.schema_migrations) as migrations;
