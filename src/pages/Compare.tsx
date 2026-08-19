import { Fragment, useMemo, useState } from 'react';
import { Stance } from '../components/Stance';
import { categories, parties, positions, questionGroups, questions } from '../lib/data';
import { divergence } from '../lib/matching';

type Sort = 'order' | 'divergence';

export function Compare() {
  const [category, setCategory] = useState<string>('ALL');
  const [query, setQuery] = useState('');
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<Sort>('order');

  const shownParties = parties.filter((p) => !hidden.has(p.id));

  const toggleParty = (id: string) =>
    setHidden((prev) => {
      const next = new Set(prev);
      // 마지막 한 정당까지 끄면 표가 빈 껍데기가 되므로 막는다.
      if (next.has(id)) next.delete(id);
      else if (parties.length - next.size > 1) next.add(id);
      return next;
    });

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = questionGroups
      .filter((g) => category === 'ALL' || g.category.id === category)
      .map((g) => ({
        ...g,
        questions: g.questions.filter(
          (q) =>
            !needle ||
            q.text.toLowerCase().includes(needle) ||
            q.id.toLowerCase().includes(needle)
        )
      }))
      .filter((g) => g.questions.length > 0);

    if (sort === 'order') return filtered;

    // 쟁점 순: 정당 간 입장 분산이 큰 문항부터. 미조사 문항은 뒤로 보낸다.
    return filtered.map((g) => ({
      ...g,
      questions: [...g.questions].sort((a, b) => {
        const da = divergence(positions, a.id, shownParties);
        const db = divergence(positions, b.id, shownParties);
        if (da === null && db === null) return 0;
        if (da === null) return 1;
        if (db === null) return -1;
        return db - da;
      })
    }));
  }, [category, query, sort, shownParties]);

  const shownCount = groups.reduce((n, g) => n + g.questions.length, 0);

  return (
    <div className="page stack-lg">
      <section>
        <div className="title-block">
          <h1>정책 비교</h1>
        </div>
      </section>

      <section>
        <div className="controls">
          <span className="controls__label">검색</span>
          <div className="search">
            <label className="vh" htmlFor="q-search">
              문항 검색
            </label>
            <input
              id="q-search"
              type="search"
              placeholder="예: 연금, 원자력"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="chipset" role="group" aria-label="정렬">
            <button
              type="button"
              className="chip-btn"
              aria-pressed={sort === 'order'}
              onClick={() => setSort('order')}
            >
              문항 순
            </button>
            <button
              type="button"
              className="chip-btn"
              aria-pressed={sort === 'divergence'}
              onClick={() => setSort('divergence')}
              title="정당 간 입장 차이가 큰 문항부터 봅니다"
            >
              쟁점 순
            </button>
          </div>
        </div>

        <div className="controls">
          <span className="controls__label">영역</span>
          <div className="chipset" role="group" aria-label="영역 필터">
            <button
              type="button"
              className="chip-btn"
              aria-pressed={category === 'ALL'}
              onClick={() => setCategory('ALL')}
            >
              전체
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                className="chip-btn"
                aria-pressed={category === c.id}
                onClick={() => setCategory(c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="controls">
          <span className="controls__label">정당</span>
          <div className="chipset" role="group" aria-label="표시할 정당">
            {parties.map((p) => (
              <button
                key={p.id}
                type="button"
                className="chip-btn"
                aria-pressed={!hidden.has(p.id)}
                onClick={() => toggleParty(p.id)}
              >
                <span
                  className="swatch"
                  style={{ background: p.color, marginRight: '0.4rem', verticalAlign: 'middle' }}
                />
                {p.name}
              </button>
            ))}
          </div>
          <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--ink-ghost)' }}>
            {shownCount}/{questions.length}문항
          </span>
        </div>

        <div className="tablewrap" style={{ marginTop: '1.25rem' }}>
          {shownCount === 0 ? (
            <p className="empty">검색 결과가 없습니다.</p>
          ) : (
            <table className="matrix">
              <caption className="vh">문항별 정당 입장 비교표</caption>
              <thead>
                <tr>
                  <th scope="col">문항</th>
                  {shownParties.map((p) => (
                    <th key={p.id} scope="col">
                      <span className="partyhead">
                        <span className="swatch" style={{ background: p.color }} />
                        {p.name}
                        {p.inAssembly ? null : (
                          <span className="partyhead__note" title="현재 국회 의석 없음">
                            원외
                          </span>
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => (
                  <Fragment key={g.category.id}>
                    <tr className="group">
                      <th scope="colgroup" colSpan={shownParties.length + 1}>
                        {g.category.id} · {g.category.name}
                      </th>
                    </tr>
                    {g.questions.map((q) => (
                      <tr key={q.id}>
                        <th scope="row">
                          <span className="qref">{q.id}</span>
                          {q.text}
                        </th>
                        {shownParties.map((p) => (
                          <td key={p.id}>
                            <Stance cell={positions[q.id]?.[p.id]} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
