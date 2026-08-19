// docs/findings/*.json에 쌓인 조사 결과를 데이터에 반영한다.
//
// 세션이 중간에 끊겨도 작업이 남도록 만든 장치다. 조사한 사람(사람이든 에이전트든)은
// 찾는 대로 docs/findings/에 파일을 떨어뜨리기만 하면 되고, 반영은 이 스크립트가 한다.
// 이미 반영된 파일은 applied/로 옮겨지므로 몇 번을 다시 돌려도 결과가 같다.
//
//   node scripts/apply-findings.mjs          반영
//   node scripts/apply-findings.mjs --dry    검사만 (파일을 쓰지 않음)
//
// 파일 형식은 docs/findings/README.md 참고.

import { readFileSync, writeFileSync, readdirSync, mkdirSync, renameSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const findingsDir = join(root, 'docs/findings');
const appliedDir = join(findingsDir, 'applied');
const dry = process.argv.includes('--dry');

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
const writeJson = (p, v) => writeFileSync(p, JSON.stringify(v, null, 2) + '\n', 'utf8');

const positions = readJson(join(root, 'src/data/party_positions.json'));
const basisFile = readJson(join(root, 'docs/coding_basis.json'));
const partyIds = readJson(join(root, 'src/data/parties.json')).map((p) => p.id);
const questionIds = readJson(join(root, 'src/data/questions.json')).questions.map((q) => q.id);

const KINDS = new Set(['party', 'assembly', 'press']);
const LANE_RANK = { press: 0, party: 1, assembly: 2 }; // 국회 기록이 가장 단단하다

// 출처 종류는 주소로 정해진다. 조사한 사람이 잘못 적어도 여기서 바로잡는다.
// 정당 게시판 글을 press로 적어 오는 실수가 실제로 있었다.
const PARTY_HOSTS = [
  'justice21.org',
  'jinboparty.com',
  'reformparty.kr',
  'rebuildingkoreaparty.kr',
  'theminjoo.kr',
  'peoplepowerparty.kr',
  'policy.nec.go.kr' // 선관위에 정당이 직접 제출한 정당정책
];
function kindFromUrl(url, fallback) {
  let host;
  try {
    host = new URL(url).host;
  } catch {
    return fallback;
  }
  if (host.endsWith('likms.assembly.go.kr')) return 'assembly';
  if (PARTY_HOSTS.some((h) => host === h || host.endsWith('.' + h))) return 'party';
  return fallback === 'assembly' ? 'press' : fallback;
}

const notes = [];
const today = new Date().toISOString().slice(0, 10);

const files = existsSync(findingsDir)
  ? readdirSync(findingsDir)
      .filter((f) => f.endsWith('.json'))
      .sort()
  : [];

if (files.length === 0) {
  console.log('docs/findings에 반영할 파일이 없다.');
  process.exit(0);
}

let filled = 0;
let enriched = 0;
let referenced = 0;
const appliedFiles = [];

for (const file of files) {
  const path = join(findingsDir, file);
  let doc;
  try {
    doc = readJson(path);
  } catch (e) {
    notes.push(`${file}: JSON 파싱 실패 — ${e.message}. 건너뜀`);
    continue;
  }
  const lane = doc.lane;
  if (!LANE_RANK.hasOwnProperty(lane)) {
    notes.push(`${file}: lane이 party/assembly/press 중 하나여야 한다 (받은 값: ${lane}). 건너뜀`);
    continue;
  }

  let fileTouched = false;

  for (const [qid, byParty] of Object.entries(doc.cells ?? {})) {
    if (!questionIds.includes(qid)) {
      notes.push(`${file}: 알 수 없는 문항 ${qid}`);
      continue;
    }
    for (const [pid, cell] of Object.entries(byParty)) {
      const tag = `${qid}.${pid}`;
      if (!partyIds.includes(pid)) {
        notes.push(`${file}: 알 수 없는 정당 ${tag}`);
        continue;
      }

      const sources = (cell.sources ?? []).filter((s) => {
        const ok = s && KINDS.has(s.kind) && s.title && /^https?:\/\//.test(s.url ?? '');
        if (!ok) notes.push(`${file}: ${tag} 출처 형식이 잘못돼 버림`);
        return ok;
      });
      if (sources.length === 0) {
        notes.push(`${file}: ${tag} 쓸 수 있는 출처가 없어 건너뜀`);
        continue;
      }
      for (const s of sources) {
        const want = kindFromUrl(s.url, s.kind);
        if (want !== s.kind) {
          notes.push(`${file}: ${tag} 출처 종류를 ${s.kind} → ${want}로 바로잡음 (${s.title.slice(0, 40)})`);
          s.kind = want;
        }
      }

      const cur = positions[qid][pid];
      const already = new Set(cur.sources.map((s) => s.url));
      const fresh = sources.filter((s) => !already.has(s.url));

      // 출처만 보태는 경우.
      // 아직 코딩되지 않은 칸에도 붙일 수 있다. 찾아는 봤지만 찬반을 단정할 근거가 못 된
      // 자료를 참고용으로 남겨 두는 것이다. 점수가 없으니 매칭 계산에는 들어가지 않고,
      // 화면에는 "미조사" 옆에 참고자료 표식으로 나온다.
      if (cell.addSourcesOnly === true || typeof cell.score !== 'number') {
        if (fresh.length === 0) continue;
        cur.sources.push(...fresh);
        if (typeof cur.score === 'number') {
          cur.last_verified = today;
          enriched += 1;
        } else {
          referenced += 1;
        }
        fileTouched = true;
        continue;
      }

      // 새로 코딩하는 경우
      if (!Number.isInteger(cell.score) || cell.score < 1 || cell.score > 5) {
        notes.push(`${file}: ${tag} 점수가 1~5 정수가 아님 (${cell.score})`);
        continue;
      }
      if (!cell.basis || cell.basis.length < 20) {
        notes.push(`${file}: ${tag} 코딩 이유가 없거나 너무 짧음`);
        continue;
      }

      if (typeof cur.score === 'number') {
        // 이미 채워진 칸은 덮어쓰지 않는다. 사람이 판단할 문제다.
        if (cur.score !== cell.score) {
          const curLane = Math.max(...cur.sources.map((s) => LANE_RANK[s.kind] ?? 0));
          notes.push(
            `주의  ${tag} 기존 ${cur.score} vs 새 ${cell.score} — 기존 유지. ` +
              `기존 최상위 출처 ${Object.keys(LANE_RANK)[curLane]}, 새 출처 ${lane}. 직접 확인할 것`
          );
        }
        if (fresh.length > 0) {
          cur.sources.push(...fresh);
          cur.last_verified = today;
          enriched += 1;
          fileTouched = true;
        }
        continue;
      }

      positions[qid][pid] = {
        score: cell.score,
        sources,
        last_verified: today,
        verified: true
      };
      basisFile[qid] ??= {};
      basisFile[qid][pid] = cell.basis;
      filled += 1;
      fileTouched = true;
    }
  }

  if (fileTouched || (doc.cells && Object.keys(doc.cells).length > 0)) appliedFiles.push(file);
}

console.log(`새로 코딩 ${filled}칸, 출처 보강 ${enriched}칸, 미조사 칸 참고자료 ${referenced}칸`);
if (notes.length) {
  console.log('\n--- 확인 필요 ---');
  for (const n of notes) console.log('  ' + n);
}

if (dry) {
  console.log('\n(--dry 이므로 아무것도 쓰지 않았다)');
  process.exit(0);
}

writeJson(join(root, 'src/data/party_positions.json'), positions);
writeJson(join(root, 'docs/coding_basis.json'), basisFile);

// 반영이 끝난 파일은 applied/로 옮긴다. 다시 돌려도 두 번 반영되지 않는다.
mkdirSync(appliedDir, { recursive: true });
for (const file of appliedFiles) renameSync(join(findingsDir, file), join(appliedDir, file));
console.log(`\n반영 완료. ${appliedFiles.length}개 파일을 docs/findings/applied/로 옮겼다.`);
