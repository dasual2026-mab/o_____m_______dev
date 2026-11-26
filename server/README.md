# 서버

서버 API와 DB 변경 파일이다. 설계는 자료 폴더의 기술설계_1부터 4까지를 따른다.

## 폴더

| 자리 | 담는 것 |
|---|---|
| `supabase/migrations/` | DB 변경 파일. 이름의 숫자 차례대로 적용한다 |
| `supabase/functions/api/` | 앱 서버의 들머리. 접속 역할은 `svc_app` |
| `supabase/functions/_shared/` | 공통 틀. 관문, 응답, 기록, 요청 제한, 서명 |
| `supabase/functions/_shared/routes/` | 창구. 창구 하나에 파일 하나 |
| `supabase/functions/_shared/defs/` | 공통 정의의 사본. 고치지 않는다 |
| `test/` | 검사. 빈 DB를 띄워 변경 파일부터 적용한다 |
| `scripts/` | 공통 정의를 옮기는 도구 |

## 명령

`server` 폴더에서 돌린다. Node 22.18 이상이 필요하다.

| 명령 | 하는 일 |
|---|---|
| `npm install` | 도구를 내려받는다. 처음 한 번 |
| `npm run sync` | `shared/src`의 공통 정의를 `_shared/defs`로 옮긴다 |
| `npm run check` | 형식 검사와 전체 검사를 돌린다 |
| `npm test` | 전체 검사만 돌린다 |

검사는 내 컴퓨터에 PostgreSQL 17을 잠깐 띄워서 한다.
끝나면 스스로 지운다. 실제 프로젝트에는 닿지 않는다.

## 검사가 보는 것
- 빈 DB에 변경 파일을 처음부터 적용하면 표가 55개다.
- 모든 표에 행 단위 보안이 켜져 있고 허용 규칙이 없다.
- 앱의 공개 키 역할로는 어느 표도 읽거나 쓸 수 없다.
- 서버의 접속 역할은 기술설계_3 7장에 적힌 일만 할 수 있다.
- 관문이 기술설계_4 2.8의 차례대로 돈다.
- 서버 기록에 계정 번호, 이름, 인증값, 주소가 남지 않는다.

## 창구를 더하는 차례
1. `shared/src/types.ts`에 요청과 응답의 모양을 적는다.
2. `npm run sync`로 사본을 옮긴다.
3. `_shared/routes/`에 창구 파일을 만든다. 주소와 인증은 `ENDPOINTS`에서 가져온다.
4. `_shared/routes/index.ts`의 목록에 더한다.
5. `test/`에 검사를 더하고 `npm run check`를 돌린다.

## 표를 바꾸는 차례
1. `supabase/migrations/`에 새 파일을 더한다. 이미 적용한 파일은 고치지 않는다.
2. 새 표는 그 파일 안에서 행 단위 보안을 켜고 접속 역할의 권한을 준다.
3. `test/harness.ts`의 표 목록을 고치고 `npm run check`를 돌린다.
4. 기술설계_3과 달라지는 곳은 작업 보고서로 알린다.

## 서버 기록
`_shared/log.ts`의 목록에 있는 이름만 남는다.
목록에 이름을 더할 때는 본문, 번호, 계정 번호와 방 번호의 짝이 남지 않는지 먼저 본다.
