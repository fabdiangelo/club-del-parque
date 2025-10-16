import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthProvider";
import { useNavigate } from "react-router-dom";
import logoUrl from "../assets/Logo.svg";
import { useNotification } from "../contexts/NotificacionContext.jsx";
import BellDropdown from "./BellDropdown.jsx";

export default function Navbar({ transparent }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { notiCount } = useNotification();

  console.log(user);

  const navItem =
    "px-4 py-2 text-sm  font-normal text-white/90 hover:text-white transition";
  const activeItem = "text-white";

  return (
    <header
      className={`w-full fixed top-0 z-[200] transition-colors duration-300 ${
        transparent ? "backdrop-blur" : "bg-neutral-800"
      }`}
      role="banner"
      style={{ left: "0" }}
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
              className={({ isActive }) =>
                `${navItem} ${isActive ? activeItem : ""}`
              }
            >
              Inicio
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/Noticias"
              className={({ isActive }) =>
                `${navItem} ${isActive ? activeItem : ""}`
              }
            >
              Noticias
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/creadorNoticias"
              className={({ isActive }) =>
                `${navItem} ${isActive ? activeItem : ""}`
              }
            >
              Crear Noticia
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/reportes"
              className={({ isActive }) =>
                `${navItem} ${isActive ? activeItem : ""}`
              }
            >
              Reportes
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/temporadas"
              className={({ isActive }) =>
                `${navItem} ${isActive ? activeItem : ""}`
              }
            >
              Temporadas
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
          <li>
  <NavLink
    to="/resultados"
    className={({ isActive }) =>
      `${navItem} ${isActive ? activeItem : ""}`
    }
  >
    Resultados
  </NavLink>
</li>
        </ul>

        <div className="flex items-center gap-3">
          {user ? (
            <>


              <div style={{ position: "relative", display: "inline-block" }}>
                <svg
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate("/chats")}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
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
                className="rounded-full bg-sky-600 px-6 py-2 text-white font-medium hover:bg-sky-500 hover:text-white transition"
                onClick={() => navigate("/perfil")}
              >
                Perfil
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-full bg-sky-600 px-6 py-2 text-white font-medium hover:bg-sky-500 hover:text-white transition"
            >
              Login
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
