import { Trophy, Calendar, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function CampeonatoData({id = '', nombre = '', descripcion = '', inicio = '01-01-2000', fin = '01-01-2000', requisitosParticipacion = {}, rol = '', onRefresh, conRedireccion = false}) {
  const [procesandoInscripcion, setProcesandoInscripcion] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  async function handleInscripcion() {
    try {
      setProcesandoInscripcion(true)
      const res = await fetch(`/api/campeonato/${id}`, {
        method: 'POST',
        credentials: 'include'
      });
      if (res.ok) {
        if(onRefresh){
          const data = await res.json();
          onRefresh(data)
        }
      } 
    } catch (e) {
      console.log(e)
    } finally {
      setProcesandoInscripcion(false)
    }
  }

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
          <h1 className="text-3xl font-bold text-gray-800">{nombre}</h1>
        </div>
        <p className="text-gray-600 mb-3 whitespace-pre-line">{descripcion}</p>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>{new Date(inicio).toLocaleDateString()} - {new Date(fin).toLocaleDateString()}</span>
        </div>
        <div>
          <button className='btn btn-info w-full md:w-auto mt-4' onClick={handleInscripcion} disabled={procesandoInscripcion} >{procesandoInscripcion ? 'Inscribiendo...' : 'Inscribirme'}</button>
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
                <div className="text-sm text-gray-600">
                  <p className="mb-2">Nota: En caso de abandono de un partido se considerará como partido perdido. Si esto ocurre de forma reiterada, el equipo de administración podrá imponer sanciones.</p>
                </div>
                <div className="mt-4 text-right flex gap-2 justify-end">
                  <button className="btn btn-sm btn-primary" onClick={() => setModalOpen(false)}>Cerrar</button>
                </div>
              </div>
            </div>
          )}
        </div>
          {conRedireccion && (
            <Link to={`/campeonato/${id}`} className="btn btn-sm btn-outline w-100 w-full mt-4">VER MÁS</Link>
          )}
      </div>
    </div>

  );
};