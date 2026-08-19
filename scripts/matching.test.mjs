// 매칭 산식 테스트.
// 실행: node --experimental-strip-types --test scripts/matching.test.mjs
// matching.ts는 타입 전용 import만 쓰므로 Node의 타입 스트리핑으로 그대로 불러올 수 있다.
import test from 'node:test';
import assert from 'node:assert/strict';

import { computeMatch, countVerified, divergence, questionAgreement } from '../src/lib/matching.ts';

const parties = [
  { id: 'a', name: 'A당', short: 'A', color: '#111111' },
  { id: 'b', name: 'B당', short: 'B', color: '#222222' },
  { id: 'c', name: 'C당', short: 'C', color: '#333333' }
];

const questions = [
  { id: 'Q1', category: 'X', text: '문항 1' },
  { id: 'Q2', category: 'X', text: '문항 2' },
  { id: 'Q3', category: 'Y', text: '문항 3' }
];

const v = (score) => ({
  score,
  verified: true,
  source_url: 'https://example.org/a',
  last_verified: '2026-08-05'
});
const unset = { score: null, verified: false, source_url: '', last_verified: null };

const positions = {
  Q1: { a: v(5), b: v(1), c: unset },
  Q2: { a: v(4), b: v(2), c: unset },
  Q3: { a: v(1), b: v(5), c: unset }
};

const answers = {
  Q1: { score: 5, weight: 1 },
  Q2: { score: 4, weight: 3 },
  Q3: { score: 1, weight: 2 }
};

const byId = (results) => Object.fromEntries(results.map((r) => [r.partyId, r]));

test('완전히 일치하면 100점', () => {
  const { results } = computeMatch(answers, positions, parties, questions);
  assert.equal(byId(results).a.score, 100);
  assert.equal(byId(results).a.comparedCount, 3);
});

test('가중 맨해튼 거리를 정확히 환산한다', () => {
  // b: Q1 d=4 w=1 → 4 / Q2 d=2 w=3 → 6 / Q3 d=4 w=2 → 8 ; Σwd=18, Σw=6 → 1 − 18/24 = 0.25
  const { results } = computeMatch(answers, positions, parties, questions);
  assert.equal(byId(results).b.score, 25);
});

test('모든 문항이 정반대면 0점', () => {
  const { results } = computeMatch(
    { Q1: { score: 1, weight: 1 }, Q2: { score: 1, weight: 2 }, Q3: { score: 5, weight: 3 } },
    { Q1: { a: v(5) }, Q2: { a: v(5) }, Q3: { a: v(1) } },
    [parties[0]],
    questions
  );
  assert.equal(results[0].score, 0);
});

test('입장이 미조사인 정당은 0이나 50이 아니라 null', () => {
  const { results } = computeMatch(answers, positions, parties, questions);
  const c = byId(results).c;
  assert.equal(c.score, null);
  assert.equal(c.comparedCount, 0);
  assert.deepEqual(c.categories, {});
});

test('건너뛴 문항은 계산에서 빠진다', () => {
  const { results, answeredCount } = computeMatch(
    { Q1: { score: null, weight: 1 }, Q2: { score: 4, weight: 1 } },
    positions,
    parties,
    questions
  );
  assert.equal(answeredCount, 1);
  assert.equal(byId(results).a.comparedCount, 1);
  assert.equal(byId(results).a.score, 100);
});

test('응답이 하나도 없으면 모든 정당이 null', () => {
  const { results, answeredCount } = computeMatch({}, positions, parties, questions);
  assert.equal(answeredCount, 0);
  assert.ok(results.every((r) => r.score === null));
});

test('영역별로 따로 계산한다', () => {
  const { results } = computeMatch(answers, positions, parties, questions);
  assert.deepEqual(byId(results).a.categories.X, { score: 100, comparedCount: 2 });
  assert.deepEqual(byId(results).a.categories.Y, { score: 100, comparedCount: 1 });
});

test('점수 내림차순으로 정렬하고 산출 불가는 뒤로 보낸다', () => {
  const { results } = computeMatch(answers, positions, parties, questions);
  assert.deepEqual(
    results.map((r) => r.partyId),
    ['a', 'b', 'c']
  );
});

// verified가 false면 점수가 들어 있어도 계산에서 뺀다.
// 출처 유무는 여기서 보지 않는다. 3(중립·모름)은 출처 없이도 코딩할 수 있고
// 매칭에도 들어가기 때문이다. 출처 규칙은 scripts/verify-data.mjs가 검사한다.
test('verified가 아닌 항목은 점수가 있어도 쓰지 않는다', () => {
  const noVerify = { Q1: { a: { ...v(5), verified: false } } };
  const { results } = computeMatch({ Q1: { score: 5, weight: 1 } }, noVerify, [parties[0]], [
    questions[0]
  ]);
  assert.equal(results[0].score, null);
});

// 3은 출처가 없어도 매칭에 들어간다. "모른다"가 "중립"으로 취급된다는 뜻이라
// 의도된 동작임을 테스트로 고정해 둔다.
test('출처가 없는 3도 매칭에 들어간다', () => {
  const neutral = { Q1: { a: { score: 3, sources: [], last_verified: null, verified: true } } };
  const { results } = computeMatch({ Q1: { score: 3, weight: 1 } }, neutral, [parties[0]], [
    questions[0]
  ]);
  assert.equal(results[0].score, 100);
  assert.equal(results[0].comparedCount, 1);
});

test('조사 진행률을 센다', () => {
  const { verified, total } = countVerified(positions, questions, parties);
  assert.equal(total, 9);
  assert.equal(verified, 6);
});

test('일치 문항과 충돌 문항을 가른다', () => {
  const { agree, conflict } = questionAgreement(answers, positions, 'b', questions);
  assert.deepEqual(
    agree.map((r) => r.question.id),
    []
  );
  // Q1(5↔1)과 Q3(1↔5)은 거리 4로 충돌, Q2(4↔2)는 거리 2라 어느 쪽도 아니다.
  assert.deepEqual(
    conflict.map((r) => r.question.id),
    ['Q1', 'Q3']
  );
});

test('쟁점 지표는 입장이 갈릴수록 크다', () => {
  const spread = divergence(positions, 'Q1', parties); // 5 vs 1
  const narrow = divergence(positions, 'Q2', parties); // 4 vs 2
  assert.ok(spread !== null && narrow !== null);
  assert.ok(spread > narrow);
  assert.equal(divergence(positions, 'Q1', [parties[2]]), null);
});
