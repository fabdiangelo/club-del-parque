import { Trophy, Calendar, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function CampeonatoData({id = '', nombre = '', descripcion = '', inicio = '01-01-2000', fin = '01-01-2000', requisitosParticipacion = {}, user = {}, participantes = [], onRefresh, conRedireccion = false}) {
  const [procesando, setProcesando] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalAdminOpen, setModalAdminOpen] = useState(false)
  const [inscripto, setInscripto] = useState(false)

  const [form, setForm] = useState({
    nombre: nombre,
    descripcion: descripcion,
    inicio: inicio,
  });

  const [display, setDisplay] = useState({
    nombre: nombre,
    descripcion: descripcion,
    inicio: inicio,
    fin: fin,
  });

  const cantDias = diasEntreFechas(display.inicio, display.fin)

  useEffect(() =>{
    setForm({
      nombre: nombre,
      descripcion: descripcion,
      inicio: inicio,
    })
    setDisplay({
      nombre: nombre,
      descripcion: descripcion,
      inicio: inicio,
      fin: fin,
    })
  }, [id, nombre, descripcion, inicio])

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  function diasEntreFechas(fecha1, fecha2) {
    const f1 = new Date(fecha1);
    const f2 = new Date(fecha2);

    if (isNaN(f1) || isNaN(f2)) return 0;

    const diferenciaMs = Math.abs(f2 - f1);
    const dias = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));
    return dias;
  }

  async function handleInscripcion() {
    try {
      setProcesando(true)
      const res = await fetch(`/api/federado-campeonato/${id}/${user.uid}`, {
        method: 'POST',
        credentials: 'include'
      });
      if (res.ok) {
        setInscripto(true);
        if(onRefresh){
          onRefresh();
        }

      } 
    } catch (e) {
      console.log(e);
    } finally {
      setProcesando(false);
    }
  }

  const handleEditar = async (e) => {
    e.preventDefault();
    setProcesando(true);
    try {
      const inicioDate = new Date(form.inicio);
      const finDate = new Date(inicioDate.getTime() + (cantDias * 24 * 60 * 60 * 1000));
      const dateFin = finDate.toISOString();
      const payload = {
        nombre: form.nombre,
        descripcion: form.descripcion,
        inicio: form.inicio,
        fin: dateFin,
      };

      const res = await fetch(`/api/campeonato/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Error actualizando campeonato: ${res.status}`);
      }

      setDisplay({
        nombre: form.nombre,
        descripcion: form.descripcion,
        inicio: form.inicio,
        fin: dateFin,
      });
      if(onRefresh){
        onRefresh()
      }
    } catch (err) {
      console.error("update error:", err);
    }  finally {
      setProcesando(false);
      setModalAdminOpen(false);
    }
  };

  function renderCondicion(label, value, isGenero = false) {
    if (value === null || value === undefined) {
      return (
        <div className="flex justify-between py-1">
          <span className="text-sm text-gray-700">{label}</span>
          <span className="text-sm text-gray-500">No aplica</span>
        </div>
      )
    }

    return (
      <div className="flex justify-between py-1">
        <span className="text-sm text-gray-700">{label}</span>
        <span className="text-sm text-gray-600">{String(value)}</span>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto mb-8">
      <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-3">
          <Trophy className="w-8 h-8 text-cyan-500" />
          <h1 className="text-3xl font-bold text-gray-800">{display.nombre}</h1>
        </div>
        <p className="text-gray-600 mb-3 whitespace-pre-line">{display.descripcion}</p>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>{new Date(display.inicio).toLocaleDateString()} - {new Date(display.fin).toLocaleDateString()}</span>
        </div>

        {(user?.rol == 'federado' && (participantes.map(part => part.split('federado-')[1].split('-')[0]).includes(user.uid) || inscripto)) &&
          <div className='m-3'>
            <span className="text-sm bg-success p-3 mt-8 rounded-md">Inscripto</span>
            
          </div>
        }

        {(user?.rol == 'federado' && new Date(display.inicio) >= new Date() && !(participantes.map(part => part.split('federado-')[1].split('-')[0]).includes(user.uid) || inscripto)) &&
          <div>
            <span className="text-sm opacity-90">{participantes.length} Usuarios Inscriptos</span> <br />
            <button className='btn btn-info w-full md:w-auto mt-4' onClick={handleInscripcion} disabled={procesando} >{procesando ? 'Inscribiendo...' : 'Inscribirme'}</button>
            <div className="flex items-center gap-2 mt-4">
              <span className="text-sm opacity-70">¿No estás seguro si puedes participar en este torneo?</span>
              <button 
                className="btn btn-sm btn-outline btn-secondary" 
                type="button"
                onClick={() => setModalOpen(true)}
              >
                VER CONDICIONES DE PARTICIPACION
              </button>
            </div>
            {modalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black opacity-40" onClick={() => setModalOpen(false)} />
                <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
                  <button className="absolute top-3 right-3 p-1 rounded-md hover:bg-gray-100" onClick={() => setModalOpen(false)} aria-label="Cerrar">
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                  <h2 className="text-xl font-semibold mb-3">Condiciones de participación</h2>
                  <div className="text-sm text-gray-700 mb-4">
                    <p className="mb-2">A continuación se muestran los requisitos para participar en este campeonato. Si un campo indica "No aplica", significa que no se exige esa condición.</p>
                    <div className="bg-gray-50 border border-gray-100 rounded-md p-3">
                      {renderCondicion('Género', requisitosParticipacion.genero ?? null, true)}
                      {renderCondicion('Edad desde', requisitosParticipacion.edadDesde ?? null)}
                      {renderCondicion('Edad hasta', requisitosParticipacion.edadHasta ?? null)}
                      {renderCondicion('Ranking desde', requisitosParticipacion.rankingDesde ?? null)}
                      {renderCondicion('Ranking hasta', requisitosParticipacion.rankingHasta ?? null)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        }

        {(user?.rol == 'federado' && new Date(display.inicio) < new Date()) &&
          <div className="flex items-center gap-2 mt-4">
            <span className="text-sm opacity-70">Periodo de inscripción finalizado</span>
          </div>
        }


        {user?.rol == 'administrador' &&
          <div>
            <button className='btn btn-info w-full md:w-auto mt-4' onClick={() => setModalAdminOpen(true)} disabled={procesando} >{procesando ? 'Editando...' : 'Editar'}</button>
            {modalAdminOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black opacity-40" onClick={() => setModalAdminOpen(false)} />
                <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
                  <button className="absolute top-3 right-3 p-1 rounded-md hover:bg-gray-100" onClick={() => setModalAdminOpen(false)} aria-label="Cerrar">
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                  <h2 className="text-xl font-semibold mb-3">Editar Campeonato</h2>
                  <form onSubmit={handleEditar} className="grid grid-cols-1 gap-4 mt-4">
                    <div>
                      <label className="block text-sm">Nombre</label>
                      <input name="nombre" value={form.nombre} onChange={handleChange} className="input input-bordered w-full" required />
                    </div>
                    <div>
                      <label className="block text-sm">Descripcion</label>
                      <textarea name="descripcion" value={form.descripcion} onChange={handleChange} className="textarea textarea-bordered w-full" />
                    </div>
                    <div>
                      <label className="block text-sm">Inicio</label>
                      <input name="inicio" type="date" value={form.inicio || ''} onChange={handleChange} className="input input-bordered w-full" />
                    </div>
                    <div className="mt-4 flex gap-2 justify-end">
                      <button type="button" className="btn btn-ghost" onClick={() => setModalAdminOpen(false)}>Cancelar</button>
                      <button type="submit" className="btn btn-primary" disabled={procesando}>{procesando ? 'Editando...' : 'Editar'}</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        }
        {conRedireccion && (
          <Link to={`/campeonato/${id}`} className="btn btn-sm btn-outline w-100 w-full mt-4">VER MÁS</Link>
        )}
      </div>
    </div>

  );
};