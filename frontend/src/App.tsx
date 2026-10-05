import { NavLink, Navigate, Route, Routes } from "react-router";
import { DashboardPage } from "./pages/Dashboard";
import { EventosPage } from "./pages/Eventos";
import { JugadorasPage } from "./pages/Jugadoras";

const NAV_LINKS = [
  { href: "/jugadoras", label: "Jugadoras" },
  { href: "/eventos", label: "Eventos" },
  { href: "/dashboard", label: "Dashboard" },
];

export function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center gap-6 px-4 py-3">
          <span className="font-semibold">tp-inge3</span>
          <nav className="flex gap-4 text-sm">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.href}
                to={link.href}
                className={({ isActive }) => (isActive ? "text-zinc-900" : "text-zinc-600 hover:text-zinc-900")}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/jugadoras" element={<JugadorasPage />} />
          <Route path="/eventos" element={<EventosPage />} />
          <Route path="*" element={<p className="text-sm text-zinc-500">Página no encontrada.</p>} />
        </Routes>
      </main>
    </div>
  );
}
