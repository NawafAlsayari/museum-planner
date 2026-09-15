import { Outlet, Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function navClass({ isActive }) {
  return isActive
    ? 'text-amber-400 font-pixel'
    : 'text-stone-400 hover:text-stone-600';
}

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-stone-900 border-b-4 border-amber-600 text-stone-700">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
          <Link to="/" aria-label="My Museum home" className="flex items-center gap-3 font-pixel text-amber-400 text-sm tracking-wide">
            <span className="text-xl">🏛️</span>
            <span>MY MUSEUM</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <NavLink to="/" className={navClass} end>
              HOME
            </NavLink>
            {user ? (
              <>
                <NavLink to="/admin/exhibits" className={navClass}>
                  DASHBOARD
                </NavLink>
                <span className="text-stone-500 hidden sm:inline">[{user.displayName}]</span>
                <button onClick={logout} className="pixel-btn pixel-btn--secondary text-[0.5rem]">
                  LOG OUT
                </button>
              </>
            ) : (
              <NavLink to="/login" className={navClass}>
                SIGN IN
              </NavLink>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-stone-900 border-t-4 border-amber-600 text-stone-500 text-sm">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-pixel text-[0.55rem]">© {new Date().getFullYear()} MY MUSEUM & PLANNER</span>
          <span>CURATED MOMENTS, PROJECTS & PLANS.</span>
        </div>
      </footer>
    </div>
  );
}
