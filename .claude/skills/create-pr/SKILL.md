---
name: create-pr
description: |
  현재 브랜치의 변경사항을 분석해 GitHub Pull Request를 생성한다. base 브랜치 대비 커밋 전체를 검토해 제목·본문을 작성하고, 필요하면 push까지 수행한 뒤 PR URL을 반환한다.
  "PR 만들어줘", "PR 생성해줘", "pull request 만들어줘", "PR 열어줘", "create a PR", "open a pull request", "/create-pr" 같은 요청에 활성화한다.
  이미 열려 있는 PR에 대한 리뷰 코멘트 반영은 이 스킬의 범위가 아니다(autofix 스킬 사용). 단순 커밋만 요청하는 경우에도 사용하지 않는다(commit 스킬 사용).
argument-hint: "[base 브랜치] [--draft] [--lang ko|en]"
context: fork
background: false
---

# create-pr: 현재 브랜치로 GitHub PR 생성

현재 브랜치의 커밋을 base 브랜치와 비교 분석해 PR 제목·본문을 작성하고, `gh pr create`로 PR을 생성한다. push와 PR 생성은 이 스킬을 호출한 것 자체가 사용자의 승인이므로 매번 다시 확인받지 않는다. 단, **커밋되지 않은 변경사항 처리**와 **base 브랜치로의 직접 커밋 방지**는 아래 절차대로 반드시 사용자에게 확인한다.

이 스킬은 `context: fork`로 격리된 서브에이전트에서 실행된다. 메인 세션의 대화 히스토리를 자동으로 물려받지 않으므로, 사용자가 지정한 base 브랜치·`--draft`·`--lang` 같은 인자는 호출 시점에 프롬프트로 명시해서 전달해야 한다. `background: false`이므로 실행이 끝나면 PR URL을 포함한 결과를 그 자리에서 돌려받는다(백그라운드로 넘어가지 않는다).

## Step 0: 사전 확인

병렬로 확인한다:

- `git rev-parse --is-inside-work-tree` — git 저장소가 아니면 알리고 종료한다.
- `gh auth status` — 인증돼 있지 않으면 로그인 방법을 안내하고 종료한다.
- `git remote -v` — `origin`(또는 유일한 remote)이 없으면 원격 저장소가 없다는 사실을 알리고 종료한다(레포 생성은 이 스킬의 범위가 아니다).
- 저장소 루트의 `AGENTS.md`(없으면 `CLAUDE.md`)를 읽어 PR 제목/본문 컨벤션, 필수 체크리스트, 커밋 컨벤션이 명시돼 있으면 이후 전 과정에서 우선 적용한다.
- `.github/pull_request_template.md`(대소문자·경로 변형 포함, 예: `.github/PULL_REQUEST_TEMPLATE.md`, `docs/pull_request_template.md`)가 있으면 그 저장소 자체 템플릿을 최우선으로 쓴다(이 스킬의 번들 템플릿보다 우선).

## Step 1: 브랜치·base 확인

- 현재 브랜치를 확인한다(`git branch --show-current`). **base 브랜치와 동일하면**(예: `main`/`master`에서 직접 요청) 진행하지 않는다 — base로 직접 여는 PR은 의미가 없으므로, 새 브랜치를 만들지 사용자에게 확인받는다(브랜치명은 변경 내용에 맞게 제안).
- base 브랜치 결정 순서: (1) 사용자가 인자로 지정한 브랜치, (2) `gh repo view --json defaultBranchRef -q .defaultBranchRef.name`으로 확인한 저장소 기본 브랜치. 이 둘이 다르면 사용자 지정을 따른다.
- 현재 브랜치가 base로부터 분기된 지점 확인: `git merge-base <base> HEAD`.

## Step 2: 커밋되지 않은 변경사항 처리

- `git status --porcelain`으로 확인한다.
- 변경사항이 있으면 **자동으로 커밋하지 않는다.** 사용자에게 내용을 보여주고 다음 중 하나를 선택하게 한다: (1) 지금 커밋 후 진행(원하면 `commit` 스킬 절차를 따른다), (2) 변경사항을 제외하고 이미 커밋된 것만으로 진행, (3) 취소.
- 변경사항이 없으면 바로 다음 단계로 진행한다.

## Step 3: 커밋 히스토리 전체 분석

**마지막 커밋만 보지 말고, base에서 분기된 이후의 전체 커밋을 본다.**

