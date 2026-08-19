import type {
  AnswerMap,
  MatchOutcome,
  Party,
  PositionTable,
  Question,
  CategoryResult,
  Answer,
  Position
} from './types';

// 산식: 중요도 가중 맨해튼 거리(weighted Manhattan distance)를 0~100으로 환산
//
//   d_i = |사용자 응답_i − 정당 코딩값_i|      (0 ~ 4)
//   근접도 = (1 − Σ(w_i · d_i) / Σ(w_i · 4)) × 100
//
// 비교 대상은 (1) 사용자가 1~5로 응답했고 (2) 해당 정당의 입장이 verified === true 이며
// 숫자 score를 가진 문항으로 한정한다. 비교 가능한 문항이 하나도 없으면 점수는 null이며,
// 0이나 50 같은 값으로 대체하지 않는다.

export const MAX_DIFF = 4;

export function isAnswered(answer: Answer | undefined): boolean {
  return (
    !!answer &&
    typeof answer.score === 'number' &&
    Number.isFinite(answer.score) &&
    answer.score >= 1 &&
    answer.score <= 5
  );
}

export function isUsablePosition(cell: Position | undefined): boolean {
  return (
    !!cell &&
    cell.verified === true &&
    typeof cell.score === 'number' &&
    Number.isFinite(cell.score) &&
    cell.score >= 1 &&
    cell.score <= 5
  );
}

interface Accumulator {
  diffSum: number;
  weightSum: number;
  comparedCount: number;
}

function emptyAcc(): Accumulator {
  return { diffSum: 0, weightSum: 0, comparedCount: 0 };
}

function summarize(acc: Accumulator): CategoryResult {
  if (acc.comparedCount === 0 || acc.weightSum === 0) {
    return { score: null, comparedCount: 0 };
  }
  const similarity = (1 - acc.diffSum / (acc.weightSum * MAX_DIFF)) * 100;
  const clamped = Math.min(100, Math.max(0, similarity));
  return { score: Math.round(clamped * 10) / 10, comparedCount: acc.comparedCount };
}

export function computeMatch(
  answers: AnswerMap,
  positions: PositionTable,
  parties: Party[],
  questions: Question[]
): MatchOutcome {
  const answered = questions.filter((q) => isAnswered(answers[q.id]));

  const results = parties.map((party) => {
    const overall = emptyAcc();
    const byCategory = new Map<string, Accumulator>();

    for (const q of answered) {
      const cell = positions[q.id]?.[party.id];
      if (!isUsablePosition(cell)) continue;

      const answer = answers[q.id];
      const w = answer.weight;
      const d = Math.abs((answer.score as number) - (cell.score as number));

      overall.diffSum += w * d;
      overall.weightSum += w;
      overall.comparedCount += 1;

      let cat = byCategory.get(q.category);
      if (!cat) {
        cat = emptyAcc();
        byCategory.set(q.category, cat);
      }
      cat.diffSum += w * d;
      cat.weightSum += w;
      cat.comparedCount += 1;
    }

    const categories: Record<string, CategoryResult> = {};
    for (const [catId, acc] of byCategory) categories[catId] = summarize(acc);

    return { partyId: party.id, name: party.name, color: party.color, ...summarize(overall), categories };
  });

  results.sort((a, b) => {
    if (a.score === null && b.score === null) return 0;
    if (a.score === null) return 1;
    if (b.score === null) return -1;
    return b.score - a.score;
  });

  return { answeredCount: answered.length, results };
}

/**
 * 결과 화면의 "일치·불일치 문항" 목록을 만든다.
 * 거리가 0~1이면 일치, 3~4면 충돌로 본다.
 */
export function questionAgreement(
  answers: AnswerMap,
  positions: PositionTable,
  partyId: string,
  questions: Question[]
) {
  const rows: { question: Question; userScore: number; partyScore: number; diff: number }[] = [];
  for (const q of questions) {
    const answer = answers[q.id];
    const cell = positions[q.id]?.[partyId];
    if (!isAnswered(answer) || !isUsablePosition(cell)) continue;
    const userScore = answer.score as number;
    const partyScore = cell.score as number;
    rows.push({ question: q, userScore, partyScore, diff: Math.abs(userScore - partyScore) });
  }
  return {
    agree: rows.filter((r) => r.diff <= 1).sort((a, b) => a.diff - b.diff),
    conflict: rows.filter((r) => r.diff >= 3).sort((a, b) => b.diff - a.diff)
  };
}

/** 전체 칸(문항 × 정당) 중 근거가 확인된 칸 수 */
export function countVerified(
  positions: PositionTable,
  questions: Question[],
  parties: Party[]
): { verified: number; total: number; ratio: number } {
  let total = 0;
  let verified = 0;
  for (const q of questions) {
    for (const p of parties) {
      total += 1;
      if (isUsablePosition(positions[q.id]?.[p.id])) verified += 1;
    }
  }
  return { verified, total, ratio: total === 0 ? 0 : verified / total };
}

/** 문항별로 정당 간 입장이 얼마나 갈리는지(표준편차 유사 지표). 조사 완료 후 "쟁점 문항" 정렬에 쓴다. */
export function divergence(positions: PositionTable, questionId: string, parties: Party[]): number | null {
  const scores: number[] = [];
  for (const p of parties) {
    const cell = positions[questionId]?.[p.id];
    if (isUsablePosition(cell)) scores.push(cell.score as number);
  }
  if (scores.length < 2) return null;
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((a, b) => a + (b - mean) ** 2, 0) / scores.length;
  return Math.sqrt(variance);
}
