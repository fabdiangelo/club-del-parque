import React, { useEffect, useState } from 'react';

const ReporteFederacionModal = ({ reporte, onValidar, onNegar, onClose }) => {
  const [precargaLoading, setPrecargaLoading] = useState(false);
  const [precargaError, setPrecargaError] = useState(null);
  const [planes, setPlanes] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [loadingPlanes, setLoadingPlanes] = useState(true);
  const [errorPlanes, setErrorPlanes] = useState(null);

  const fetchPlanes = async () => {
    try {
      setLoadingPlanes(true);
      const res = await fetch('/api/planes', { credentials: 'include' });
      if (!res.ok) throw new Error('Error al obtener los planes');
      const data = await res.json();
      setPlanes(data);
      setLoadingPlanes(false);
    } catch (err) {
      setPlanes([]);
      setErrorPlanes(err.message);
      setLoadingPlanes(false);
    }
  };

  useEffect(() => {
    fetchPlanes();
  }, []);

  const handlePrecargaPlanes = async () => {
    setPrecargaLoading(true);
    setPrecargaError(null);
    try {
      const res = await fetch('/api/planes/precarga', { method: 'POST', credentials: 'include' });
      if (!res.ok) throw new Error('Error al precargar los planes');
      // Recargar lista de planes después de precarga
      await fetchPlanes();
    } catch (err) {
      setPrecargaError(err.message);
    }
    setPrecargaLoading(false);
  };

  return (
    <dialog id="modal-reporte" className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
          {/* Icono y tipo */}
          {reporte.icon && <reporte.icon className="w-5 h-5" />}
          {reporte.tipo}
        </h3>
        <p className="text-sm text-gray-500 mb-1">Usuario: <span className="font-semibold">{reporte.mailUsuario}</span></p>
        <p className="text-sm text-gray-500 mb-1">Fecha: <span className="font-semibold">{new Date(reporte.fecha).toLocaleDateString()}</span></p>
        <p className="text-sm text-gray-500 mb-4">Motivo: <span className="font-semibold">{reporte.motivo}</span></p>
        <p className="text-sm text-gray-500 mb-4">Descripción: <span className="font-semibold">{reporte.descripcion}</span></p>
        {/* Dropdown de planes */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de plan:</label>
          {loadingPlanes ? (
            <span className="text-xs text-gray-400">Cargando planes...</span>
          ) : errorPlanes ? (
            <span className="text-xs text-red-500">{errorPlanes}</span>
          ) : (
            <>
              <select
                className="select select-bordered w-full mb-2"
                value={selectedPlan}
                onChange={e => setSelectedPlan(e.target.value)}
                disabled={planes.length === 0}
                style={{ color: '#000' }}
              >
                <option value="">{planes.length === 0 ? 'No se han registrado planes de subscripcion' : 'Seleccione un plan'}</option>
                {planes.map(plan => (
                  <option style={{ color: '#000' }} key={plan.id} value={plan.id}>{plan.tipo}</option>
                ))}
              </select>
              <div className="flex items-center mb-2">
                <span className="text-xs text-gray-500 mr-2">¿No encuentras los planes que buscas?</span>
                <button
                  className="btn btn-xs btn-outline btn-secondary"
                  onClick={handlePrecargaPlanes}
                  disabled={precargaLoading}
                  type="button"
                  style={{ minWidth: '90px', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                >
                  {precargaLoading ? 'Precargando...' : 'Precargar'}
                </button>
              </div>
              {precargaError && (
                <span className="text-xs text-red-500 ml-2">{precargaError}</span>
              )}
            </>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <button
            className="btn btn-success"
            onClick={() => onValidar(reporte.id, selectedPlan)}
            disabled={!selectedPlan}
          >
            Validar federación
          </button>
          <button
            className="btn btn-error"
            onClick={() => onNegar(reporte.id)}
          >
            Negar federación
          </button>
          <button
            className="btn"
            onClick={onClose}
          >
            No hacer nada de momento
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>Cerrar</button>
      </form>
    </dialog>
  );
};

export default ReporteFederacionModal;
