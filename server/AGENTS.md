# server/AGENTS.md

## Module Context

Bun 런타임으로 동작하는 AI API 프록시 서버. 프론트엔드의 `/api/generate`, `/api/config` 요청을 받아 Anthropic/Google API를 호출하고, react-live에서 바로 실행 가능한 코드로 정규화해 반환한다.

## Tech Stack & Constraints

- `Bun.serve`만 사용한다(`index.ts:138`) — Express나 Node `http` 서버로 바꾸지 마라.
- 외부 API 호출은 Bun 내장 `fetch`로 직접 수행한다. axios 등 별도 HTTP 클라이언트를 추가하지 마라(현재 devDependencies에 없음).
- 포트 3002 고정(`index.ts:139`). `vite.config.ts:11`의 프록시 대상과 짝을 이루므로, 포트를 바꾸면 `vite.config.ts`도 함께 바꿔라.

## Implementation Patterns

- 부수효과 없는 변환 로직(`stripCodeFences`, `ensureRenderCall`)은 `generator.ts`에, 재시도/폴백 로직(`withModelFallback`)은 `fallback.ts`에 분리돼 있다. 새 순수 로직도 이 패턴을 따라 별도 모듈로 뽑아라 — `index.ts`에 직접 추가하지 마라.
- 새 프로바이더를 추가할 때는 `callX(prompt, apiKey)` 형태의 함수로 만들고 `Provider` 타입과 `ENV_KEYS`에 등록한다(`index.ts:57-62`).

## Testing Strategy

- `bun run test` (vitest run).
- `generator.ts`/`fallback.ts`처럼 부수효과 없는 함수는 반드시 대응하는 `*.test.ts`를 작성한다.
- `index.ts`의 `Bun.serve` 핸들러 자체는 테스트하지 않는 것이 이 코드베이스의 기존 관례다. 핸들러 로직이 복잡해지면 테스트를 추가하기보다 순수 함수로 추출해 옮겨라.

## Local Golden Rules

- Google 호출은 `withModelFallback(GOOGLE_MODELS)`로 폴백하고, Anthropic 호출은 단일 모델을 직접 호출한다(`index.ts:5,68-96,134-136`). 이 비대칭은 의도된 것이므로 통일하지 마라.
- `SYSTEM_PROMPT`의 "import 금지 / TypeScript 문법 금지 / `render()` 호출" 규칙(`index.ts:10-11,20`)은 `src/components/LivePreview.tsx`의 `noInline` 설정과 1:1로 묶여 있다. `SYSTEM_PROMPT`를 바꾸면 `LivePreview.tsx`의 `noInline` 계약과 어긋나지 않는지 반드시 확인하라.
- `render()` 누락 방어는 `SYSTEM_PROMPT` 지시(`index.ts:13`) + `ensureRenderCall`(`generator.ts:16-24`) 이중 구조다. 하나만 남기지 마라.
- `ANTHROPIC_API_KEY`/`GOOGLE_API_KEY`는 `index.ts:59-62`의 `ENV_KEYS`에서만 읽는다. 새 코드에서 `process.env`를 직접 또 읽지 말고 `ENV_KEYS`/`resolveApiKey`를 재사용하라 — 키를 읽는 지점을 하나로 유지하기 위함이다.
