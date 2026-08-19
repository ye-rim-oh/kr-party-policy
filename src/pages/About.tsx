import { Sentences } from '../components/Sentences';
import { categories, parties, questions } from '../lib/data';

export function About() {
  const inAssembly = parties.filter((p) => p.inAssembly);
  const outside = parties.filter((p) => !p.inAssembly);

  return (
    <div className="page page--narrow">
      <div className="title-block">
        <h1>방법론</h1>
      </div>

      <div className="prose" style={{ marginTop: '2.5rem' }}>
        <h2>정당 선정</h2>
        <Sentences>
          {`원내 정당 ${inAssembly.length}곳(${inAssembly.map((p) => p.name).join(', ')})에 ${outside.map((p) => p.name).join(', ')}을 더한 ${parties.length}곳.`}
        </Sentences>
        <Sentences>
          {'정의당은 2024년 총선에서 의석을 얻지 못해 현재 원외이며, 그 사실은 비교표에 함께 표시.'}
        </Sentences>

        <h2>문항 설계</h2>
        <Sentences>
          {'Pew Research Center의 Political Typology, 選挙ドットコム의 정책비교, 日経 VOTE MATCH, 早稲田大学 IDI의 #くらべてえらぶ를 참고하여 한국의 쟁점 구조에 맞추어 작성함.'}
        </Sentences>
        <ul>
          <li>
            영역 <strong>{categories.length}개</strong>, 총{' '}
            <strong>{questions.length}문항</strong>.
          </li>
          <li>{categories.map((c) => `${c.id} ${c.name}`).join(', ')}</li>
          <li>모든 문항은 5점 척도(매우 반대 1 ~ 매우 찬성 5).</li>
        </ul>

        <h2>코딩 기준</h2>
        <Sentences>
          {'문항 진술문에 대한 각 정당의 입장을 1~5로 매김. 판정 기준은 다음과 같음.'}
        </Sentences>
        <ul>
          <li>
            <strong>1 매우 반대</strong> — 강령·공약에 명시적 반대. 반대 법안 발의 또는 반대 표결
            주도
          </li>
          <li>
            <strong>2 반대</strong> — 논평 수준의 반대. 소극적 반대 또는 조건부 반대
          </li>
          <li>
            <strong>3 중립·모름</strong> — 공식 입장이 없거나, 당내 이견이 병존하거나, 직접
            근거가 없어 찬반을 단정할 수 없는 경우
          </li>
          <li>
            <strong>4 찬성</strong> — 논평·공약 수준의 찬성. 찬성 표결
          </li>
          <li>
            <strong>5 매우 찬성</strong> — 강령·핵심 공약에 명시. 관련 법안 대표발의 또는 당론 채택
          </li>
        </ul>
        <Sentences>
          {'찬성 또는 반대로 매긴 항목에는 모두 출처를 붙임. 정당 공식 자료와 국회 기록이 1차 출처이며, 언론 보도는 1차 출처를 찾지 못했을 때 보조로 사용.'}
        </Sentences>
        <Sentences>
          {'추정값은 쓰지 않음. 해당 쟁점을 직접 다룬 자료가 없으면 찬반을 짐작하지 않고 중립·모름으로 둠. 중립·모름도 매칭 계산에는 들어감.'}
        </Sentences>

        <h2>매칭 산식</h2>
        <Sentences>
          {'중요도로 가중한 맨해튼 거리(weighted Manhattan distance)를 0~100으로 환산.'}
        </Sentences>
        <p>
          문항 <i>i</i>에 대해 이용자 응답을 <i>u</i>
          <sub>i</sub>, 정당의 코딩값을 <i>p</i>
          <sub>i</sub>, 이용자가 지정한 가중치를 <i>w</i>
          <sub>i</sub>(1, 2, 3 중 하나)라 하면
        </p>
        <p className="formula">
          근접도 = ( 1 − Σ <i>w</i>
          <sub>i</sub>|<i>u</i>
          <sub>i</sub> − <i>p</i>
          <sub>i</sub>| ÷ Σ 4<i>w</i>
          <sub>i</sub> ) × 100
        </p>
        <Sentences>
          {'분모의 4는 5점 척도에서 나올 수 있는 최대 거리. 응답이 완전히 같으면 100, 모든 문항에서 정반대면 0. 건너뛴 문항은 계산에서 제외.'}
        </Sentences>
        <Sentences>
          {'영역별 점수도 같은 방식으로 해당 영역 문항만 써서 따로 산출. 비교표의 쟁점 순 정렬은 문항별 코딩값의 표준편차가 큰 순서이며, 정당끼리 입장이 갈리는 문항일수록 위로 올라옴.'}
        </Sentences>

        <h2>한계</h2>
        <ul>
          <li>
            정당의 입장은 시점에 따라 바뀜. 코딩값마다 확인일을 기록하지만 최신 상황과 어긋날
            수 있음.
          </li>
          <li>당론과 개별 의원의 입장이 갈리는 사안이 있음. 여기서는 당론을 코딩.</li>
          <li>5점 척도로는 적용 범위나 재원, 시행 시기 같은 세부 설계를 담지 못함.</li>
          <li>
            문항을 무엇으로 채웠느냐가 이미 하나의 관점임. 넣고 뺀 쟁점에 따라 결과가 달라짐.
          </li>
          <li>이용자의 응답은 브라우저에만 남고 서버로 전송되지 않음.</li>
        </ul>
      </div>
    </div>
  );
}
