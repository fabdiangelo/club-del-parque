import React from 'react';

const ReporteDefaultModal = ({ reporte, onResuelto, onClose }) => {
  return (
    <dialog id="modal-reporte" className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
          {reporte.icon && <reporte.icon className="w-5 h-5" />}
          {reporte.tipo}
        </h3>
        <p className="text-sm text-gray-500 mb-1">Usuario: <span className="font-semibold">{reporte.mailUsuario}</span></p>
        <p className="text-sm text-gray-500 mb-1">Fecha: <span className="font-semibold">{new Date(reporte.fecha).toLocaleDateString()}</span></p>
        <p className="text-sm text-gray-500 mb-4">Motivo: <span className="font-semibold">{reporte.motivo}</span></p>
        <p className="text-sm text-gray-500 mb-4">Descripción: <span className="font-semibold">{reporte.descripcion}</span></p>
        <div className="flex flex-col gap-2">
          <button
            className="btn btn-info"
            onClick={() => onResuelto(reporte.id)}
          >
            Marcar como resuelto
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

export default ReporteDefaultModal;
