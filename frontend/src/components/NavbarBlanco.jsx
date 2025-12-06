import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthProvider";
import { useNavigate } from "react-router-dom";
import logoUrl from "../assets/Logo.svg";
import { useNotification } from "../contexts/NotificacionContext";
import BellDropdown from "./BellDropdown.jsx";
import { useState, useEffect } from "react";

export default function NavbarBlanco({ transparent = false }) {
  const { user, loading, error, logout } = useAuth();
  const navigate = useNavigate();
  const { notiCount } = useNotification();

  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Roles
  const isLogged = !!user;
  const isAdmin = user?.rol === "administrador";
  const isFederado = user?.rol === "federado";
  const isRegistradoNoFederado = isLogged && !isAdmin && !isFederado;
  const isVisitante = !isLogged;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Detect mobile viewport and update on resize
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 767px)");
    const set = (e) => setIsMobile(!!e.matches);
    set(mq);
    try {
      mq.addEventListener("change", set);
    } catch (e) {
      // Safari fallback
      mq.addListener(set);
    }
    return () => {
      try {
        mq.removeEventListener("change", set);
      } catch (e) {
        mq.removeListener(set);
      }
    };
  }, []);

  const handleLogout = async () => {
    const ok = await logout();
    if (ok) {
      navigate("/login");
    } else {
      console.error("Logout falló");
    }
  };

  // Texto y estados de los items
  const navTextColor = isMobile
    ? "text-black/90 hover:text-black"
    : transparent && !isScrolled && !menuOpen
      ? "text-white/90 hover:text-white"
      : "text-black/90 hover:text-black";

  const activeItem = isMobile
    ? "text-black font-bold"
    : transparent
      ? isScrolled || menuOpen
        ? "text-black font-bold"
        : "text-white font-bold"
      : "text-black font-bold";

  return (
    <header
      className={`w-full top-0 z-[200] fixed transition-all duration-500 shadow ${
        // Mobile always white
        isMobile
          ? "bg-white text-black"
          : menuOpen
            ? "bg-white text-black"
            : transparent
              ? isScrolled
                ? "bg-white text-black"
                : "bg-transparent text-white"
              : "bg-white text-black"
        }`}
      role="banner"
      style={{ left: "0" }}
    >
      <nav
        className="mx-auto w-full max-w-6xl h-20 md:h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between"
        style={{ zIndex: "999" }}
      >
        <Link to="/" aria-label="Inicio" className="flex items-center gap-2">
          <img
            src={logoUrl}
            alt="Club del Parque"
            className="h-8 w-auto object-contain"
            loading="eager"
          />
        </Link>

        {/* Menú hamburguesa para dispositivos pequeños */}
        <button
          className="md:hidden flex items-center justify-center p-2 rounded focus:outline-none"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 5.25h16.5m-16.5 6h16.5m-16.5 6h16.5"
            />
          </svg>
        </button>

        {/* Menú principal */}
        <div
          className={`${menuOpen ? "block" : "hidden"
            } md:flex flex-col md:flex-row items-center gap-4 absolute md:static top-16 left-0 w-full md:w-auto bg-white md:bg-transparent`}
        >
          <ul className="flex flex-col md:flex-row items-center gap-3 md:gap-6 px-4 md:px-0 text-center w-full md:w-auto justify-center">

            {/* NOTICIAS – visitante, registrado no federado, federado (no admin para no tocar navbar admin) */}
            {(isVisitante || isRegistradoNoFederado || isFederado) && (
              <li>
                <NavLink
                  to="/noticias"
                  className={({ isActive }) =>
                    `px-4 py-3 text-sm font-normal transition text-center w-full md:w-auto ${navTextColor} ${isActive ? activeItem : ""
                    }`
                  }
                >
                  Noticias
                </NavLink>
              </li>
            )}

            {/* CAMPEONATOS – federado + admin (admin queda igual que antes) */}
            {isLogged && (isFederado || isAdmin) && (
              <li>
                <NavLink
                  to="/campeonatos"
                  className={({ isActive }) =>
                    `px-4 py-3 text-sm font-normal transition text-center w-full md:w-auto ${navTextColor} ${isActive ? activeItem : ""
                    }`
                  }
                >
                  Campeonatos
                </NavLink>
              </li>
            )}

            {isLogged  && (isFederado || isAdmin) && (
              <li>
                <NavLink
                  to="/ranking"
                  className={({ isActive }) =>
                    `px-4 py-3 text-sm font-normal transition text-center w-full md:w-auto ${navTextColor} ${isActive ? activeItem : ""
                    }`
                  }
                >
                  Ranking
                </NavLink>
              </li>
            )}

            {/* RESULTADOS – federado + admin (admin queda igual; se lo sacamos al no federado) */}
            {isLogged && (isFederado || isAdmin) && (
              <li>
                <NavLink
                  to="/resultados"
                  className={({ isActive }) =>
                    `px-4 py-3 text-sm font-normal transition text-center w-full md:w-auto ${navTextColor} ${isActive ? activeItem : ""
                    }`
                  }
                >
                  Resultados
                </NavLink>
              </li>
            )}

            {/* ADMINISTRACIÓN – igual que antes, solo admin */}
            {isAdmin && (
              <li>
                <NavLink
                  to="/administracion"
                  className={({ isActive }) =>
                    `px-4 py-3 text-sm font-normal transition text-center w-full md:w-auto ${navTextColor} ${isActive ? activeItem : ""
                    }`
                  }
                >
                  Administración
                </NavLink>
              </li>
            )}
          </ul>

          {/* Zona derecha: iconos / perfil / login */}
          {isLogged ? (
            <div className="flex flex-col md:flex-row items-center gap-4 px-4 md:px-0 w-full md:w-auto justify-center">
              {/* Iconos (Chat y Notificaciones) - En móvil en la misma fila */}
              <div className="flex flex-row items-center gap-4 justify-center w-full md:w-auto">
                {/* CHAT – federado + admin (no disponible para registrados no federados) */}
                {(isFederado || isAdmin) && (
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
                          zIndex: 0,
                          minWidth: "10px",
                          textAlign: "center",
                          boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
                        }}
                      >
                        {notiCount}
                      </span>
                    )}
                  </div>
                )}

                <BellDropdown
                  color={
                    isMobile
                      ? "black"
                      : transparent
                        ? isScrolled
                          ? "black"
                          : "white"
                        : "black"
                  }
                />
              </div>

              {/* Botones (Perfil y Logout) - En móvil en la misma fila */}
              <div className="flex flex-row items-center gap-3 justify-center w-full md:w-auto">
                <button
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    justifyContent: "center",
                    backgroundColor: "var(--primario)",
                    cursor: "pointer",
                    padding: "10px 30px",
                    borderRadius: "8px",
                    color: "white",
                  }}
                  onClick={() => navigate("/perfil")}
                >
                  Perfil
                </button>

                <button
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    justifyContent: "center",
                    backgroundColor: "red",
                    cursor: "pointer",
                    padding: "10px 20px",
                    borderRadius: "8px",
                    color: "white",
                  }}
                  onClick={handleLogout}
                >
                  <svg
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
                      d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-center gap-3 px-4 md:px-0 w-full md:w-auto justify-center">
              <Link
                to="/login"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  justifyContent: "center",
                  backgroundColor: "var(--primario)",
                  cursor: "pointer",
                  padding: "10px 30px",
                  borderRadius: "8px",
                  color: "white",
                  whiteSpace: "nowrap",
                }}
              >
                Login
              </Link>

            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
