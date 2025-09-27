import { useNavigate } from "react-router-dom";

export default function SoloAdmin() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-6">
      <div className="card w-full max-w-md bg-base-100 shadow-md">
        <div className="card-body text-center">
          <h2 className="card-title">Contenido Bloqueado</h2>
          <p>Lo sentimos, debes registrarte como administrador para acceder a este contenido.</p>
          <div className="card-actions justify-center mt-4">
            <button
              className="btn btn-primary"
              onClick={() => navigate("/")}
            >
              Volver al Inicio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}