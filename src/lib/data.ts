import partiesJson from '../data/parties.json';
import questionsJson from '../data/questions.json';
import positionsJson from '../data/party_positions.json';
import type { Category, Party, PositionTable, Question, QuestionFile } from './types';

// JSON을 번들에 직접 포함시킨다. fetch가 없으므로 로딩 상태나 file:// 제약을 다룰 필요가 없고,
// 데이터가 바뀌면 빌드가 다시 돌면서 반영된다.

const questionFile = questionsJson as QuestionFile;

export const parties: Party[] = partiesJson as Party[];
export const questions: Question[] = questionFile.questions;
export const categories: Category[] = questionFile.categories;
export const scale: Record<string, string> = questionFile.scale;
export const positions: PositionTable = positionsJson as PositionTable;

export const partyById = new Map(parties.map((p) => [p.id, p]));
export const categoryById = new Map(categories.map((c) => [c.id, c]));

export interface CategoryGroup {
  category: Category;
  questions: Question[];
}

export const questionGroups: CategoryGroup[] = categories
  .map((category) => ({
    category,
    questions: questions.filter((q) => q.category === category.id)
  }))
  .filter((g) => g.questions.length > 0);

/**
 * 설문과 비교표가 같은 5단계를 쓴다.
 * 정당 쪽의 3은 "당론이 없거나 당내 이견이 병존한다"는 뜻으로 읽는다.
 */
export const scaleLabel: Record<number, string> = {
  1: scale['1'],
  2: scale['2'],
  3: scale['3'],
  4: scale['4'],
  5: scale['5']
};

export const DISCLAIMER =
  '정당이 직접 제출한 답변이 아니며, 강령과 논평, 국회 표결 기록 등을 읽고 매긴 추정치이기 때문에 실제 입장과 어긋날 수 있음.';

export const REPO_URL = 'https://github.com/ye-rim-oh/kr-party-policy';
export const ISSUES_URL = `${REPO_URL}/issues`;
