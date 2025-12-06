import { useNavigate } from "react-router-dom";

export default function SinSesion() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-6 bg-white">
      <div className="card w-full max-w-md bg-base-100 bg-white">
        <div className="card-body text-center">
          <h2 className="card-title">No hay sesión activa</h2>
          <p>Inicia sesión para ver los detalles de esta página.</p>
          <div className="card-actions justify-center mt-4">
            <button
              className="btn btn-primary"
              onClick={() => navigate("/login")}
            >
              Ir a Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}