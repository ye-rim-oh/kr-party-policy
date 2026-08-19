import { useCallback, useEffect, useState } from 'react';
import type { AnswerMap, Score, Weight } from './types';

const STORAGE_KEY = 'kr-party-policy/answers/v1';

function read(): AnswerMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    const out: AnswerMap = {};
    for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (!value || typeof value !== 'object') continue;
      const v = value as { score?: unknown; weight?: unknown };
      const score =
        typeof v.score === 'number' && v.score >= 1 && v.score <= 5 ? (v.score as Score) : null;
      const weight = v.weight === 2 || v.weight === 3 ? (v.weight as Weight) : 1;
      out[id] = { score, weight };
    }
    return out;
  } catch {
    return {};
  }
}

/**
 * 설문 응답을 localStorage에 담아 두는 훅.
 * 응답은 브라우저 밖으로 나가지 않는다.
 */
export function useAnswers() {
  const [answers, setAnswers] = useState<AnswerMap>(() => read());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    } catch {
      // 시크릿 모드 등에서 저장이 막혀도 설문 자체는 계속 쓸 수 있게 둔다.
    }
  }, [answers]);

  const setScore = useCallback((id: string, score: Score | null) => {
    setAnswers((prev) => ({ ...prev, [id]: { weight: prev[id]?.weight ?? 1, score } }));
  }, []);

  const setWeight = useCallback((id: string, weight: Weight) => {
    setAnswers((prev) => ({ ...prev, [id]: { score: prev[id]?.score ?? null, weight } }));
  }, []);

  const reset = useCallback(() => setAnswers({}), []);

  return { answers, setScore, setWeight, reset };
}
