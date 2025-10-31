import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthProvider";
import { useNavigate } from "react-router-dom";
import logoUrl from "../assets/Logo.svg";
import { useNotification } from "../contexts/NotificacionContext.jsx";
import BellDropdown from "./BellDropdown.jsx";
import React from "react";

export default function Navbar({ transparent }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { notiCount } = useNotification();

  const [open, setOpen] = React.useState(false);

  const navItem =
    "px-3 py-2 text-sm font-medium text-white/90 hover:text-white whitespace-nowrap transition";
  const activeItem = "text-white";

  const links = [
    { to: "/", label: "Inicio", end: true },
    { to: "/canchas", label: "Canchas", end: true },
    { to: "/gestor-categorias", label: "Categorias", end: true },
    { to: "/gestor-partidos", label: "Gestor Partidos", end: true },
    { to: "/gestor-filtros", label: "Gestor Filtros", end: true },
    { to: "/Noticias", label: "Noticias" },
    { to: "/creadorNoticias", label: "Crear Noticia" },
    { to: "/reportes", label: "Reportes" },
    { to: "/temporadas", label: "Temporadas" },
    { to: "/ranking", label: "Ranking" },
    { to: "/campeonatos", label: "Campeonatos" },
    { to: "/resultados", label: "Resultados" },
  ];

  // Cierra el panel móvil al navegar
  const closeAnd = (fn) => () => {
    setOpen(false);
    fn?.();
  };

  return (
    <header
      className={`w-full fixed top-0 z-[200] transition-colors duration-300 ${
        transparent ? "backdrop-blur" : "bg-neutral-800"
      }`}
      role="banner"
      style={{ left: 0 }}
    >
      <nav className="mx-auto max-w-7xl h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
        {/* Brand + Mobile toggle */}
        <div className="flex items-center gap-3">
          {/* Mobile: Hamburger */}
          <button
            type="button"
            className="lg:hidden inline-flex items-center justify-center rounded-md p-2 text-white/90 hover:text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            aria-label="Abrir menú"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {!open ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none"
                   viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round"
                      d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none"
                   viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </button>

          <Link to="/" aria-label="Inicio" className="flex items-center gap-2">
            <img
              src={logoUrl}
              alt="Club del Parque"
              className="h-8 w-auto object-contain"
              loading="eager"
            />
          </Link>
        </div>

        {/* Desktop nav */}
        <ul
          className="hidden lg:flex items-center gap-4 max-w-[55%] xl:max-w-[60%] overflow-x-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
        >
          {links.map(({ to, label, end }) => (
            <li key={to} className="flex-shrink-0">
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) => `${navItem} ${isActive ? activeItem : ""}`}
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Mensajes/Notificaciones icono (click -> chats) */}
              <div style={{ position: "relative", display: "inline-block" }}>
                <svg
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate("/chats")}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-6 w-6 text-white/90 hover:text-white transition"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03 8.25 9 8.25s9-3.694 9-8.25Z"
                  />
                </svg>
                {notiCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-6px",
                      right: "-6px",
                      background: "#0D8ABC",
                      color: "#fff",
                      borderRadius: "50%",
                      padding: "1px 4px",
                      fontSize: "0.7em",
                      fontWeight: 700,
                      zIndex: 10,
                      minWidth: "10px",
                      textAlign: "center",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
                    }}
                  >
                    {notiCount}
                  </span>
                )}
              </div>

              <BellDropdown color="white" />

              <button
                className="rounded-full bg-sky-600 px-5 py-2 text-white font-medium hover:bg-sky-500 transition"
                onClick={() => navigate("/perfil")}
              >
                Perfil
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-full bg-sky-600 px-5 py-2 text-white font-medium hover:bg-sky-500 transition"
            >
              Login
            </Link>
          )}
        </div>
      </nav>

      {/* Mobile panel (slide-over) */}
      <div
        className={`lg:hidden fixed inset-0 z-[190] transition ${
          open ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!open}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setOpen(false)}
        />
        {/* Panel */}
        <aside
          className={`absolute top-0 left-0 h-full w-[82%] max-w-sm bg-neutral-900 text-white shadow-xl transform transition-transform duration-300 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
          role="dialog"
          aria-modal="true"
        >
          <div className="h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between border-b border-white/10">
            <Link to="/" onClick={closeAnd()} className="flex items-center gap-2">
              <img src={logoUrl} alt="Club del Parque" className="h-7 w-auto" />
              <span className="sr-only">Inicio</span>
            </Link>
            <button
              className="p-2 rounded-md hover:bg-white/10"
              onClick={() => setOpen(false)}
              aria-label="Cerrar menú"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6"
                   viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="px-3 py-4">
            <ul className="space-y-1">
              {links.map(({ to, label, end }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `block rounded-lg px-3 py-3 text-base ${
                        isActive ? "bg-white/10 text-white" : "text-white/90 hover:bg-white/5 hover:text-white"
                      }`
                    }
                  >
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>

            <div className="mt-6 border-t border-white/10 pt-4 flex items-center gap-3">
              {user ? (
                <>
                  <button
                    onClick={closeAnd(() => navigate("/chats"))}
                    className="rounded-md bg-white/10 px-3 py-2 text-sm hover:bg-white/15"
                  >
                    Chats
                  </button>
                  <button
                    onClick={closeAnd(() => navigate("/perfil"))}
                    className="rounded-md bg-sky-600 px-3 py-2 text-sm font-medium hover:bg-sky-500"
                  >
                    Perfil
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-md bg-sky-600 px-3 py-2 text-sm font-medium hover:bg-sky-500"
                >
                  Login
                </Link>
              )}
            </div>
          </nav>
        </aside>
      </div>

      <nav className="z-1200 fixed bottom-0 left-0 right-0 bg-neutral-800 text-white shadow-inner border-t border-neutral-700 flex justify-around items-center h-14 md:hidden z-[300]">
        <NavLink to="/" className="flex flex-col items-center text-xs">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 4.5l9 5.25v9.75a.75.75 0 0 1-.75.75H3.75A.75.75 0 0 1 3 19.5V9.75z" />
          </svg>
          Inicio
        </NavLink>

        <NavLink to="/Noticias" className="flex flex-col items-center text-xs">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
          </svg>
          Noticias
        </NavLink>

        {user && (
          <NavLink to="/ranking" className="flex flex-col items-center text-xs">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-6m6 6V7" />
            </svg>
            Ranking
          </NavLink>
        )}

        {user && (
          <NavLink to="/perfil" className="flex flex-col items-center text-xs">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9A3.75 3.75 0 1 1 8.25 9a3.75 3.75 0 0 1 7.5 0Zm-7.5 6a6.75 6.75 0 0 0 13.5 0" />
            </svg>
            Perfil
          </NavLink>
        )}
      </nav>


      

      
    </header>
  );
}
