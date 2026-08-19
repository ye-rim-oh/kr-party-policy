import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="page page--narrow" style={{ paddingBlock: '4rem' }}>
      <p className="label">404</p>
      <h1 style={{ marginTop: '0.8rem', fontSize: '1.6rem' }}>없는 페이지입니다</h1>
      <p style={{ marginTop: '0.8rem', color: 'var(--ink-muted)' }}>
        주소를 다시 확인해 주세요.{' '}
        <Link to="/">개요 페이지로 돌아가기</Link>
      </p>
    </div>
  );
}
