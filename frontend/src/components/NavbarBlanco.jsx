import { Link, NavLink } from "react-router-dom";

export default function NavbarBlanco() {
  const navItem =
    "px-4 py-2 text-sm sm:text-base font-normal text-black/90 hover:text-black transition";
  const activeItem = "text-white";

  return (
    <header className="w-full" style={{'position': 'fixed', 'top': '0', 'zIndex': '200'}}>
      <nav className="mx-auto max-w-6xl h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <Link to="/" aria-label="Inicio" className="flex items-center gap-2">
          <Logo className="h-7 w-7" />
        </Link>

        <ul className="hidden md:flex items-center gap-8">
          <li>
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `${navItem} ${isActive ? activeItem : ""}`
              }
            >
              Inicio
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/nosotros"
              className={({ isActive }) =>
                `${navItem} ${isActive ? activeItem : ""}`
              }
            >
              Nosotros
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/ranking"
              className={({ isActive }) =>
                `${navItem} ${isActive ? activeItem : ""}`
              }
            >
              Ranking
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/campeonatos"
              className={({ isActive }) =>
                `${navItem} ${isActive ? activeItem : ""}`
              }
            >
              Campeonatos
            </NavLink>
          </li>
        </ul>

        {/* Right: Login */}
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="rounded-full bg-sky-400 px-6 py-2 text-white font-medium hover:bg-sky-500 transition"
          >
            Login
          </Link>
        </div>
      </nav>
    </header>
  );
}

function Logo({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="16" cy="16" r="12" fill="#5ad0f5" />
      <path
        d="M7 16c0-5 4-9 9-9m9 9c0 5-4 9-9 9"
        fill="none"
        stroke="#0e7490"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
