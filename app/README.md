# 앱

Expo SDK 58과 React Native 0.88로 만든 앱이다. 뼈대는 T-353에서 만들었다.

- iOS 번들 ID와 Android 패키지 이름은 `com.mab.om`이다. 바꾸지 않는다.
- 서버 요청은 `src/api`를 거쳐서만 한다. `src/api/shared.ts`가 `../shared/src`의 공통 정의를 가져오는 단 하나의 들머리다.
- 일하는 규칙은 저장소의 `CLAUDE.md`에 있다.

## 명령

`app` 폴더에서 돌린다.

| 명령 | 하는 일 |
|---|---|
| `npm install` | 도구를 내려받는다. 처음 한 번 |
| `npx expo start` | 개발 서버를 띄운다. 휴대폰의 Expo Go로 화면의 QR을 찍으면 앱이 열린다 |
| `npx expo start --web` | 브라우저에서 미리 본다. 서버 요청은 브라우저 보안 규칙(CORS) 때문에 실패할 수 있다 |
| `npx tsc --noEmit` | 형식 검사 |

## 폴더

| 자리 | 담는 것 |
|---|---|
| `src/app/` | 화면. 파일 하나가 화면 하나다(Expo Router) |
| `src/components/` | 공통 부품. 화면 작업은 여기서 가져다 쓴다 |
| `src/theme/` | 색, 글자 단계, 글꼴. 디자인 명세 §2, §3의 값 |
| `src/api/` | 서버 요청 틀, 서버 시각, 기기 연결 인증값 보관 |
| `src/legal/` | 오픈소스 라이선스 고지 |
| `assets/fonts/` | Pretendard 1.3.9 가변 폰트 원본과 라이선스 |

## 공통 부품

| 부품 | 파일 | 명세 |
|---|---|---|
| 글자 | `Txt` | §3. 모든 글자는 이 부품으로 그린다 |
| 화면 틀 | `Screen` | §1, §4. 상단 바, 내용, 하단 탭 바 |
| 상단 바 | `TopBar` | §4.1. 뒤로, 로고 숨쉬기, 토큰 필 |
| 하단 탭 바 | `BottomBar` | §4.4. 네 탭, 켜진 탭 밑줄, 새 소식 점 |
| 화면 머리 | `Hero` | §4.5. 제목과 접이식 설명 |
| 바텀 시트 | `BottomSheet`, `SheetActions` | §5.7 |
| 토스트 | `useToast().show()` | §5.7 |
| 접이식 행 | `FoldRow` | 용어집 '접이식 행' |
| 카테고리 버튼 | `CategoryBar`, `nextSelection` | §5.4, 용어집 '카테고리 버튼' |
| 긴 버튼 | `Button` | §5.1 |
| 아이콘 | `icons.tsx` | §8 |

개발 중에는 01 화면의 '부품 견본(개발용)'에서 부품을 한 화면에 모아 볼 수 있다.
