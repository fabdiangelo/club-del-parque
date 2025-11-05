import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthProvider";
import { Link } from "react-router-dom";
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
        const res = await fetch('/api/campeonatos');
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

  return (
    <div className="min-h-dvh w-full bg-base-200 text-base-content flex flex-col">
      <NavbarBlanco />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mb-5 ml-5 mt-20">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
            Campeonatos
          </h1>
          {user?.rol == "administrador" && 
            <Link to="/crear-campeonato" className="btn btn-primary mt-4">
              Crear Campeonato
            </Link>
          }

          {loading && (
            <p className="mt-4 text-sm opacity-70">Cargando campeonatos…</p>
          )}
          {fetchError && !loading && (
            <p className="mt-4 text-sm text-error">
              No se pudieron cargar los campeonatos ({fetchError}).
            </p>
          )}
        </div>
      </section>

      {/* Listado */}
      
      <section className="pb-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {!campeonatos || campeonatos.length == 0 ? (
            <div className="w-full py-16 grid place-items-center">
              <p className="text-xl">No hay campeonatos para listar</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
    </div>
  );
}
