import { Link } from 'react-router-dom';
import { Sentences } from '../components/Sentences';
import { categories, questions } from '../lib/data';

const ENTRIES = [
  {
    to: '/compare',
    no: '01',
    name: '정책 비교',
    desc: '문항마다 여섯 정당의 입장을 한 줄에 나란히 표시. 영역이나 정당으로 추리거나, 입장이 갈리는 문항부터 볼 수 있음.',
    action: '비교표 열기'
  },
  {
    to: '/match',
    no: '02',
    name: '정당 매칭',
    desc: '같은 문항에 답하면 정당별로 얼마나 가까운지 계산함. 중요한 문항에는 가중치를 주고, 애매한 문항은 건너뛰면 됨.',
    action: '설문 시작'
  },
  {
    to: '/about',
    no: '03',
    name: '방법론',
    desc: '문항을 고른 기준과 입장을 코딩한 근거, 근접도를 계산하는 식.',
    action: '방법론 보기'
  }
];

const SOURCES = [
  { text: '정당 강령 및 정강·정책 문서' },
  { text: '정당 논평, 대변인 브리핑, 지도부 공식 발언' },
  {
    text: '국회 의안정보시스템의 법안 발의·표결 기록',
    url: 'https://likms.assembly.go.kr/bill/main.do'
  },
  { text: '선거 공약집' }
];

export function Home() {
  return (
    <>
      <section className="hero">
        <div className="page">
          <div className="title-block">
            <h1>개요</h1>
          </div>

          <nav className="contents" aria-label="바로 가기">
            {ENTRIES.map((e) => (
              <Link key={e.to} to={e.to} className="contents__item">
                <span className="contents__no">{e.no}</span>
                <span className="contents__name">{e.name}</span>
                <Sentences as="span" className="contents__desc">
                  {e.desc}
                </Sentences>
                <span className="contents__action">{e.action}</span>
              </Link>
            ))}
          </nav>
        </div>
      </section>

      <div className="page stack-lg">
        <section>
          <div className="section-title">
            <h2>근거 자료</h2>
          </div>
          <ul className="bullets">
            {SOURCES.map((s) => (
              <li key={s.text}>
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    {s.text}
                  </a>
                ) : (
                  s.text
                )}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <div className="section-title">
            <h2>다루는 영역</h2>
            <span className="count">{questions.length}문항</span>
          </div>
          <table className="grid" style={{ minWidth: 0 }}>
            <caption className="vh">영역별 문항 수</caption>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <th scope="row" style={{ width: '2.5rem' }}>
                    {c.id}
                  </th>
                  <th scope="row" style={{ color: 'var(--ink)' }}>
                    {c.name}
                  </th>
                  <td style={{ width: '5rem', textAlign: 'right' }}>
                    {questions.filter((q) => q.category === c.id).length}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </>
  );
}
