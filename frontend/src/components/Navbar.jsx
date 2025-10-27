import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthProvider";
import { useNavigate } from "react-router-dom";
import logoUrl from "../assets/Logo.svg";
import { useNotification } from "../contexts/NotificacionContext.jsx";
import BellDropdown from "./BellDropdown.jsx";

export default function Navbar({ transparent, color }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { notiCount } = useNotification();

  console.log(user);

  const whichColorBg = () => {
    if (color !== "white") return "bg-neutral-900";
    else return "bg-white";
  }

  const whichColorText = () => {
    if (transparent) return "text-white"; // Mantener el texto blanco si es transparente
    if (color !== "white") return "text-white/90";
    return "text-black/90";
  };

  const navItem =
    "px-4 py-2 text-sm  font-normal " + whichColorText() + " hover:+" + whichColorText() + " transition";
  const activeItem = {  color: color === "white" ? "black" : "white" };

  return (
    <header
      className={`w-full fixed top-0 z-[200] transition-colors duration-300 ${transparent ? "backdrop-blur" : whichColorBg()}`}
      role="banner"
      style={{ left: "0" }}
    >

      <div className="hidden md:block">
<nav  className="h-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <Link to="/" aria-label="Inicio" className="flex items-center gap-2">
          <img
            src={logoUrl}
            alt="Club del Parque"
            className="h-8 w-auto object-contain"
            loading="eager"
          />
        </Link>

        
        <div className="flex items-center gap-3">

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
              to="/reportes"
              className={({ isActive }) =>
                `${navItem} ${isActive ? activeItem : ""}`
              }
            >
              Reportes
            </NavLink>
          </li>

          {user && (
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
          )}

          {user && (
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
          )}

          {user && (
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
          )}

          {
            user && (
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
            )
          }

        </ul>

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
                  stroke={`${transparent ? "white" : color === "white" ? "black" : "white" }`}
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
              <BellDropdown color={`${transparent ? "white" : color === "white" ? "black" : "white" }`} />
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
      </div>

      <nav className="z-100 fixed bottom-0 left-0 right-0 bg-neutral-800 text-white shadow-inner border-t border-neutral-700 flex justify-around items-center h-14 md:hidden z-[300]">
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
