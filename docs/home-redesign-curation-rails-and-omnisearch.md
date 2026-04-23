# Home Redesign — Curation Rails + ⌘K Omni-Search

> 설계 문서 (코드 미포함). 본 문서가 머지된 뒤, 「PR 분할 계획」 섹션의 순서에 따라
> 작은 PR들을 차례로 올린다. 각 PR은 본 문서의 해당 섹션을 인용한다.

## 0. 배경 / 현재 상태

| 항목 | 현재 | 한계 |
|---|---|---|
| 홈 페이지 (`apps/web/src/app/[locale]/page.tsx`) | Hero → DesignPhilosophyBand → 3-pillar grid → StatsTrustRow → ArchivePreviewGrid → MarketingCtaBand | 두 CTA 모두 `/releases`로 가서 1차/2차 분리(#13)가 시각적으로 드러나지 않음 |
| Hero (`Hero.tsx`) | "OPUS / THE CHRONICLE" + 두 링크 모두 `/releases` | 1차·2차 양쪽 진입 동선이 없음 |
| ArchivePreviewGrid | 8개 카드, **모두 `/releases` 동일 링크** | 개별 작품 디테일/작가/큐레이션 디스커버리 부재 |
| 검색 | 없음 | URL 직접 타이핑 외엔 작품·작가에 도달할 수단 없음 |
| 데이터 | JSONL 3개 (`storage/submissions.jsonl`, `ownership-events.jsonl`, `collector-transfer-listings.jsonl`) + 데모 이미지 (`public/local-artworks/`) | Prisma 모델은 #14로 랜딩됐지만 미사용 |

## 1. 목표 / 비목표

### 목표
- 홈 첫 화면에서 **1차(신작 공개)와 2차(소장 계보) 두 갈래**가 시각적으로 동등하게 드러나야 한다.
- **큐레이션 레일** 4개로 발견성을 늘린다 — 단순 그리드 이상의 편집 의도 표현.
- ⌘K **전역 검색**으로 작품·작가·에디션·리스팅에 즉시 도달 가능하게 한다.
- 모든 변경은 KO/JA/EN 카피·라벨이 동시에 들어간 상태로 머지된다.
- 신규 Prisma 모델 cutover와 **분리** — UI는 기존 데이터 소스 위에서 먼저 완성하고, 데이터 레이어는 별도 흐름.

### 비목표
- 결제·체크아웃·R-18 게이트 변경 — 본 작업 범위 밖.
- Edition/Listing/Chronicle 테이블로의 **읽기 cutover** — UI가 안정화된 다음 별도 PR 시리즈.
- 디자인 시스템 토큰(색·타이포·금속 표면) 변경 — 기존 `opus-*` 토큰만 사용.
- 모바일 앱 / SSR 검색 인프라 도입(Algolia 등) — MVP는 클라이언트 인덱스로 시작.

## 2. IA — 변경 전 / 변경 후

```
[ BEFORE ]
Hero (CTA × 2 → 둘 다 /releases)
  └ DesignPhilosophyBand
     └ 3-pillar grid (Chronicle / Vault / Premieres)
        └ StatsTrustRow
           └ ArchivePreviewGrid (8장, 동일 링크)
              └ MarketingCtaBand

[ AFTER ]
Hero (CTA × 2 → /releases · /provenance, 동등 비중)  ← 변경
  └ ⌘K hint card (검색 진입을 첫 화면에 노출)        ← 신규
     └ Rail A : 新作公開 · Releases (1차)            ← 변경 (ArchivePreviewGrid 진화)
        └ Rail B : 来歴 · Provenance (2차 활성)      ← 신규
           └ Rail C : Featured Artists (작가 셸프)   ← 신규
              └ Rail D : Curation (운영자 편집)      ← 신규 (placeholder부터)
                 └ The Chronicle preview            ← 신규 (마스킹된 최근 이벤트)
                    └ DesignPhilosophyBand          ← 위치 하강
                       └ StatsTrustRow              ← 유지
                          └ MarketingCtaBand        ← 유지 (CTA 카피 1차/2차 양립으로 살짝 손봄)
```

3-pillar grid (Chronicle / Vault / Premieres)는 의미가 Rail B/C/D에 흡수되므로 **삭제**한다. 같은 정보를 두 번 말하지 않는다.

## 3. 섹션별 상세

### 3.1 Hero (변경)
- **유지**: 큰 OPUS 타이포, 글래스 패널, 12-tile aurora 배경.
- **변경**:
  - CTA 두 개를 **시각적으로 동등한 비중**으로 분리.
    - Primary: `withLocale(locale, "/releases")` — 「新作公開 · Releases · 신작 공개」
    - Secondary: `withLocale(locale, "/provenance")` — 「来歴 · Provenance · 소장 계보」
    - 둘 다 동일한 metallic 표면을 쓰되 secondary는 outline 변형.
  - 작은 보조 텍스트: 「⌘K で探索 · ⌘K to search · ⌘K로 탐색」 — ⌘K가 무엇인지 첫 화면에서 학습시킴.
- **카피**: 기존 `m.hero.exploreArchive`, `m.hero.viewPremieres`를 1차/2차 분리에 맞게 의미 재배치 (`m.hero.openReleases`, `m.hero.openProvenance` 신설; 구 키는 deprecate).

### 3.2 ⌘K Hint Card (신규)
- Hero 직후, 폭 좁은 1열 카드.
- 모양: 검색창처럼 보이지만 클릭/`⌘K`/`Ctrl+K`/`/` 셋 다 같은 모달을 연다.
- 카피 (placeholder):
  - KO: `작품·작가·에디션을 찾아보세요`
  - JA: `作品・作家・エディションを検索`
  - EN: `Search artworks, artists, and editions`
- 모달 자체는 §4에서 상세.

### 3.3 Rail A — 新作公開 · Releases (1차)
- 데이터: `loadCatalogFiles()` (현재) → 후속 PR에서 `Edition + Listing(market=PRIMARY, status=OPEN)`로 cutover.
- 카드: 현 ArchivePreviewGrid 카드를 그대로 쓰되,
  - 링크는 **개별 작품 디테일** (`/releases/[slug]`) 로 (현재 8개 카드가 모두 목록으로 가는 문제 해결).
  - 우상단 칩: `PRIMARY` 또는 「新作」 배지.
- 헤더 우측 "View all" → `/releases`.

### 3.4 Rail B — 来歴 · Provenance (2차)
- 데이터: `listOpenCollectorTransferListings()` (현재 JSONL) — 그대로 사용 가능.
- 카드 표현:
  - 작품 타이틀 (펜네임 표기, **본명 절대 노출 금지**).
  - `Edition X / N` ref.
  - `¥` 가격 (JPY 정수).
  - 우상단 칩: `SECONDARY` 또는 「来歴」.
  - 카드 푸터에 **마스킹된 셀러 ref** (`maskSellerId`) — 신뢰감 + 익명성 동시.
- 빈 상태 (활성 리스팅 0건):
  - "지금은 진행 중인 수탁 이전이 없습니다" + `/vault/transfer/register` 링크.
- 헤더 우측 "View all" → `/provenance`.

### 3.5 Rail C — Featured Artists (작가 셸프)
- 데이터 (1단계, JSONL 기반):
  - `parseTitleArtist(file, idx)`로 카탈로그를 그룹화 → 같은 `artist`로 묶이는 작품 ≥2개인 펜네임만.
  - 데모 카탈로그라서 결과가 빈약하면, 운영자 픽 6명을 **카탈로그(`apps/web/src/data/featured-artists.ts`)** 에 정적으로 둔다 — 데이터 소스를 한 군데에서 갈아 끼울 수 있게.
- 데이터 (2단계, Prisma cutover 후):
  - `User.where(role=ARTIST)` + `Edition.count(isIssued=true)` 상위 N + 운영자 추천 플래그.
- 카드: 작가 펜네임 + 대표 작품 1~3장 미니썸네일 + "이 작가의 작품 보기" 링크 → 작가 페이지 (별도 PR로 신설).
- **PII 가드**: 본명·이메일·국적 등 일체 표시 금지. ISO 27001 A.18.1.4 / SECURITY_GOVERNANCE.md §1.

### 3.6 Rail D — Curation (운영자 편집 셀렉션)
- 1단계: `apps/web/src/data/curation.ts`에 정적 카탈로그.
  ```ts
  type CurationShelf = {
    id: string;
    title: { ko: string; ja: string; en: string };
    description: { ko: string; ja: string; en: string };
    items: Array<{ kind: "artwork" | "edition" | "listing"; ref: string }>;
  };
  ```
- 2단계: `/api/operator/curation`로 운영자 페이지에서 편집 (별도 PR, 운영자 권한 필요 — `OpusRole.OPERATOR`).
- 홈에서는 가장 최근 1개 셸프만 보여주고 "다른 셸프 보기"로 `/curation` (신설) 페이지로.

### 3.7 The Chronicle Preview
- 데이터 (1단계): 데모 빈 상태 + "곧 공개" 카드.
- 데이터 (2단계, Prisma cutover 후): `ChronicleEntry.orderBy(occurredAt desc).take(5)` — `eventType`별 아이콘 + 마스킹된 from/to.
- **표현 규칙**: 실명·이메일·지갑주소 같은 식별자 직접 노출 금지. `maskSellerId` 패턴 재사용.

### 3.8 그 외
- DesignPhilosophyBand · StatsTrustRow · MarketingCtaBand는 위치만 아래로 이동, 내용 변경 없음.
- MarketingCtaBand의 1개 CTA가 현재 Buy 한 가지만 강조하는데, 2차 채널을 가벼운 보조 링크로 추가 (`Open Provenance`).

## 4. ⌘K Omni-Search 상세

### 4.1 진입
- 키바인딩 (모든 페이지): `⌘K` (mac), `Ctrl+K` (win/linux), `/` (input 외부에서).
- 헤더 우측에 작은 `⌘K` 버튼 추가.
- 홈 §3.2의 hint card.

### 4.2 모달 구성
```
┌────────────────────────────────────────────────┐
│  [🔍] 작품·작가를 입력…                  ⌘K [X] │
├────────────────────────────────────────────────┤
│  [ All ] [ Artworks ] [ Artists ] [ Listings ] │ ← 스코프 탭
├────────────────────────────────────────────────┤
│  ARTWORKS                                       │
│  · Premiere XII — Pen Name        [ PRIMARY ]   │
│  · Aurora Canon — Other Pen       [ PRIMARY ]   │
│                                                  │
│  ARTISTS                                         │
│  · Pen Name (작품 4점)                          │
│                                                  │
│  LISTINGS (来歴 · Provenance)                   │
│  · Test Work · ¥5,000              [SECONDARY]  │
└────────────────────────────────────────────────┘
   ⏎ 선택  ⇅ 이동  esc 닫기  · 17건 / 4ms
```

### 4.3 데이터 소스
- **MVP (PR-6)**: 빌드 타임에 `/api/search/index.json` 정적 생성.
  - 카탈로그 파일 + 활성 transfer listings를 합쳐 ≤ 200KB 인덱스.
  - 클라이언트에서 fuzzy search (간단한 substring + 토큰 매칭, 외부 라이브러리 없이).
  - 모달 열 때 fetch + 인메모리 캐시.
- **확장 (별도 PR)**: `/api/search?q=&scope=&limit=` 서버 핸들러로 전환 (Prisma cutover 후).
  - 풀텍스트는 PostgreSQL `to_tsvector` (KO/JA/EN trigram) 또는 `ILIKE` 시작.

### 4.4 결과 카드 규칙
- **배지 필수**: PRIMARY (新作 / Releases) 또는 SECONDARY (来歴 / Provenance) 둘 중 하나만.
- **펜네임만 표시**, 본명 절대 금지.
- 가격은 JPY 정수만 (`¥12,000`, ja-JP toLocaleString).
- "투자/수익/자산" 류 단어 절대 금지 (.cursorrules §2 위반).

### 4.5 i18n / 접근성
- 모든 placeholder, empty state, 단축키 힌트, 배지 라벨은 `m.search.*`로 신설하고 KO/JA/EN 동시 추가.
- 모달은 focus trap + `aria-modal="true"` + 첫 input 자동 포커스.
- ESC 닫기, ⏎ 선택, ↑↓ 이동.
- 결과 0건일 때 "직접 둘러보기" 보조 링크 → `/releases` / `/provenance`.

### 4.6 라이브러리 결정
- 후보: `cmdk` (Radix 계열, 5KB, headless) vs 자체 구현.
- **선택**: `cmdk`. 이유 — 키바인딩·focus·접근성을 직접 짜면 PR이 2배가 된다. 디자인은 className으로 100% 우리 토큰에 맞출 수 있다.
- 설치: `pnpm --filter @opus/web add cmdk`.

## 5. 데이터 소스 매핑 (현재 → 목표)

| 레일/섹션 | 현재 데이터 | 목표 데이터 (Prisma cutover 후) | cutover 트리거 |
|---|---|---|---|
| Rail A Releases | `loadCatalogFiles()` (FS) + `parseTitleArtist` | `Edition (isIssued=true)` join `Artwork` join `Listing(market=PRIMARY, status=OPEN)` | 별도 PR |
| Rail B Provenance | `listOpenCollectorTransferListings()` (JSONL) | `Listing.where(market=SECONDARY, status=OPEN)` | 별도 PR |
| Rail C Featured Artists | `parseTitleArtist` 그룹화 + 정적 픽 | `User.where(role=ARTIST)` + 운영자 추천 플래그 | Rail B와 동시 |
| Rail D Curation | `apps/web/src/data/curation.ts` 정적 | 운영자 페이지 편집 결과 (DB) | 운영자 권한 PR 후 |
| The Chronicle preview | 빈 상태 / "곧 공개" | `ChronicleEntry.orderBy(occurredAt desc)` 마스킹 | Chronicle 쓰기 cutover 후 |
| Search index | `/api/search/index.json` (빌드 타임) | `/api/search` (DB 쿼리) | Rail A/B cutover와 함께 |

## 6. 카피 가이드 (KO / JA / EN)

> 1차/2차 표기 규칙 (.cursorrules §2): `재판매 · 2차 판매 · 再販 · 再販売 · 中古 · resale market` 류 일체 금지.

| 키 | KO | JA | EN |
|---|---|---|---|
| `hero.openReleases` | 신작 공개 | 新作公開 | Releases |
| `hero.openProvenance` | 소장 계보 | 来歴 | Provenance |
| `home.searchHint` | 작품·작가·에디션을 찾아보세요 | 作品・作家・エディションを検索 | Search artworks, artists, editions |
| `home.railA.title` | 新作 공개 · 최신 1차 에디션 | 新作公開・最新の一次エディション | Releases — latest primary editions |
| `home.railB.title` | 소장 계보 · 진행 중인 수탁 이전 | 来歴・現在の所蔵者移転 | Provenance — open custody transfers |
| `home.railC.title` | 작가 셸프 | 作家のシェルフ | Featured artists |
| `home.railD.title` | 큐레이션 | キュレーション | Curation |
| `home.chroniclePreview.title` | The Chronicle 최근 기록 | The Chronicle 最近の記録 | The Chronicle — recent entries |
| `search.placeholder` | 작품·작가를 입력… | 作品・作家を入力… | Search artworks, artists… |
| `search.scopeAll` | 전체 | すべて | All |
| `search.scopeArtwork` | 작품 | 作品 | Artworks |
| `search.scopeArtist` | 작가 | 作家 | Artists |
| `search.scopeListing` | 来歴 리스팅 | 来歴出品 | Provenance listings |
| `search.empty` | 일치하는 결과가 없습니다 | 該当する結果がありません | No results match your query |
| `badge.primary` | 新作 | 新作 | New release |
| `badge.secondary` | 来歴 | 来歴 | Provenance |

## 7. 기술 변경 (모듈 단위)

### 7.1 신규 파일 (예정)
- `apps/web/src/components/home/HomeSearchHint.tsx` — §3.2
- `apps/web/src/components/home/RailReleases.tsx` — §3.3 (Rail A)
- `apps/web/src/components/home/RailProvenance.tsx` — §3.4 (Rail B)
- `apps/web/src/components/home/RailFeaturedArtists.tsx` — §3.5 (Rail C)
- `apps/web/src/components/home/RailCuration.tsx` — §3.6 (Rail D)
- `apps/web/src/components/home/ChroniclePreview.tsx` — §3.7
- `apps/web/src/components/search/OmniSearchModal.tsx` — §4
- `apps/web/src/components/search/OmniSearchTrigger.tsx` — 헤더 버튼
- `apps/web/src/components/search/OmniSearchProvider.tsx` — 키바인딩 + 모달 상태
- `apps/web/src/lib/searchIndex.ts` — 빌드 타임 인덱스 생성
- `apps/web/src/app/api/search/index.json/route.ts` — 정적 인덱스 응답
- `apps/web/src/data/featured-artists.ts` — 1단계 픽
- `apps/web/src/data/curation.ts` — 1단계 셸프

### 7.2 수정 파일 (예정)
- `apps/web/src/app/[locale]/page.tsx` — §2 AFTER 구조로 재배치
- `apps/web/src/components/Hero.tsx` — CTA 두 갈래화
- `apps/web/src/components/SiteHeader.tsx` — `⌘K` 버튼 추가
- `apps/web/src/components/home/ArchivePreviewGrid.tsx` — Rail A로 흡수 후 deprecated/삭제
- `apps/web/src/i18n/{types,catalog/{ko,ja,en}}.ts` — 신규 메시지 키 (§6)
- `apps/web/src/i18n/types.ts` — `home.searchHint`, `home.railA..D.title`, `search.*`, `badge.*`

### 7.3 삭제 후보
- 3-pillar grid (Chronicle/Vault/Premieres) — `page.tsx` 안의 인라인 블록.
- `m.home.pillarChronicle`, `m.home.pillarVault`, `m.home.pillarPremieres` 메시지 키.

## 8. PR 분할 계획 (작은 단위)

각 PR은 main에서 갈라져 본 문서의 해당 섹션을 인용한다.

| # | 브랜치 | 내용 | 의존 |
|---|---|---|---|
| **PR-1** | `docs/home-redesign-spec` | **이 문서** 추가 | — |
| **PR-2** | `feat/home-hero-dual-cta` | Hero CTA 두 갈래화 + 카피 KO/JA/EN | PR-1 |
| **PR-3** | `feat/home-ia-rebuild` | 3-pillar grid 제거 + 빈 Rail 슬롯 4개 placeholder + ChroniclePreview placeholder | PR-2 |
| **PR-4** | `feat/home-rail-provenance` | Rail B 실데이터 연결 (JSONL) | PR-3 |
| **PR-5** | `feat/home-rail-releases` | Rail A 실데이터 연결 (`loadCatalogFiles`) + 카드 링크를 `/releases/[slug]`로 | PR-3 |
| **PR-6** | `feat/home-rail-featured-artists` | Rail C 데이터 (그룹화 + 정적 픽 fallback) + 작가 페이지 신설은 별도 | PR-3 |
| **PR-7** | `feat/home-rail-curation` | `data/curation.ts` 1셸프 + Rail D | PR-3 |
| **PR-8** | `feat/omnisearch-mvp` | `cmdk` 도입 + 인덱스 + 모달 + ⌘K | PR-3 |
| **PR-9** | `feat/home-chronicle-preview` | The Chronicle preview (빈 상태 우선, cutover는 후속) | PR-3 |

### 8.1 머지 순서 권장
PR-1 → PR-2 → PR-3 머지 후 PR-4..9 병렬 가능. PR-8(검색)이 가장 무거우므로 따로 큰 호흡으로.

### 8.2 별도 흐름 (본 문서 범위 밖)
- Prisma cutover 시리즈 (Edition / Listing / Chronicle 쓰기·읽기 전환)
- 작가 페이지 (`/[locale]/artist/[slug]`)
- 운영자 큐레이션 편집 페이지
- 검색 서버 API + DB 풀텍스트 인덱스

## 9. 검증 체크리스트 (각 PR마다)

- [ ] `pnpm --filter @opus/web typecheck` 클린
- [ ] `pnpm --filter @opus/web lint --max-warnings 0` 클린
- [ ] 로컬 dev에서 `/ko`, `/ja`, `/en` 세 로케일 hero/rail 모두 동일 IA로 렌더
- [ ] `curl -sI` 200 확인
- [ ] **본명·이메일·국적·지갑주소·식별자 직접 노출 없음** (수동 grep)
- [ ] 1차/2차 표기 규칙 위반 단어 grep: `재판매|2차 판매|再販|中古|resale|secondary sale market` → 0건
- [ ] 투자/수익/자산 류 grep: `investment|profit|yield|ROI|trading|투자|수익|자산 증식` → 0건 (기존 합법 사용 제외)

## 10. 보안 / 컴플라이언스 노트

- **ISO 27001 A.18.1.4 (§7) Privacy by Design**: Rail B/C/Search 결과에서 표시되는 작가 이름은 **펜네임 한 가지로 단일화**. `Listing.artistPenName` 스냅샷을 그대로 사용하고, `User.name`(본명)은 **검색 인덱스에 포함하지 않는다**.
- **ISO 27001 A.5.1.1 (§4) 채널 분리**: PRIMARY 카드와 SECONDARY 카드는 시각적·라벨링 양쪽에서 명확히 구분. 같은 그리드에 섞지 않는다 — 항상 별도 레일.
- **ISO 27001 A.12.4.1 (§5) 감사**: ChroniclePreview에 표시되는 from/to 사용자 식별자는 `maskSellerId` 동등 마스킹.
- **APPI / 国外移転**: 검색 인덱스를 외부 SaaS(Algolia 등)에 보내지 **않는다** — MVP는 자체 호스팅 정적 JSON.
- **R-18**: Rail/Search 결과에 `ContentRating.MATURE` 작품이 섞이는 케이스는 별도 게이팅 PR에서 다룬다 (본 문서 범위 밖, 인지만 해둠).

## 11. 참고

- 1차/2차 분리: PR #13 (`feat(ia): separate primary Releases channel from secondary Provenance channel`)
- 데이터 모델: PR #14 (`feat(prisma): land Artwork/Edition/Listing/ChronicleEntry schema`)
- 規約: `.cursorrules` §1 디자인 시스템, §2 표기 규칙
- 거버넌스: `SECURITY_GOVERNANCE.md` §1 PII / §3 인프라 / §5 ISO 통제 표기
