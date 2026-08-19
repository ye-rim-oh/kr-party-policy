import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Route, Routes } from 'react-router-dom';

import './styles/global.css';
import './styles/app.css';

import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Compare } from './pages/Compare';
import { Match } from './pages/Match';
import { About } from './pages/About';
import { NotFound } from './pages/NotFound';

// GitHub Pages는 임의 경로에 대한 서버 리라이트를 지원하지 않으므로 해시 라우터를 쓴다.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="compare" element={<Compare />} />
          <Route path="match" element={<Match />} />
          <Route path="about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </HashRouter>
  </StrictMode>
);
