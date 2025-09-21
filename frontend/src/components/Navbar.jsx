import { Link, NavLink } from "react-router-dom";
import logoUrl from "../assets/Logo.png";

export default function Navbar() {
  const navItem =
    "px-4 py-2 text-sm sm:text-base font-medium text-white/90 hover:text-white transition";
  const activeItem = "text-white";

  return (
    <header
      className="w-full bg-neutral-800 fixed top-0 z-[200]"
      role="banner"
    >
      <nav className="mx-auto max-w-6xl h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <Link to="/" aria-label="Inicio" className="flex items-center gap-2">
          <img
            src={logoUrl}
            alt="Club del Parque"
            className="h-8 w-auto object-contain"
            loading="eager"
          />
        </Link>

        <ul className="hidden md:flex items-center gap-8">
          <li>
            <NavLink
              to="/"
              end
              className={({ isActive }) => `${navItem} ${isActive ? activeItem : ""}`}
            >
              Inicio
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/Noticias"
              className={({ isActive }) => `${navItem} ${isActive ? activeItem : ""}`}
            >
              Noticias
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/nosotros"
              className={({ isActive }) => `${navItem} ${isActive ? activeItem : ""}`}
            >
              Nosotros
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/ranking"
              className={({ isActive }) => `${navItem} ${isActive ? activeItem : ""}`}
            >
              Ranking
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/campeonatos"
              className={({ isActive }) => `${navItem} ${isActive ? activeItem : ""}`}
            >
              Campeonatos
            </NavLink>
          </li>
          
        </ul>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="rounded-full bg-sky-600 px-6 py-2 text-white font-medium hover:bg-sky-500 hover:text-white transition"
          >
            Login
          </Link>
        </div>
      </nav>
    </header>
  );
}
