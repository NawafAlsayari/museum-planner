import { NavLink, Outlet } from 'react-router-dom';

function linkClass({ isActive }) {
  return `pixel-btn text-[0.5rem] text-center ${
    isActive ? '' : 'pixel-btn--secondary'
  } transition mb-2`;
}

export default function AdminLayout() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="font-pixel text-stone-100 text-base mb-8 uppercase">Dashboard</h1>
      <div className="flex flex-col sm:flex-row gap-8">
        <aside className="sm:w-56 shrink-0">
          <nav className="flex sm:flex-col gap-3">
            <NavLink to="/admin/exhibits" className={linkClass}>
              🖼️ EXHIBITS
            </NavLink>
            <NavLink to="/admin/tasks" className={linkClass}>
              ✅ TASKS
            </NavLink>
            <NavLink to="/admin/settings" className={linkClass}>
              ⚙️ SETTINGS
            </NavLink>
          </nav>
        </aside>
        <section className="flex-1 min-w-0">
          <Outlet />
        </section>
      </div>
    </div>
  );
}
