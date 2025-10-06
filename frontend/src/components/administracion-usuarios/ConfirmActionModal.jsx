import React from 'react';

export default function ConfirmActionModal({ open, title, message, confirmLabel = 'Confirmar', onConfirm, onCancel, loading = false }) {
  if (!open) return null;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg">{title}</h3>
        <p className="py-4 whitespace-pre-line">{message}</p>
        <div className="modal-action">
          <button className="btn" onClick={onCancel} disabled={loading}>Cancelar</button>
          <button className="btn btn-error" onClick={onConfirm} disabled={loading}>{loading ? 'Procesando...' : confirmLabel}</button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onCancel}>Close</button>
      </form>
    </dialog>
  );
}
