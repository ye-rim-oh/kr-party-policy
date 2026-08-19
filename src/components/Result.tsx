import { useMemo, useState } from 'react';
import { categories, parties, positions, questions, scaleLabel } from '../lib/data';
import { computeMatch, countVerified, questionAgreement } from '../lib/matching';
import { Sentences } from './Sentences';
import type { AnswerMap } from '../lib/types';

export function Result({ answers, onBack }: { answers: AnswerMap; onBack: () => void }) {
  const { results, answeredCount } = useMemo(
    () => computeMatch(answers, positions, parties, questions),
    [answers]
  );

  const scored = results.filter((r) => r.score !== null);
  const unscored = results.filter((r) => r.score === null);
  const [focus, setFocus] = useState<string | null>(null);
  const focusId = focus ?? scored[0]?.partyId ?? null;

  const agreement = useMemo(
    () => (focusId ? questionAgreement(answers, positions, focusId, questions) : null),
    [answers, focusId]
  );

  const coverage = countVerified(positions, questions, parties);
  const maxCompared = scored.length ? Math.max(...scored.map((r) => r.comparedCount)) : 0;

  return (
    <div className="page stack-lg">
      <section>
        <div className="title-block">
          <h1>매칭 결과</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.25rem' }}>
          <button type="button" className="btn" onClick={onBack}>
            설문으로 돌아가기
          </button>
        </div>
      </section>

      {answeredCount === 0 ? (
        <section className="callout">
          <h3>결과를 계산할 수 없음</h3>
          <Sentences>
            {'답한 문항이 없음. 설문으로 돌아가 한 문항이라도 답하면 됨.'}
          </Sentences>
        </section>
      ) : scored.length === 0 ? (
        <>
          <section className="callout">
            <h3>아직 점수를 낼 수 없음</h3>
            <Sentences>
              {`비교할 정당 입장이 아직 없음. ${coverage.total}칸 가운데 조사를 마친 칸이 ${coverage.verified}개.`}
            </Sentences>
            <Sentences>
              {`답한 ${answeredCount}문항은 이 브라우저에 남아 있음. 데이터가 채워진 뒤 다시 오면 그대로 결과가 나옴.`}
            </Sentences>
          </section>

          <section>
            <div className="section-title">
              <p className="label">정당별 상태</p>
            </div>
            <div className="ranking">
              {results.map((r) => (
                <div className="rank rank--na" key={r.partyId}>
                  <span className="rank__no">—</span>
                  <span className="rank__name">
                    <span className="swatch" style={{ background: r.color }} />
                    {r.name}
                  </span>
                  <span className="rank__track" aria-hidden="true" />
                  <span className="rank__score">산출 불가</span>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
        <>
          <section>
            <div className="section-title">
              <p className="label">전체 근접도</p>
              <span className="count">{maxCompared}문항 기준</span>
            </div>
            <div className="ranking">
              {scored.map((r, i) => (
                <div className="rank" key={r.partyId}>
                  <span className="rank__no">{String(i + 1).padStart(2, '0')}</span>
                  <span className="rank__name">
                    <span className="swatch" style={{ background: r.color }} />
                    {r.name}
                  </span>
                  <span className="rank__track">
                    <span
                      className="rank__fill"
                      style={{ width: `${r.score}%`, background: r.color }}
                    />
                  </span>
                  <span className="rank__score">
                    {r.score!.toFixed(1)}
                    <small>%</small>
                  </span>
                </div>
              ))}
              {unscored.map((r) => (
                <div className="rank rank--na" key={r.partyId}>
                  <span className="rank__no">—</span>
                  <span className="rank__name">
                    <span className="swatch" style={{ background: r.color }} />
                    {r.name}
                  </span>
                  <span className="rank__track" aria-hidden="true" />
                  <span className="rank__score">비교할 문항 없음</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="section-title">
              <p className="label">영역별 근접도</p>
            </div>
            <div className="tablewrap">
              <table className="grid">
                <thead>
                  <tr>
                    <th scope="col" style={{ textAlign: 'left' }}>
                      영역
                    </th>
                    {results.map((r) => (
                      <th key={r.partyId} scope="col">
                        {r.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => (
                    <tr key={c.id}>
                      <th scope="row">
                        <span className="qref">{c.id}</span>
                        {c.name}
                      </th>
                      {results.map((r) => {
                        const cell = r.categories[c.id];
                        return cell && cell.score !== null ? (
                          <td key={r.partyId}>{cell.score.toFixed(0)}</td>
                        ) : (
                          <td key={r.partyId} className="na">
                            미산출
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {agreement ? (
            <section>
              <div className="section-title">
                <p className="label">문항별 대조</p>
              </div>
              <div className="controls">
                <div className="chipset" role="group" aria-label="정당 선택">
                  {scored.map((r) => (
                    <button
                      key={r.partyId}
                      type="button"
                      className="chip-btn"
                      aria-pressed={focusId === r.partyId}
                      onClick={() => setFocus(r.partyId)}
                    >
                      {r.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="agreement">
                <div className="agreement__col">
                  <h3>생각이 같은 문항 ({agreement.agree.length})</h3>
                  {agreement.agree.length === 0 ? (
                    <p className="empty" style={{ padding: '1rem 0', textAlign: 'left' }}>
                      해당 문항이 없습니다.
                    </p>
                  ) : (
                    agreement.agree.map((row) => (
                      <div className="agreement__item" key={row.question.id}>
                        <span className="agreement__mark agreement__mark--agree">◆</span>
                        <span>
                          <span className="qref">{row.question.id}</span>
                          {row.question.text}
                          <br />
                          <span className="agreement__gloss">
                            나 {scaleLabel[row.userScore]} · 정당 {scaleLabel[row.partyScore]}
                          </span>
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div className="agreement__col">
                  <h3>생각이 갈리는 문항 ({agreement.conflict.length})</h3>
                  {agreement.conflict.length === 0 ? (
                    <p className="empty" style={{ padding: '1rem 0', textAlign: 'left' }}>
                      해당 문항이 없습니다.
                    </p>
                  ) : (
                    agreement.conflict.map((row) => (
                      <div className="agreement__item" key={row.question.id}>
                        <span className="agreement__mark agreement__mark--conflict">◆</span>
                        <span>
                          <span className="qref">{row.question.id}</span>
                          {row.question.text}
                          <br />
                          <span className="agreement__gloss">
                            나 {scaleLabel[row.userScore]} · 정당 {scaleLabel[row.partyScore]}
                          </span>
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          ) : null}
        </>
      )}

    </div>
  );
}
