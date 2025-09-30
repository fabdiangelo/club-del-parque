import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthProvider";
import Navbar from "../components/Navbar.jsx";
import SinSesion from "../components/SinSesion.jsx";

export default function Perfil() {
  const [loadingUser, setLoadingUser] = useState(true);
  const [userData, setUserData] = useState(null);
  const { user, loading, error, logout } = useAuth();
  const navigate = useNavigate();
  const [showFederateModal, setShowFederateModal] = useState(false);
  const [federateText, setFederateText] = useState("");
  const [federateLoading, setFederateLoading] = useState(false);

  const handleLogout = async () => {
    const ok = await logout();
    if (ok) {
      navigate("/login");
    } else {
      console.error("Logout falló");
    }
  };

  useEffect(() => {
    if (!user) {
      setLoadingUser(false);
      return;
    }
    const fetchUserData = async () => {
      setLoadingUser(true);
      try {
        const res = await fetch(`/api/usuario/${user.uid}`, {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        if (res.status === 204 || res.status === 401) {
          setUserData(null);
          setLoadingUser(false);
          return;
        }
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`Unexpected /usuario response: ${res.status} ${txt}`);
        }
        const data = await res.json();
        setUserData(data);
        setLoadingUser(false);
      } catch (err) {
        console.error("fetchUserData error:", err);
        setUserData(null);
        setLoadingUser(false);
      }
    };
    fetchUserData();
  }, [user]);

  // Modal federar
  const openFederateModal = () => {
    setFederateText("");
    setShowFederateModal(true);
  };
  const closeFederateModal = () => {
    setShowFederateModal(false);
    setFederateLoading(false);
  };

  const handleFederateSubmit = async (e) => {
    e.preventDefault();
    if (!user || !federateText.trim()) return;
    setFederateLoading(true);
    try {
      const res = await fetch(`api/usuario/${user.uid}/solicitud-federacion`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ justificante: federateText }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Unexpected /federar response: ${res.status}`);
      }
      closeFederateModal();
      alert("Solicitud de federación enviada. Serás notificado por email cuando se valide tu federación.");
    } catch (err) {
      setFederateLoading(false);
      console.error("Federation request error:", err);
      alert(`Error al solicitar federación: ${err.message || String(err)}`);
    }
  };

  // Loading state
  if (loading || loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="text-center">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full border-primary border-t-transparent"></div>
          <p className="mt-4 text-lg">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return ( <SinSesion /> );
  }

  // Authenticated view
  return (
    <div className="min-h-screen bg-base-200 py-12 px-4" style={{ paddingTop: "6rem" }}>
      <Navbar />
      <div className="max-w-3xl mx-auto">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex items-center gap-4">
              <div className="avatar">
                <div className="w-20 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user.nombre || user.email || "U"
                    )}&background=0D8ABC&color=fff&size=128`}
                    alt="avatar"
                  />
                </div>
              </div>

              <div className="flex-1">
                <h1 className="text-2xl font-semibold">
                  {user.nombre || "Sin nombre"}
                </h1>
                <p className="text-sm opacity-70">{user.email}</p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span className="badge badge-outline">
                  {user.rol || user.role || "user"}
                </span>
                <div className="btn-group">
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => navigate("/perfil/editar")}
                  >
                    Editar
                  </button>
                  <button className="btn btn-sm btn-error" onClick={handleLogout}>
                    Cerrar sesión
                  </button>
                  <button className="btn btn-sm btn-info" onClick={openFederateModal}>
                    Solicitar Federación
                  </button>
                </div>
              </div>
            </div>

            <div className="divider" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-base-200 rounded-lg">
                <h3 className="font-medium mb-2">Datos</h3>
                <dl>
                  <dt className="text-xs text-gray-500">Nombre</dt>
                  <dd className="mb-2">{user.nombre || "-"}</dd>

                  <dt className="text-xs text-gray-500">Email</dt>
                  <dd className="mb-2">{user.email || "-"}</dd>

                  <dt className="text-xs text-gray-500">Rol</dt>
                  <dd className="mb-2">{user.rol || user.role || "-"}</dd>
                </dl>
              </div>

              <div className="p-4 bg-base-200 rounded-lg">
                <h3 className="font-medium mb-2">Información adicional</h3>
                <pre className="text-xs bg-base-100 p-3 rounded overflow-auto">
                  {JSON.stringify(user, null, 2)}
                  {JSON.stringify(userData, null, 2)}
                </pre>
              </div>
            </div>

            {error && (
              <div className="mt-4">
                <div className="alert alert-error shadow-lg">
                  <div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="stroke-current flex-shrink-0 h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M10 14l2-2m0 0l2-2m-2 2v6m0-10a4 4 0 100-8 4 4 0 000 8z"
                      />
                    </svg>
                    <span>{error.message || String(error)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal federar */}
        {showFederateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-base-100 rounded-lg shadow-lg max-w-md w-full p-6 relative">
              <button
                className="absolute top-2 right-2 btn btn-xs btn-circle btn-ghost"
                onClick={closeFederateModal}
                aria-label="Cerrar"
              >✕</button>
              <h2 className="text-xl font-bold mb-2">Solicitud de Federación</h2>
              <p className="mb-4 text-sm text-gray-700">
                <strong>Importante:</strong> Los pagos <span className="text-error">no se realizan por la aplicación</span>.<br />
                Debes ingresar un justificante o explicación que permita a los administradores identificar el pago y validar tu federación.<br />
                Serás notificado por email cuando tu federación sea validada.
              </p>
              <form onSubmit={handleFederateSubmit}>
                <label className="block mb-2 text-sm font-medium" htmlFor="federateJustificante">
                  Justificante o explicación del pago
                </label>
                <textarea
                  id="federateJustificante"
                  className="textarea textarea-bordered w-full mb-4"
                  rows={3}
                  value={federateText}
                  onChange={e => setFederateText(e.target.value)}
                  required
                  placeholder="Ejemplo: Transferencia bancaria, fecha, monto, referencia, etc."
                  disabled={federateLoading}
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={closeFederateModal}
                    disabled={federateLoading}
                  >Cancelar</button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={federateLoading || !federateText.trim()}
                  >{federateLoading ? "Enviando..." : "Enviar solicitud"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <button className="btn btn-outline" onClick={() => navigate("/")}>Volver</button>
        </div>
      </div>
    </div>
  );
}
