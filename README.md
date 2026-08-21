# 한국 정당 정책 비교 (kr-party-policy)

한국 주요 6개 정당(더불어민주당·국민의힘·조국혁신당·개혁신당·진보당·정의당)의 정책 입장을 10개 영역 48문항으로 비교하는 웹 애플리케이션입니다. 이용자가 같은 문항에 응답하면 정당별 정책 근접도(정당 매칭)를 계산합니다.

정의당은 2024년 총선에서 의석을 얻지 못해 현재 원외입니다. 강령과 표결 기록이 남아 있어 비교표에 포함하되, "원외" 배지를 달아 구분합니다.
https://ye-rim-oh.github.io/kr-party-policy/

| 화면 | 내용 |
|---|---|
| 개요 `/` | 프로젝트 소개, 다루는 영역 |
| 정책 비교 `/#/compare` | 문항별 정당 입장 병렬 대조. 영역·정당 필터, 문항 검색, 쟁점 순 정렬 |
| 정당 매칭 `/#/match` | 48문항 응답 → 정당별 근접도 0~100, 영역별 분해, 문항별 일치/충돌 대조 |
| 방법론 `/#/about` | 문항 설계, 코딩 기준, 매칭 산식, 한계 고지 |

입장이 3(중립·모름)인 칸은 "당론이 없다", "당내 이견이 병존한다", "이 쟁점을 직접 다룬 자료가 없다"를 함께 뜻하며 매칭 계산에 포함됩니다. 문항별 출처는 비교 화면에서 각 입장을 클릭하면 볼 수 있습니다.

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

## 라이선스

MIT License. `LICENSE` 참고.

## 면책 고지

여기 실린 입장은 정당이 직접 제출한 답변이 아닙니다. 제작자가 강령과 논평, 국회 표결 기록을 읽고 매긴 추정치라서 실제 입장과 어긋날 수 있습니다. 
