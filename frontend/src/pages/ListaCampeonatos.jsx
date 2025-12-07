import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthProvider";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import NavbarBlanco from '../components/NavbarBlanco.jsx';
import CampeonatoData from "../components/campeonato/CampeonatoData";

export default function ListaCampeonatos() {
  const [campeonatos, setCampeonatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    async function load() {
      setLoading(true);
      setFetchError("");
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/campeonatos`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setCampeonatos(Array.isArray(data) ? data : []);
      } catch (err) {
        setFetchError(err?.message || "Error desconocido");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full border-primary border-t-transparent"></div>
          <p className="mt-4 text-lg">Cargando campeonatos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh w-full bg-base-200 text-base-content flex flex-col bg-white">
      <NavbarBlanco />

      {/* Hero */}
      <section className="relative overflow-hidden" >
        <div className="my-5 ml-5 mt-30 " >

          {user?.rol === "administrador" && (
            <Link
              to="/crear-campeonato"
              className="fixed bottom-6 right-6 bg-[var(--primario)] text-white w-14 h-14 rounded-full flex items-center justify-center text-4xl shadow-xl hover:scale-110 transition-transform"
            >
              +
            </Link>
          )}




          {fetchError && !loading && (
            <p className="mt-4 text-sm text-error" style={{ color: 'black' }}>
              No se pudieron cargar los campeonatos ({fetchError}).
            </p>
          )}
        </div>
      </section>

      {/* Listado */}

      <section className="pb-20">
        <div className="mx-auto max-w-2xl px-6 lg:px-8">
          {!campeonatos || campeonatos.length == 0 ? (
            <div className="w-full py-16 grid place-items-center">
            </div>
          ) : (
            <div className="">
              {console.log(campeonatos)}
              {campeonatos.map((campeonato) => (
                <CampeonatoData
                  key={campeonato.id}
                  id={campeonato.id}
                  nombre={campeonato.nombre}
                  descripcion={campeonato.descripcion}
                  inicio={campeonato.inicio}
                  fin={campeonato.fin}
                  requisitosParticipacion={campeonato.requisitosParticipacion}
                  user={user}
                  participantes={campeonato.federadosCampeonatoIDs}
                  conRedireccion={true}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
