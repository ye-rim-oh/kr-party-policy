export type Score = 1 | 2 | 3 | 4 | 5;

export interface Party {
  id: string;
  name: string;
  short: string;
  color: string;
  /** 현재 국회 의석 보유 여부. 정의당은 2024년 총선 이후 원외다. */
  inAssembly: boolean;
}

export interface Question {
  id: string;
  category: string;
  text: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface QuestionFile {
  scale: Record<string, string>;
  categories: Category[];
  questions: Question[];
}

/**
 * 출처의 종류. 정당이 직접 낸 자료와 국회 공식 기록을 1차 출처로 보고,
 * 언론 보도는 1차 출처를 찾지 못했을 때 쓰는 보조 자료로 본다.
 */
export type SourceKind = 'party' | 'assembly' | 'press';

export interface Source {
  kind: SourceKind;
  /** 문서·기사 제목 */
  title: string;
  url: string;
  /** 언론사명, 기관명 등 */
  publisher?: string;
  /** YYYY-MM-DD */
  date?: string;
  /**
   * 원문이 사라질 때를 대비한 보관본. Wayback Machine(web.archive.org)을 쓴다.
   * archive.is는 국내 접속이 자주 막히고 운영 주체가 불투명해 쓰지 않는다.
   * 조사 속도를 늦추지 않도록 지금은 비워 두고, 조사를 마친 뒤 일괄로 채운다.
   */
  archived_url?: string;
}

/**
 * 화면에 실리는 입장 데이터. 코딩 이유(basis) 서술은 여기 두지 않고 비공개 노트에만 둔다.
 */
export interface Position {
  score: number | null;
  sources: Source[];
  last_verified: string | null;
  verified: boolean;
}

/** 문항 ID → 정당 ID → 입장 */
export type PositionTable = Record<string, Record<string, Position>>;

export type Weight = 1 | 2 | 3;

export interface Answer {
  /** null이면 건너뛴 문항 */
  score: Score | null;
  weight: Weight;
}

export type AnswerMap = Record<string, Answer>;

export interface CategoryResult {
  score: number | null;
  comparedCount: number;
}

export interface PartyResult extends CategoryResult {
  partyId: string;
  name: string;
  color: string;
  categories: Record<string, CategoryResult>;
}

export interface MatchOutcome {
  answeredCount: number;
  results: PartyResult[];
}
