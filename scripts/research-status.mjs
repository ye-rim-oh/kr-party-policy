// 남은 조사 대상을 계산해 보여 준다. 새 세션의 첫 명령으로 쓴다.
//
//   node scripts/research-status.mjs           요약 + 빈 칸 목록
//   node scripts/research-status.mjs --thin    출처 종류가 하나뿐인 칸까지
//   node scripts/research-status.mjs --json    기계가 읽을 형태로
//
// 진행 상황을 따로 적어 두지 않는다. 항상 데이터에서 계산하므로 낡을 수가 없다.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));

const positions = readJson('src/data/party_positions.json');
const parties = readJson('src/data/parties.json');
const qfile = readJson('src/data/questions.json');
const wantJson = process.argv.includes('--json');
const wantThin = process.argv.includes('--thin');

const empty = [];
const thin = [];
const byCategory = {};

for (const q of qfile.questions) {
  const cat = (byCategory[q.category] ??= { total: 0, done: 0 });
  for (const p of parties) {
    const cell = positions[q.id]?.[p.id];
    cat.total += 1;
    if (typeof cell?.score !== 'number') {
      empty.push({ q: q.id, party: p.id, text: q.text });
      continue;
    }
    cat.done += 1;
    const kinds = [...new Set(cell.sources.map((s) => s.kind))];
    if (kinds.length < 2) thin.push({ q: q.id, party: p.id, kinds });
  }
}

const total = parties.length * qfile.questions.length;
const done = total - empty.length;

if (wantJson) {
  console.log(JSON.stringify({ done, total, empty, thin }, null, 2));
  process.exit(0);
}

console.log(`조사 진행률: ${done} / ${total}\n`);

const catName = Object.fromEntries(qfile.categories.map((c) => [c.id, c.name]));
for (const [id, v] of Object.entries(byCategory)) {
  const bar = '█'.repeat(Math.round((v.done / v.total) * 20)).padEnd(20, '·');
  console.log(`  ${id} ${catName[id].padEnd(14)} ${bar} ${String(v.done).padStart(2)} / ${v.total}`);
}

// 한 문항을 통째로 잡는 편이 효율적이므로 문항 단위로 묶어 보여 준다.
const grouped = {};
for (const e of empty) (grouped[e.q] ??= { text: e.text, parties: [] }).parties.push(e.party);

console.log(`\n빈 칸 ${empty.length}개 — 남은 정당이 많은 문항부터:\n`);
const rows = Object.entries(grouped).sort((a, b) => b[1].parties.length - a[1].parties.length);
for (const [qid, v] of rows) {
  console.log(`  ${qid.padEnd(3)} ${String(v.parties.length)}칸  ${v.text}`);
  console.log(`      ${v.parties.join(' ')}`);
}

if (wantThin) {
  console.log(`\n출처 종류가 하나뿐인 칸 ${thin.length}개 — 다른 레인의 출처를 붙일 대상:\n`);
  const g = {};
  for (const t of thin) (g[t.kinds[0]] ??= []).push(`${t.q}.${t.party}`);
  for (const [kind, list] of Object.entries(g)) console.log(`  ${kind} 뿐: ${list.join(' ')}`);
} else {
  console.log(`\n출처 종류가 하나뿐인 칸 ${thin.length}개 (--thin 으로 목록 확인)`);
}
