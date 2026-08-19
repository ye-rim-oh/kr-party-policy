# 한국 정당 정책 비교 (kr-party-policy)

한국 주요 6개 정당(더불어민주당·국민의힘·조국혁신당·개혁신당·진보당·정의당)의 정책 입장을
10개 영역 48문항으로 비교하는 웹 애플리케이션입니다. 이용자가 같은 문항에 응답하면
정당별 정책 근접도(정당 매칭)를 계산합니다.

정의당은 2024년 총선에서 의석을 얻지 못해 현재 원외입니다. 강령과 표결 기록이 남아 있어
비교표에 포함하되, "원외" 배지를 달아 구분합니다.

| 화면 | 내용 |
|---|---|
| 개요 `/` | 프로젝트 소개, 다루는 영역 |
| 정책 비교 `/#/compare` | 문항별 정당 입장 병렬 대조. 영역·정당 필터, 문항 검색, 쟁점 순 정렬 |
| 정당 매칭 `/#/match` | 48문항 응답 → 정당별 근접도 0~100, 영역별 분해, 문항별 일치/충돌 대조 |
| 방법론 `/#/about` | 문항 설계, 코딩 기준, 매칭 산식, 한계 고지 |

입장이 3(중립·모름)인 칸은 "당론이 없다", "당내 이견이 병존한다", "이 쟁점을 직접 다룬
자료가 없다"를 함께 뜻하며 매칭 계산에 포함됩니다. 자료를 아예 찾지 못한 칸은
"미조사"로 표시되고 매칭 계산에서 제외됩니다. 문항별 출처는 비교 화면에서 각 입장을
클릭하면 볼 수 있습니다.

## 기술 스택

- Vite + React 19 + TypeScript — 빌드 후 정적 파일로 배포
- 라우팅: `HashRouter` (GitHub Pages는 임의 경로 리라이트를 지원하지 않음)
- 데이터: JSON을 번들에 직접 import. 런타임 fetch 없음
- 서체: Pretendard Variable (동적 서브셋)
- 외부 CDN·분석 도구·서버·데이터베이스 없음. 이용자 응답은 `localStorage`에만 저장됩니다.

## 개발

```bash
npm install
npm run dev
```

| 명령 | 내용 |
|---|---|
| `npm run dev` | 개발 서버 — <http://localhost:5173> |
| `npm run build` | 타입 검사 + 프로덕션 빌드 (`dist/`) |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run verify:data` | 데이터 무결성 검사 |
| `npm test` | 매칭 산식 테스트 |
| `npm run verify` | 위 셋을 한 번에 |

## 디렉터리 구조

```
.
├── src/
│   ├── main.tsx                 # 라우팅 진입점
│   ├── components/               # Layout, Stance, Result, Sentences
│   ├── pages/                    # Home, Compare, Match, About, NotFound
│   ├── lib/                      # 데이터 로딩, 매칭 산식, 훅, 타입
│   ├── data/
│   │   ├── parties.json          # 정당 메타(이름, 색상)
│   │   ├── questions.json        # 문항, 영역, 척도
│   │   └── party_positions.json  # 정당별 문항 코딩값, 출처
│   └── styles/
├── scripts/
│   ├── verify-data.mjs           # 데이터 검사
│   └── matching.test.mjs         # 산식 테스트
└── .github/workflows/deploy.yml
```

## 데이터 갱신 방법

`src/data/party_positions.json`의 항목을 직접 편집합니다.

```json
"A1": {
  "dp": {
    "score": 5,
    "sources": [
      {
        "kind": "assembly",
        "title": "2025년 개정세법 심의 결과 및 주요 내용 (나보포커스 제129호)",
        "url": "https://www.nabo.go.kr/board/file/bulkDown.do?idx=9004&bid=68",
        "publisher": "국회예산정책처",
        "date": "2025-12-04"
      }
    ],
    "last_verified": "2026-08-06",
    "verified": true
  }
}
```

`kind`는 출처 종류입니다. `party`는 정당 공식 자료, `assembly`는 국회 기록, `press`는 언론
보도이며 화면에는 각각 당·국·보로 표시됩니다.

규칙:

1. `sources`가 비어 있으면 `verified`를 `true`로 바꾸지 않습니다. `npm run verify:data`가
   이를 검사해 빌드를 막습니다.
2. 1차 출처는 정당 공식 자료(강령·논평·공약집)와 국회 표결 기록입니다. 언론 보도는 1차 출처를
   찾지 못했을 때 보조로 씁니다.
3. 추정값은 쓰지 않습니다. 해당 쟁점을 직접 다룬 자료가 없으면 3(중립·모름)으로 두고,
   자료를 아예 찾지 못한 항목은 미조사로 비워 둡니다.

문항이나 정당을 추가·수정할 때도 컴포넌트를 건드릴 필요가 없습니다. JSON만 갱신하면
화면·계산·검사가 함께 따라갑니다.

## 배포

`main` 브랜치에 푸시하면 GitHub Actions가 데이터 검사 → 산식 테스트 → 빌드를 거쳐 Pages에
배포합니다 (`.github/workflows/deploy.yml`). 저장소 Settings → Pages → Source가
**GitHub Actions**로 지정되어 있어야 합니다.

경로가 `/kr-party-policy/` 하위이므로 `vite.config.ts`의 `base`가 저장소 이름과 일치해야
합니다. 저장소 이름을 바꾸면 이 값도 함께 바꿔 주세요.

## 디자인 노트

- 사이트 브랜드 색이 없습니다. 바탕은 흰색, 구조는 무채색입니다.
- 유채색은 정당 구분(각 당 공식색)과 찬반 방향(찬성 파랑, 반대 빨강, 중립 회색)에만 씁니다.
  비교표에 범례를 답니다.
- 스탯 타일, 게이지, 진행 미터 없이 인쇄물에 가까운 레이아웃입니다. 구획은 1px 괘선과
  여백으로 나눕니다.
- 한글은 `word-break: keep-all`로 어절 단위로 줄바꿈하고, 설명문은 `<Sentences>` 컴포넌트가
  문장 단위로 다시 감싸 문장 중간에서 줄이 바뀌지 않게 합니다.
- 다크 모드는 시스템 설정을 따릅니다.

## 라이선스

MIT License. `LICENSE` 참고.

## 면책 고지

여기 실린 입장은 정당이 직접 제출한 답변이 아닙니다. 제작자가 강령과 논평, 국회 표결 기록을
읽고 매긴 추정치라서 실제 입장과 어긋날 수 있습니다. 어느 정당을 지지하거나 반대할 뜻은
없습니다.

코딩값이 실제와 다르다고 보시면 [이슈](https://github.com/ye-rim-oh/kr-party-policy/issues)로 알려주십시오.
