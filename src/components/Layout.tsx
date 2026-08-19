import { useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { DISCLAIMER } from '../lib/data';
import { Sentences } from './Sentences';

const NAV = [
  { to: '/', label: '개요', end: true },
  { to: '/compare', label: '정책 비교' },
  { to: '/match', label: '정당 매칭' },
  { to: '/about', label: '방법론' }
];

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
}

export function Layout() {
  return (
    <div className="app">
      <ScrollToTop />
      <a className="skip-link" href="#main">
        본문으로 건너뛰기
      </a>

      <header className="masthead">
        <div className="page masthead__inner">
          <nav className="nav" aria-label="주요 메뉴">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => (isActive ? 'is-active' : undefined)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main id="main">
        <Outlet />
      </main>

      <footer className="colophon">
        <div className="page colophon__grid">
          <p className="label" style={{ marginBottom: '0.6rem' }}>
            Disclosure
          </p>
          <Sentences>{DISCLAIMER}</Sentences>
        </div>
      </footer>
    </div>
  );
}
