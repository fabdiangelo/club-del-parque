import React, { useEffect, useState } from 'react';

export default function FederarUsuarioModal({ open, usuario, onClose, onFederar }) {
  const [planes, setPlanes] = useState([]);
  const [loadingPlanes, setLoadingPlanes] = useState(true);
  const [errorPlanes, setErrorPlanes] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [precargaLoading, setPrecargaLoading] = useState(false);
  const [precargaError, setPrecargaError] = useState(null);

  useEffect(() => {
    if (!open) return;
    fetchPlanes();
  }, [open]);

  const fetchPlanes = async () => {
    try {
      setLoadingPlanes(true);
      const res = await fetch('/api/planes', { credentials: 'include' });
      if (!res.ok) throw new Error('Error al obtener los planes');
      const data = await res.json();
      setPlanes(data);
    } catch (err) {
      setErrorPlanes(err.message || String(err));
      setPlanes([]);
    } finally {
      setLoadingPlanes(false);
    }
  };

  const handlePrecargaPlanes = async () => {
    setPrecargaLoading(true);
    setPrecargaError(null);
    try {
      const res = await fetch('/api/planes/precarga', { method: 'POST', credentials: 'include' });
      if (!res.ok) throw new Error('Error al precargar los planes');
      await fetchPlanes();
    } catch (err) {
      setPrecargaError(err.message || String(err));
    } finally {
      setPrecargaLoading(false);
    }
  };

  if (!open) return null;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-md">
        <h3 className="font-bold text-lg mb-2">Federar usuario</h3>
        <p className="text-sm text-gray-500 mb-3">Usuario: <span className="font-semibold">{usuario?.nombre} {usuario?.apellido} ({usuario?.email})</span></p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de plan:</label>
          {loadingPlanes ? (
            <span className="text-xs text-gray-400">Cargando planes...</span>
          ) : errorPlanes ? (
            <span className="text-xs text-red-500">{errorPlanes}</span>
          ) : (
            <>
              <select className="select select-bordered w-full mb-2" value={selectedPlan} onChange={e => setSelectedPlan(e.target.value)} style={{ color: '#000' }}>
                <option value="">{planes.length === 0 ? 'No se han registrado planes de subscripcion' : 'Seleccione un plan'}</option>
                {planes.map(plan => (
                  <option key={plan.id} value={plan.id}>{plan.tipo}</option>
                ))}
              </select>
              <div className="flex items-center mb-2">
                <span className="text-xs text-gray-500 mr-2">¿No encuentras los planes que buscas?</span>
                <button className="btn btn-xs btn-outline btn-secondary" onClick={handlePrecargaPlanes} disabled={precargaLoading} type="button">
                  {precargaLoading ? 'Precargando...' : 'Precargar'}
                </button>
              </div>
              {precargaError && <span className="text-xs text-red-500">{precargaError}</span>}
            </>
          )}
        </div>

        <div className="flex gap-2 justify-end">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={() => onFederar(usuario?.id, selectedPlan)} disabled={!selectedPlan}>Federar</button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>Cerrar</button>
      </form>
    </dialog>
  );
}
