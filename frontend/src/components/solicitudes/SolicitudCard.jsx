import React from 'react';

const SolicitudCard = ({ solicitud, onVerDetalle }) => {
  const nombreRequerimiento = solicitud.titulo || solicitud.servicio || 'Sin título';
  const tags = Array.isArray(solicitud.categorias_tags) && solicitud.categorias_tags.length > 0
    ? solicitud.categorias_tags
    : [solicitud.categoria || 'General'];

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between group">
      <div>
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {tags.map((tag, idx) => (
            <span
              key={idx}
              className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-100/80"
            >
              {tag}
            </span>
          ))}
        </div>

        <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
          {nombreRequerimiento}
        </h3>
        <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
          {solicitud.descripcion}
        </p>
      </div>

      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <span>
          Plazo: <strong className="text-slate-700">{solicitud.fecha_plazo_aproximado}</strong>
        </span>
        <button
          onClick={onVerDetalle}
          className="font-semibold text-indigo-600 hover:text-indigo-800 text-[11px] flex items-center gap-1 cursor-pointer"
        >
          Ver detalles <span>→</span>
        </button>
      </div>
    </div>
  );
};

export default SolicitudCard;