// App shell: header, main content and bottom navigation (NFR-01, NFR-02, NFR-04).
import { Link, NavLink, Outlet } from 'react-router';
import type { ReactNode } from 'react';

function Icon({ path }: { path: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={path} />
    </svg>
  );
}

const NAV_ITEMS: { to: string; label: string; icon: string; end?: boolean }[] = [
  { to: '/', label: 'Início', icon: 'M3 11l9-8 9 8M5 10v10h14V10', end: true },
  {
    to: '/avisos',
    label: 'Avisos',
    icon: 'M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14M21 21l-5-5',
    end: true,
  },
  { to: '/avisos/novo', label: 'Publicar', icon: 'M12 5v14M5 12h14' },
  {
    to: '/minha-conta',
    label: 'Minha conta',
    icon: 'M12 12a4 4 0 1 0 0-8a4 4 0 1 0 0 8M4 21c0-4 4-6 8-6s8 2 8 6',
  },
];

function BottomNav() {
  return (
    <nav
      aria-label="Navegação principal"
      className="bottom-nav fixed inset-x-0 bottom-0 z-10 border-t border-line-soft bg-surface"
    >
      <ul className="mx-auto flex max-w-xl list-none p-0">
        {NAV_ITEMS.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-xs no-underline ${
                  isActive ? 'font-bold text-primary' : 'text-muted'
                }`
              }
            >
              <Icon path={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Layout({ children }: { children?: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <a
        href="#conteudo"
        className="sr-only-focusable btn btn-secondary absolute left-2 top-2 z-20"
      >
        Pular para o conteúdo
      </a>
      <header className="app-header border-b-4 border-accent bg-navy text-white">
        <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-2">
          <Link
            to="/"
            className="flex min-h-11 items-center text-lg font-bold text-white no-underline"
          >
            PETSEARCH
          </Link>
          <Link to="/sobre" className="flex min-h-11 items-center px-2 text-white">
            Sobre
          </Link>
        </div>
      </header>
      <main id="conteudo" tabIndex={-1} className="app-main mx-auto max-w-xl pt-4">
        {children ?? <Outlet />}
        <footer className="mt-10 border-t border-line-soft pt-4 text-sm text-muted">
          <p>
            Projeto de extensão do IFSP Campus Salto (ADS 2026/2). Protótipo em desenvolvimento.
          </p>
          <p className="mt-1 flex gap-4">
            <Link to="/privacidade" className="inline-flex min-h-11 items-center">
              Privacidade
            </Link>
            <Link to="/sobre" className="inline-flex min-h-11 items-center">
              Sobre o projeto
            </Link>
          </p>
        </footer>
      </main>
      <BottomNav />
    </div>
  );
}
