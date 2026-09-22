# AGENTS.md

## Operational Commands

- 패키지 매니저: `bun` 고정. `bun.lock`이 유일한 lockfile이며 `server/index.ts:138`이 `Bun.serve`를 직접 사용한다. npm/yarn/pnpm으로 설치하지 마라.
- 개발 서버 (API + 프론트 동시 실행): `bun run dev`
- API 서버만 실행: `bun run server` (포트 3002, `--watch`)
- 빌드: `bun run build`
- 린트: `bun run lint`
- 테스트: `bun run test` (`vitest run`), 워치 모드: `bun run test:watch`
- 테스트 대상 범위는 `vite.config.ts:20`의 `include: ['src/**/*.test.{ts,tsx}', 'server/**/*.test.ts']`로 고정돼 있다. 이 패턴 밖에 테스트 파일을 두면 실행되지 않는다.

## Golden Rules

### Immutable

- `.env`는 절대 커밋하지 않는다. 실제 `ANTHROPIC_API_KEY`/`GOOGLE_API_KEY` 값이 들어있고 `.gitignore`에 이미 등록돼 있다.
- Bun 전용 런타임을 Node/Express 등으로 교체하지 마라. `server/index.ts`는 `Bun.serve` API에 직접 의존한다.

### Do's & Don'ts (근거 기반)

1. **프로바이더별 호출 경로 비대칭을 통일하지 마라.**
   Google 호출(`callGoogle`, `server/index.ts:134-136`)은 `withModelFallback`으로 `GOOGLE_MODELS = ['gemini-3.1-flash-lite', 'gemini-3.5-flash']`(`server/index.ts:5`) 순서로 폴백한다. Anthropic 호출(`callAnthropic`, `server/index.ts:68-96`)은 폴백 없이 단일 모델을 직접 호출한다. 이는 경량 Gemini 모델의 실패율을 보완하기 위한 의도된 구조다 — "일관성 없음"으로 판단해 리팩터링하지 마라.

2. **render() 누락 방어는 이중 구조다. 한쪽만 남기지 마라.**
   `SYSTEM_PROMPT`가 AI에게 "컴포넌트 정의 후 `render(<Name />)` 호출"을 지시하고(`server/index.ts:13`), `ensureRenderCall()`(`server/generator.ts:16-24`)이 AI가 이를 빠뜨렸을 때 코드에서 첫 컴포넌트 선언을 찾아 자동 주입한다. 둘 중 하나만 유지하면 특정 모델·프롬프트 조합에서 미리보기가 빈 화면으로 깨진다.

3. **react-live `noInline` 계약과 SYSTEM_PROMPT는 함께 바꿔야 한다 (Hard Constraint).**
   `src/components/LivePreview.tsx:14`가 `<LiveProvider code={code} noInline>`로 렌더링한다. `noInline` 모드는 import문을 지원하지 않고 React를 전역으로 요구하며 코드 끝에 `render()` 호출이 필요하다. 이 제약이 `SYSTEM_PROMPT`(`server/index.ts:10-11,20`)의 "import 금지 / TypeScript 문법 금지 / `React.useState`처럼 전역 React 사용" 규칙 그대로 반영돼 있다. 둘 중 하나만 바꾸면 생성된 컴포넌트가 전부 깨진다.

4. **순수 로직과 부수효과 코드를 분리하고, 순수 함수만 테스트한다 (Test Boundary).**
   `server/generator.ts`, `server/fallback.ts`는 부수효과 없는 순수 함수이며 각각 대응하는 `*.test.ts`로 전량 테스트된다. 반면 `Bun.serve`와 실제 `fetch` 호출을 포함한 `server/index.ts`는 테스트가 없다. `index.ts`에 분기/변환 로직을 추가할 때 복잡해지면 순수 함수로 추출해 테스트를 붙여라 — 핸들러 안에 테스트되지 않은 로직을 쌓지 마라.

5. **API 키는 서버 경계를 넘지 않는다 (Security Boundary).**
   서버는 `ANTHROPIC_API_KEY`/`GOOGLE_API_KEY`를 `process.env`에서만 읽는다(`server/index.ts:59-62`). 클라이언트에는 실제 키 값이 아니라 `envKeys: { anthropic: boolean, google: boolean }` 존재 여부만 `/api/config`로 노출한다(`server/index.ts:147-157`). 새 엔드포인트나 에러 메시지에 실제 키 값이나 `.env` 내용을 포함하지 마라.

## Project Context

프롬프트를 입력하면 AI(Anthropic Claude / Google Gemini)가 react-live로 즉시 렌더링 가능한 React 컴포넌트 코드를 생성하고, 실시간 미리보기와 코드 뷰를 제공한다.

Tech Stack: React 19, TypeScript, Vite, Bun(API 프록시 서버), react-live, Vitest + Testing Library, ESLint(typescript-eslint, react-hooks, react-refresh).

## Standards & References

- 코딩 컨벤션: `eslint.config.js` (`bun run lint`로 확인). 별도 스타일 가이드 문서 없음.
- 테스트: Vitest(jsdom) + Testing Library. 새 테스트는 `src/**/*.test.{ts,tsx}` 또는 `server/**/*.test.ts` 경로를 따라야 `vite.config.ts`의 include 패턴에 잡힌다.
- Git/커밋 컨벤션: 별도 문서 없음 — 기존 `git log` 스타일을 따른다.
- **Maintenance Policy:** 이 문서의 규칙(특히 Golden Rules의 근거)이 실제 코드와 어긋나면, 그 사실을 알리고 AGENTS.md 업데이트를 제안하라.
