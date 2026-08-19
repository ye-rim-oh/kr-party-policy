import { useMemo, useState } from 'react';
import { categories, questionGroups, questions, scale } from '../lib/data';
import { useAnswers } from '../lib/useAnswers';
import { isAnswered } from '../lib/matching';
import type { Score, Weight } from '../lib/types';
import { Result } from '../components/Result';
import { TONE_INK } from '../components/Stance';

const WEIGHTS: { value: Weight; label: string }[] = [
  { value: 1, label: '보통' },
  { value: 2, label: '중요' },
  { value: 3, label: '매우 중요' }
];

export function Match() {
  const { answers, setScore, setWeight, reset } = useAnswers();
  const [view, setView] = useState<'quiz' | 'result'>('quiz');
  const [filter, setFilter] = useState<'all' | 'todo'>('all');

  const answeredCount = useMemo(
    () => questions.filter((q) => isAnswered(answers[q.id])).length,
    [answers]
  );

  const groups = useMemo(
    () =>
      questionGroups
        .map((g) => ({
          ...g,
          questions:
            filter === 'all' ? g.questions : g.questions.filter((q) => !isAnswered(answers[q.id]))
        }))
        .filter((g) => g.questions.length > 0),
    [filter, answers]
  );

  if (view === 'result') {
    return <Result answers={answers} onBack={() => setView('quiz')} />;
  }

  return (
    <div className="page">
      <div className="title-block">
        <h1>정당 매칭</h1>
      </div>

      <div className="quiz-head" style={{ marginTop: '1.75rem' }}>
        <div className="quiz-head__inner">
          <span className="quiz-head__count" aria-live="polite">
            <b>{answeredCount}</b> / {questions.length}문항 응답
          </span>
          <span className="quiz-head__spacer" />
          <div className="chipset" role="group" aria-label="문항 보기">
            <button
              type="button"
              className="chip-btn"
              aria-pressed={filter === 'all'}
              onClick={() => setFilter('all')}
            >
              전체
            </button>
            <button
              type="button"
              className="chip-btn"
              aria-pressed={filter === 'todo'}
              onClick={() => setFilter('todo')}
            >
              미응답만
            </button>
          </div>
          <button
            type="button"
            className="btn btn--quiet"
            onClick={() => {
              if (window.confirm('응답을 모두 지울까요?')) reset();
            }}
          >
            초기화
          </button>
          <button
            type="button"
            className="btn btn--solid"
            onClick={() => setView('result')}
            disabled={answeredCount === 0}
          >
            결과 보기
          </button>
        </div>
      </div>

      {groups.length === 0 ? (
        <p className="empty">모든 문항에 답했음. 위의 &lsquo;결과 보기&rsquo;를 누르면 됨.</p>
      ) : (
        groups.map((g) => (
          <section key={g.category.id} style={{ marginBottom: '2.25rem' }}>
            <div className="section-title">
              <p className="label">{g.category.id}</p>
              <h2>{g.category.name}</h2>
              <span className="count">
                {g.questions.filter((q) => isAnswered(answers[q.id])).length}/{g.questions.length}
              </span>
            </div>

            {g.questions.map((q) => {
              const answer = answers[q.id];
              const answered = isAnswered(answer);
              return (
                <fieldset key={q.id} className={answered ? 'qcard is-answered' : 'qcard'}>
                  <legend className="qcard__legend">
                    <span className="qref">{q.id}</span>
                    <span className="qcard__text">{q.text}</span>
                  </legend>

                  <div className="likert">
                    {([1, 2, 3, 4, 5] as Score[]).map((v) => (
                      <label
                        key={v}
                        // 선택된 칸은 비교표와 같은 찬반 색으로 칠해, 두 화면의 척도가
                        // 같은 것임을 색으로도 알 수 있게 한다. 배경에는 글자용 색(어두운 쪽)을
                        // 쓰고 글자는 바탕색으로 뒤집어야 라이트·다크 모두에서 대비가 선다.
                        style={
                          answer?.score === v
                            ? {
                                background: TONE_INK[v],
                                borderColor: TONE_INK[v],
                                color: 'var(--paper)'
                              }
                            : undefined
                        }
                      >
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          value={v}
                          checked={answer?.score === v}
                          onChange={() => setScore(q.id, v)}
                        />
                        <span>{scale[String(v)]}</span>
                      </label>
                    ))}
                  </div>

                  <div className="qcard__foot">
                    <span>중요도</span>
                    <div className="weightset" role="group" aria-label={`${q.id} 중요도`}>
                      {WEIGHTS.map((w) => (
                        <button
                          key={w.value}
                          type="button"
                          aria-pressed={(answer?.weight ?? 1) === w.value}
                          onClick={() => setWeight(q.id, w.value)}
                        >
                          {w.label}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="btn btn--quiet skip-btn"
                      onClick={() => setScore(q.id, null)}
                      disabled={!answered}
                    >
                      건너뛰기
                    </button>
                  </div>
                </fieldset>
              );
            })}
          </section>
        ))
      )}

      {groups.length > 0 && categories.length > 0 ? (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
          <button
            type="button"
            className="btn btn--solid"
            onClick={() => setView('result')}
            disabled={answeredCount === 0}
          >
            결과 보기
          </button>
        </div>
      ) : null}
    </div>
  );
}
