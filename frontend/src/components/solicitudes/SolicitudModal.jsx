import React, { useState } from 'react';

export const SolicitudModal = ({ solicitud, onClose, onEliminar }) => {
  const [eliminando, setEliminando] = useState(false);
  const [confirmar, setConfirmar] = useState(false);

  if (!solicitud) return null;

  const handleEliminar = async () => {
    setEliminando(true);
    try {
      const id = solicitud.id ?? solicitud._id ?? solicitud.id_solicitud;
      await onEliminar(id);
      onClose();
    } catch (error) {
      console.error('Error al eliminar la solicitud:', error);
      setEliminando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Contenedor Modal */}
      <div 
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-100">
              {solicitud.categoria}
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-2 leading-snug">
              {solicitud.servicio}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition"
          >
            ✕
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-6 space-y-4 text-xs sm:text-sm text-slate-600">
          <div>
            <h4 className="font-semibold text-slate-800 text-xs uppercase tracking-wide mb-1">
              Descripción del requerimiento
            </h4>
            <p className="leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100 whitespace-pre-line text-slate-700">
              {solicitud.descripcion}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-400 block font-medium">Ubicación / Modalidad</span>
              <strong className="text-slate-800 text-xs sm:text-sm">{solicitud.zona_general}</strong>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-400 block font-medium">Plazo estimado</span>
              <strong className="text-slate-800 text-xs sm:text-sm">{solicitud.fecha_plazo_aproximado}</strong>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 pt-1">
            <span>Identificador: </span>
            <code className="text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
              {solicitud.id ?? solicitud._id ?? solicitud.id_solicitud}
            </code>
          </div>
        </div>

        {/* Pie de acción */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          {!confirmar ? (
            <button
              type="button"
              onClick={() => setConfirmar(true)}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-xl border border-rose-200 transition"
            >
              Eliminar solicitud
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-rose-600 font-medium">¿Confirmar?</span>
              <button
                type="button"
                disabled={eliminando}
                onClick={handleEliminar}
                className="text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-xl transition disabled:opacity-50"
              >
                {eliminando ? 'Borrando...' : 'Sí, eliminar'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmar(false)}
                className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1.5"
              >
                Cancelar
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl transition shadow-xs"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};