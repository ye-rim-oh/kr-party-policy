// 데이터 무결성 검사. 빌드 전에 돌려 잘못된 JSON이 배포되는 것을 막는다.
// 실행: npm run verify:data
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));
const readOptional = (p) => {
  try {
    return read(p);
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
};

const parties = read('src/data/parties.json');
const qfile = read('src/data/questions.json');
const positions = read('src/data/party_positions.json');

const EXPECTED_COUNTS = { A: 6, B: 5, C: 6, D: 6, E: 5, F: 5, G: 4, H: 4, I: 4, J: 3 };
const EXPECTED_TOTAL = Object.values(EXPECTED_COUNTS).reduce((a, b) => a + b, 0);

const failures = [];
const check = (name, condition, detail = '') => {
  if (!condition) failures.push(detail ? `${name} — ${detail}` : name);
  else console.log(`  ok    ${name}`);
};

// 정당
const EXPECTED_PARTIES = 6;
check('정당 6개', parties.length === EXPECTED_PARTIES, `실제 ${parties.length}`);
const partyIds = parties.map((p) => p.id).sort();
check('정당 id 중복 없음', new Set(partyIds).size === parties.length);
check('정당 이름 중복 없음', new Set(parties.map((p) => p.name)).size === parties.length);
check(
  '정당 색상은 6자리 hex',
  parties.every((p) => /^#[0-9A-Fa-f]{6}$/.test(p.color))
);
check(
  '정당 색상 중복 없음',
  new Set(parties.map((p) => p.color.toUpperCase())).size === parties.length
);
check(
  '원내 여부(inAssembly)가 모두 지정됨',
  parties.every((p) => typeof p.inAssembly === 'boolean')
);

// 문항
check(`문항 ${EXPECTED_TOTAL}개`, qfile.questions.length === EXPECTED_TOTAL, `실제 ${qfile.questions.length}`);
check('영역 10개', qfile.categories.length === 10, `실제 ${qfile.categories.length}`);
check('F5 제외됨', !qfile.questions.some((q) => q.id === 'F5'));
check(
  '문항 id 중복 없음',
  new Set(qfile.questions.map((q) => q.id)).size === qfile.questions.length
);
check('척도 1~5 정의됨', [1, 2, 3, 4, 5].every((v) => typeof qfile.scale[String(v)] === 'string'));

const counts = {};
for (const q of qfile.questions) counts[q.category] = (counts[q.category] ?? 0) + 1;
check(
  '영역별 문항 수',
  JSON.stringify(counts) === JSON.stringify(EXPECTED_COUNTS),
  JSON.stringify(counts)
);

const categoryIds = new Set(qfile.categories.map((c) => c.id));
check(
  '모든 문항이 정의된 영역에 속함',
  qfile.questions.every((q) => categoryIds.has(q.category))
);
check(
  '문항 본문 비어있지 않음',
  qfile.questions.every((q) => typeof q.text === 'string' && q.text.trim().length > 0)
);

// 문항을 갈아 끼울 때 questions.md를 함께 고치는 것을 자꾸 잊는다. 2026-08-13에 바꾼
// C5·E4·G3가 이틀 넘게 옛 문구로 남아 있었다. 원본 문서와 데이터가 어긋나면 잡는다.
const questionsMd = readFileSync(join(root, 'questions.md'), 'utf8');
const mdText = new Map();
for (const line of questionsMd.split('\n')) {
  const m = line.match(/^([A-J]\d+)\.\s+(.*)$/);
  if (m) mdText.set(m[1], m[2].trim());
}
const mdDrift = qfile.questions
  .filter((q) => mdText.has(q.id) && mdText.get(q.id) !== q.text)
  .map((q) => q.id);
const mdMissing = qfile.questions.filter((q) => !mdText.has(q.id)).map((q) => q.id);
check(
  'questions.md의 문항 문구가 questions.json과 일치',
  mdDrift.length === 0 && mdMissing.length === 0,
  [mdDrift.length ? `문구 불일치: ${mdDrift.join(', ')}` : '', mdMissing.length ? `md에 없음: ${mdMissing.join(', ')}` : '']
    .filter(Boolean)
    .join(' / ')
);

// 같은 코딩값을 가진 문항이 여럿이면 매칭에서 그 축이 배수로 가중된다. 막지는 않고 알린다.
// 문항 잘못이 아니라 한국 정당 지형에서 우연히 겹친 것일 수 있기 때문이다.
const vectorGroups = new Map();
for (const q of qfile.questions) {
  const row = positions[q.id];
  if (!row) continue;
  const key = partyIds.map((p) => row[p]?.score ?? '-').join(',');
  if (key.includes('-')) continue; // 미조사가 섞인 문항은 세지 않는다
  if (!vectorGroups.has(key)) vectorGroups.set(key, []);
  vectorGroups.get(key).push(q.id);
}
for (const [, ids] of vectorGroups) {
  if (ids.length > 1) console.log(`  주의  코딩값이 같은 문항 ${ids.join(' + ')} — 매칭에서 이 축이 ${ids.length}배로 가중된다`);
}

// 정당 입장
const posKeys = Object.keys(positions);
check(`입장 테이블 키 ${EXPECTED_TOTAL}개`, posKeys.length === EXPECTED_TOTAL, `실제 ${posKeys.length}`);
check(
  '모든 문항 id가 입장 테이블에 있음',
  qfile.questions.every((q) => positions[q.id])
);
check(
  `각 문항마다 정당 ${EXPECTED_PARTIES}개`,
  Object.values(positions).every(
    (row) => JSON.stringify(Object.keys(row).sort()) === JSON.stringify(partyIds)
  )
);

const cells = Object.values(positions).flatMap((row) => Object.values(row));
check(
  '점수는 null이거나 1~5 정수',
  cells.every((c) => c.score === null || (Number.isInteger(c.score) && c.score >= 1 && c.score <= 5))
);
const KINDS = new Set(['party', 'assembly', 'press']);
check(
  'sources는 항상 배열',
  cells.every((c) => Array.isArray(c.sources))
);
check(
  '모든 출처에 종류·제목·URL이 있음',
  cells.every((c) =>
    c.sources.every(
      (s) => KINDS.has(s.kind) && !!s.title && /^https?:\/\//.test(s.url)
    )
  )
);
const PARTY_HOSTS = new Set([
  'policy.nec.go.kr',
  'www.justice21.org',
  'justice21.org',
  'reformparty.kr',
  'www.reformparty.kr',
  'jinboparty.com',
  'www.jinboparty.com',
  'rebuildingkoreaparty.kr',
  'www.rebuildingkoreaparty.kr',
  'www.peoplepowerparty.kr',
  'peoplepowerparty.kr',
  'theminjoo.kr',
  'www.theminjoo.kr'
]);
const sourceHost = (source) => {
  try {
    return new URL(source.url).hostname.toLowerCase();
  } catch {
    return '';
  }
};
check(
  '정당 출처 종류가 공식 정당·선관위 도메인과 일치',
  cells.every((c) =>
    c.sources.every((s) => s.kind !== 'party' || PARTY_HOSTS.has(sourceHost(s)))
  ),
  '언론 기사를 party로 잘못 분류한 출처 발견'
);
check(
  '언론 출처 종류가 공식 정당·선관위 도메인과 겹치지 않음',
  cells.every((c) =>
    c.sources.every((s) => s.kind !== 'press' || !PARTY_HOSTS.has(sourceHost(s)))
  ),
  '공식 정당·선관위 자료를 press로 잘못 분류한 출처 발견'
);
check(
  '출처 날짜는 2020년 이후 YYYY-MM-DD',
  cells.every((c) =>
    c.sources.every((s) => /^20(?:2\d|[3-9]\d)-\d{2}-\d{2}$/.test(s.date))
  ),
  '날짜 누락·형식 오류 또는 2020년 이전 출처 발견'
);
check(
  '위키 출처 없음',
  cells.every((c) =>
    c.sources.every((s) => !/(?:^|\.)(?:namu\.wiki|wikipedia\.org)$/.test(sourceHost(s)))
  ),
  '나무위키 또는 위키백과 출처 발견'
);
check(
  '보관본 링크는 Wayback Machine',
  cells.every((c) =>
    c.sources.every((s) => !s.archived_url || s.archived_url.startsWith('https://web.archive.org/'))
  ),
  'archive.is 등 다른 보관 서비스 발견'
);
// 3(중립·모름)은 척도 정의상 "직접 근거가 없어 단정 불가"도 포함한다. 자료를 찾지 못했다는
// 사실 자체가 근거이므로 출처를 요구하지 않는다. 1/2/4/5는 방향을 주장하는 값이라 출처가 있어야 한다.
check(
  'verified가 true이면 점수가 있어야 하고, 3이 아니면 출처도 있어야 함',
  cells.every((c) => !c.verified || (typeof c.score === 'number' && (c.score === 3 || c.sources.length > 0))),
  '점수 없거나(3이 아닌데) 출처 없는 verified 항목 발견'
);
// 코딩 이유는 화면에 실리는 데이터에 두지 않는다. 배포 번들에 섞여 들어가지 않게 막는다.
check(
  '입장 데이터에 코딩 이유(basis)가 없음',
  cells.every((c) => !('basis' in c)),
  'party_positions.json에서 basis를 발견 — docs/coding_basis.json으로 옮길 것'
);

// 코딩 이유는 별도 문서(docs/coding_basis.json)에 남긴다. 이 파일은 비공개 리서치
// 노트라 저장소에는 없다(.gitignore). 로컬에 있을 때만 완결성을 확인한다.
const basis = readOptional('docs/coding_basis.json');
if (basis) {
  const missingBasis = [];
  for (const q of qfile.questions) {
    for (const p of parties) {
      const cell = positions[q.id]?.[p.id];
      if (cell && typeof cell.score === 'number' && !basis[q.id]?.[p.id]) {
        missingBasis.push(`${q.id}.${p.id}`);
      }
    }
  }
  check(
    '코딩된 칸마다 docs/coding_basis.json에 이유가 있음',
    missingBasis.length === 0,
    `누락: ${missingBasis.join(', ')}`
  );
} else {
  console.log('  skip  docs/coding_basis.json 없음 (비공개 파일) — 완결성 검사 생략');
}

// 언론 보도만으로 코딩한 칸은 막지 않되 눈에 띄게 남긴다. 1차 출처를 찾는 것이 원칙이다.
const pressOnly = cells.filter(
  (c) => c.verified && c.sources.length > 0 && c.sources.every((s) => s.kind === 'press')
).length;
if (pressOnly > 0) console.log(`  주의  언론 보도만으로 코딩한 칸 ${pressOnly}개 — 1차 출처 보강 권장`);
check(
  '점수가 있으면 verified여야 함',
  cells.every((c) => c.score === null || c.verified === true),
  'verified가 아닌데 점수가 채워진 항목 발견'
);
check(
  '확인일 형식 YYYY-MM-DD',
  cells.every((c) => c.last_verified === null || /^\d{4}-\d{2}-\d{2}$/.test(c.last_verified))
);

const verified = cells.filter((c) => c.verified).length;
console.log(`\n조사 진행률: ${verified} / ${cells.length}`);

if (failures.length) {
  console.error('\n검사 실패:');
  for (const f of failures) console.error(`  FAIL  ${f}`);
  process.exit(1);
}
console.log('데이터 검사 통과');
