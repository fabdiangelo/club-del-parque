import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthProvider";
import { useNavigate } from "react-router-dom";
import logoUrl from "../assets/Logo.svg";
import { useNotification } from "../contexts/NotificacionContext";


export default function NavbarBlanco({ transparent }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {notiCount} = useNotification();

  console.log(user)

  const navItem =
    `px-4 py-2 text-sm sm:text-base font-normal transition ${transparent ? "text-white/90 hover:text-white" : "text-black/90 hover:text-black"}`;
  const activeItem = transparent ? "text-white": "text-black";

  return (
    <header
      className={`w-full top-0 z-[200] fixed transition-colors duration-300 ${transparent ? "backdrop-blur text-white" : "bg-white"}`}
      role="banner"
      style={{'left': '0'}}
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
              to="/reportes"
              className={({ isActive }) => `${navItem} ${isActive ? activeItem : ""}`}
            >
              Reportes
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
          { user?.rol == "administrador" &&
            <li>
              <NavLink
                to="/administracion"
                className={({ isActive }) => `${navItem} ${isActive ? activeItem : ""}`}
              >
                Administracion
              </NavLink>
            </li>
          }
          
        </ul>

        <div className="flex items-center gap-3">
          {user ?
            <>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="black" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
</svg>

            <div style={{ position: 'relative', display: 'inline-block' }}>
  <svg
    style={{ cursor: 'pointer' }}
    onClick={() => navigate('/chats')}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="size-6"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
  </svg>
  {notiCount > 0 && (
    <span
      style={{
        position: 'absolute',
        top: '-6px',
        right: '-6px',
        background: '#0D8ABC',
        color: '#fff',
        borderRadius: '50%',
        padding: '1px 4px',
        fontSize: '0.7em',
        fontWeight: 700,
        zIndex: 10,
        minWidth: '10px',
        textAlign: 'center',
        boxShadow: '0 1px 4px rgba(0,0,0,0.12)'
      }}
    >
      {notiCount}
    </span>
  )}
</div>
              <button 
                className="rounded-full bg-sky-600 px-6 py-2 text-white font-medium hover:bg-sky-500 hover:text-white transition"
                onClick={() => navigate('/perfil')}> 
                Perfil 
              </button>
            </>
          :
            <Link
            to="/login"
            className="rounded-full bg-sky-600 px-6 py-2 text-white font-medium hover:bg-sky-500 hover:text-white transition"
            >
              Login
            </Link>
          }
        </div>
      </nav>
    </header>
  );
}
