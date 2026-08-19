import { scaleLabel } from '../lib/data';
import { isUsablePosition } from '../lib/matching';
import type { Position, Source, SourceKind } from '../lib/types';

const KIND_MARK: Record<SourceKind, string> = {
  party: '당',
  assembly: '국',
  press: '보'
};

const KIND_NAME: Record<SourceKind, string> = {
  party: '정당 공식 자료',
  assembly: '국회 기록',
  press: '언론 보도'
};

/** 면을 칠할 때 쓰는 색. 찬성 쪽은 파랑, 반대 쪽은 빨강, 중립은 회색. */
export const TONE: Record<number, string> = {
  1: 'var(--against-2)',
  2: 'var(--against-1)',
  3: 'var(--mid)',
  4: 'var(--for-1)',
  5: 'var(--for-2)'
};

/** 글자에 쓰는 색. 대비를 맞추려 같은 계열을 어둡힌 값이다. */
export const TONE_INK: Record<number, string> = {
  1: 'var(--against-2-ink)',
  2: 'var(--against-1-ink)',
  3: 'var(--mid-ink)',
  4: 'var(--for-1-ink)',
  5: 'var(--for-2-ink)'
};

/**
 * 5칸짜리 눈금. 해당 위치의 칸만 채워 어느 쪽에 얼마나 가까운지 한눈에 보이게 한다.
 * 왼쪽이 반대, 오른쪽이 찬성이다.
 */
export function ScaleMark({ score }: { score: number }) {
  return (
    <span className="mark" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((v) => (
        <i key={v} style={v === score ? { background: TONE[score] } : undefined} />
      ))}
    </span>
  );
}

/** 출처 표식 줄. 당·국·보 한 글자씩. */
function Sources({ sources, hint }: { sources: Source[]; hint?: string }) {
  if (sources.length === 0) return null;
  return (
    <span className="stance__srcs">
      {sources.map((s) => (
        <a
          key={s.url}
          className={`stance__src stance__src--${s.kind}`}
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          title={`${hint ?? KIND_NAME[s.kind]} — ${s.title}${s.publisher ? ` (${s.publisher})` : ''}${s.date ? `, ${s.date}` : ''}`}
        >
          {KIND_MARK[s.kind]}
        </a>
      ))}
    </span>
  );
}

/**
 * 한 정당의 한 문항 입장. 눈금 → 답변 → 출처 순으로 쌓는다.
 *
 * 아직 코딩하지 못한 칸도 "중립·모름"으로 보인다. 척도의 3이 "공식 입장 없음, 당내 이견
 * 병존, 찬반을 단정할 수 없음"을 뜻하므로 "아직 판단하지 못했다"도 여기 들어간다.
 * 다만 코딩된 3과 달리 점수가 없어 매칭 계산에서는 빠지고, 붙어 있는 출처가 있다면
 * 찬반을 정하는 근거가 아니라 참고자료다.
 */
export function Stance({ cell }: { cell: Position | undefined }) {
  if (!isUsablePosition(cell)) {
    const refs = cell?.sources ?? [];
    return (
      <span className="stance stance--none" title="근거 자료를 찾지 못해 판단을 보류한 칸">
        <ScaleMark score={3} />
        <span className="stance__label" style={{ color: TONE_INK[3] }}>
          {scaleLabel[3]}
        </span>
        <Sources sources={refs} hint="참고자료" />
      </span>
    );
  }

  const score = cell!.score as number;
  // 코딩 이유는 화면에 싣지 않는다. 확인일까지만 보인다.
  const title = cell!.last_verified ? `확인일 ${cell!.last_verified}` : undefined;

  return (
    <span className="stance" title={title}>
      <ScaleMark score={score} />
      <span className="stance__label" style={{ color: TONE_INK[score] }}>
        {scaleLabel[score]}
      </span>
      <Sources sources={cell!.sources} />
    </span>
  );
}
