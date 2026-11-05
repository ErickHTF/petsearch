import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router';
import { Layout } from './components/Layout.tsx';
import { RequireAuth } from './components/RequireAuth.tsx';
import { Account } from './pages/Account.tsx';
import { SignIn, SignUp } from './pages/AuthPages.tsx';
import { Home } from './pages/Home.tsx';
import { ManageNotice } from './pages/ManageNotice.tsx';
import { Moderation } from './pages/Moderation.tsx';
import { NewNotice } from './pages/NewNotice.tsx';
import { NoticeDetail } from './pages/NoticeDetail.tsx';
import { NoticeList } from './pages/NoticeList.tsx';
import { SightingForm } from './pages/SightingForm.tsx';
import { About, NotFound, Privacy } from './pages/StaticPages.tsx';

/** Moves focus to the main content on route change so screen readers announce the new page. */
function FocusOnNavigate() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.getElementById('conteudo')?.focus({ preventScroll: true });
    window.scrollTo?.({ top: 0 });
  }, [pathname]);
  return null;
}

export function App() {
  return (
    <>
      <FocusOnNavigate />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="avisos" element={<NoticeList />} />
          <Route
            path="avisos/novo"
            element={
              <RequireAuth>
                <NewNotice />
              </RequireAuth>
            }
          />
          <Route path="avisos/:id" element={<NoticeDetail />} />
          <Route path="avisos/:id/avistamento" element={<SightingForm />} />
          <Route path="entrar" element={<SignIn />} />
          <Route path="cadastrar" element={<SignUp />} />
          <Route
            path="minha-conta"
            element={
              <RequireAuth>
                <Account />
              </RequireAuth>
            }
          />
          <Route
            path="minha-conta/avisos/:id"
            element={
              <RequireAuth>
                <ManageNotice />
              </RequireAuth>
            }
          />
          <Route
            path="moderacao"
            element={
              <RequireAuth requiredRole="moderator">
                <Moderation />
              </RequireAuth>
            }
          />
          <Route path="privacidade" element={<Privacy />} />
          <Route path="sobre" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