- `git log --oneline <base>..HEAD`
- `git diff <base>...HEAD` (3-dot: 분기 지점 기준 diff)
- 이미 열린 PR이 있는지 확인: `gh pr list --head <현재 브랜치> --state open --json number,url,title`
  - 이미 있으면 **새로 만들지 않는다.** 기존 PR URL을 알리고, 업데이트(push)만 원하는지 확인한다.

## Step 4: push

- 현재 브랜치가 원격을 추적 중인지, 추적 중이면 원격보다 앞서 있는지 확인한다(`git status -sb` 또는 `git rev-list --count @{u}..HEAD`).
- 추적 브랜치가 없으면 `git push -u origin <브랜치>`로 최초 push한다.
- 추적 중이고 로컬이 앞서 있으면 `git push`로 반영한다.
- **force push는 이 스킬의 범위 밖이다.** 원격과 분기(diverged)되어 일반 push가 거부되면, 원인(예: 다른 사람이 같은 브랜치에 push함)을 사용자에게 알리고 지시를 받는다 — 임의로 `--force`를 쓰지 않는다.

## Step 5: PR 제목·본문 작성

- **제목**: 70자 이내, 핵심 변경만 간결하게. 여러 커밋이 섞여 있으면 전체를 아우르는 제목을 새로 짓는다(마지막 커밋 메시지를 그대로 쓰지 않는다).
- **본문 템플릿 선택** (우선순위 순):
  1. `.github/pull_request_template.md`(Step 0에서 확인) — 저장소 자체 템플릿이 있으면 무조건 이것을 쓴다.
  2. 없으면 이 스킬에 번들된 템플릿 중 하나를 언어 판단에 따라 고른다:
     - 기본값은 **`references/pr_template_ko.md`(한국어)**.
     - 다음 신호가 뚜렷하면 **`references/pr_template_en.md`(영어)**로 전환한다 — "오픈소스 영어 기반 프로젝트" 판단 기준:
       - `gh repo view --json isPrivate,licenseInfo`로 public이고 오픈소스 라이선스(MIT/Apache-2.0 등)가 설정돼 있음, **그리고**
       - `README.md`(또는 `README`) 본문이 영어 위주(한글 문자 비율이 낮음)임, **그리고**
       - `git log --oneline -20`의 최근 커밋 메시지가 영어 위주임
       - 위 세 신호가 모두 영어를 가리켜야 전환한다. 신호가 엇갈리거나 판단이 애매하면 기본값(한국어)을 유지한다.
     - 사용자가 호출 시 `--lang ko` 또는 `--lang en`을 명시하면 위 판단을 건너뛰고 그 지정을 그대로 따른다.
  - 선택한 템플릿 파일을 읽어 그 구조(섹션 제목, 체크리스트 형식)를 그대로 따르되, 안내용 브라켓(`[...]`)은 실제 내용으로 채우고 해당 없는 섹션은 삭제한다.
- **본문 내용**: Step 3에서 분석한 **모든 커밋**을 반영해 작성한다. diff를 그대로 붙여넣지 않는다. "왜" 바꿨는지를 중심으로, 무엇을 바꿨는지는 diff로 알 수 있으므로 반복하지 않는다.
- 시스템 지침에 PR 본문 attribution 문구(예: `🤖 Generated with Claude Code`)가 지정돼 있으면 본문 마지막에 그대로 포함한다(선택한 템플릿 언어와 무관하게 지정된 문구 그대로 넣는다).

## Step 6: PR 생성

- `--draft` 인자가 있으면 `gh pr create --draft`로 생성한다.
- 본문은 반드시 HEREDOC으로 전달해 개행이 깨지지 않게 한다:
  ```bash
  gh pr create --title "제목" --base <base> --body "$(cat <<'EOF'
  ...본문...
  EOF
  )"
  ```
- base가 저장소 기본 브랜치와 동일하면 `--base` 옵션을 생략해도 된다.

## Step 7: 결과 보고

- 생성된 PR URL을 사용자에게 전달한다.
- CI/필수 체크가 저장소에 설정돼 있다면(`gh pr checks` 등으로 감지 가능하면) 체크 목록만 안내하고, 통과를 기다리며 폴링하지 않는다.

## 하지 않는 것

- `git push --force`, base 브랜치로의 직접 커밋, PR 자동 머지·자동 승인은 하지 않는다.
- 커밋되지 않은 변경사항을 사용자 확인 없이 커밋하거나 버리지 않는다.
- 이미 열린 PR이 있는데 중복으로 새 PR을 만들지 않는다.
- PR 본문에 diff 원문, 시크릿·자격증명 문자열을 포함하지 않는다.
