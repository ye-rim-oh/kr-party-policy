import { Fragment, type ReactNode } from 'react';

/**
 * 문장 단위로 끊어 준다.
 *
 * 한글은 word-break: keep-all만으로는 부족하다. 어절 중간에서 끊기지는 않아도,
 * 문장 한복판에서 줄이 바뀌면 읽는 흐름이 어긋난다. 각 문장을 inline-block으로
 * 감싸 두면 줄바꿈이 문장 경계에서 먼저 일어나고, 폭이 모자랄 때만 문장 안에서
 * 접힌다.
 */
function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function Sentences({
  children,
  className,
  as: Tag = 'p'
}: {
  children: string;
  className?: string;
  as?: 'p' | 'span' | 'div';
}): ReactNode {
  const parts = splitSentences(children);
  return (
    <Tag className={className}>
      {parts.map((sentence, i) => (
        // 공백은 span 밖에 둔다. inline-block 안쪽 끝의 공백은 렌더링에서 잘려
        // 문장이 서로 붙어 버린다.
        <Fragment key={i}>
          <span className="clause">{sentence}</span>
          {i < parts.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </Tag>
  );
}
