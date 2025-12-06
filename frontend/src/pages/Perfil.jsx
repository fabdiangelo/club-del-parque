import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthProvider";
import NavbarBlanco from "../components/NavbarBlanco.jsx";
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
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/usuario/${user.uid}`, {
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
        console.log(data);
      } catch (err) {
        console.error("fetchUserData error:", err);
        setUserData(null);
      } finally {
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
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reporte/${user.uid}/solicitud-federacion`, {
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full border-primary border-t-transparent"></div>
          <p className="mt-4 text-lg">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <SinSesion />;
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <NavbarBlanco />
      <div className="max-w-3xl w-full">
        <div className="card bg-white shadow-xl border rounded-lg">
          <div className="card-body">
            <div className="flex items-center gap-4">
              <div className="avatar">
                <div className="w-20 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                      userData.nombre + " " + userData?.apellido || userData?.email || "U"
                    )}&background=0D8ABC&color=fff&size=128`}
                    alt="avatar"
                  />
                </div>
              </div>

              <div className="flex-1">
                <h1 className="text-2xl font-semibold">{userData.nombre || "Sin nombre"}</h1>
                <p className="text-sm opacity-70">{userData.email || "-"}</p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span className="badge badge-outline">{userData.rol || "usuario"}</span>
                {userData.rol === "federado" && (
                  <span
                    className={`badge badge-outline ${new Date(userData?.validoHasta) >= new Date() ? "badge-success" : "badge-error"
                      }`}
                  >
                    {new Date(userData?.validoHasta) >= new Date() ? "Activa" : "Vencida"}
                  </span>
                )}

              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
              className="bg-sky-500 text-white"
                style={{ padding: '10px 30px', borderRadius: '8px', border: '1px solid var(--primario)', cursor: 'pointer' }}
                onClick={() => navigate("/perfil/editar")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                </svg>

              </button>
              <button style={{ padding: '10px 30px', backgroundColor: 'red', color: 'white', borderRadius: '8px', cursor: 'pointer' }} onClick={handleLogout}>
                Cerrar sesión
              </button>
              {user.rol !== "administrador" && (
                <button
                  style={{ padding: '10px 30px', backgroundColor: 'var(--primario)', color: 'white', borderRadius: '8px', cursor: 'pointer' }}
                  onClick={openFederateModal}
                  disabled={userData?.estado === "federacion_pendiente"}
                >
                  Solicitar Federación
                </button>
              )}
            </div>

            <div className="divider" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-lg border shadow-sm">
                <h3 className="font-medium mb-2">Datos</h3>
                <dl>
                  <dt className="text-xs text-gray-500">Nombre</dt>
                  <dd className="mb-2">
                    {user.nombre || "-"} {userData?.apellido || ""}
                  </dd>

                  <dt className="text-xs text-gray-500">Email</dt>
                  <dd className="mb-2">{user.email || "-"}</dd>

                  <dt className="text-xs text-gray-500">Rol</dt>
                  <dd className="mb-2">{user.rol || "-"}</dd>
                </dl>
              </div>

              <div className="p-4 bg-white rounded-lg border shadow-sm">
                <h3 className="font-medium mb-2">Información adicional</h3>
                <dl>
                  <dt className="text-xs text-gray-500">Género</dt>
                  <dd className="mb-2">{userData?.genero || "-"}</dd>

                  <dt className="text-xs text-gray-500">Fecha de Nacimiento</dt>
                  <dd className="mb-2">{userData?.nacimiento || "-"}</dd>

                  {user.rol === "federado" && (
                    <>
                      <dt className="text-xs text-gray-500">Federación Válida Hasta</dt>
                      <dd className="mb-2">
                        {userData?.validoHasta
                          ? new Date(userData?.validoHasta).toLocaleDateString()
                          : "-"}
                      </dd>
                    </>
                  )}
                </dl>
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
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
              <button
                className="absolute top-2 right-2 btn btn-xs btn-circle btn-ghost"
                onClick={closeFederateModal}
                aria-label="Cerrar"
              >
                ✕
              </button>
              <h2 className="text-xl font-bold mb-2">Solicitud de Federación</h2>
              <p className="mb-4 text-sm text-gray-700">
                <strong>Importante:</strong> Los pagos <span className="text-error">no se realizan por la aplicación</span>.<br />
                Debes ingresar un justificante o explicación que permita a los administradores identificar el pago y validar tu federación.<br />
                Serás notificado por email cuando tu federación sea validada.
              </p>
              <form onSubmit={handleFederateSubmit}>
                <label
                  className="block mb-2 text-sm font-medium"
                  htmlFor="federateJustificante"
                >
                  Justificante o explicación del pago
                </label>
                <textarea
                  id="federateJustificante"
                  className="textarea textarea-bordered w-full mb-4"
                  rows={3}
                  value={federateText}
                  onChange={(e) => setFederateText(e.target.value)}
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
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={federateLoading || !federateText.trim()}
                  >
                    {federateLoading ? "Enviando..." : "Enviar solicitud"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}