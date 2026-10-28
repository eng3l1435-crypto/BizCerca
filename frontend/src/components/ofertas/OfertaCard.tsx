import React from 'react';

interface OfertaProps {
  oferta: {
    id?: string;
    _id?: string;
    titulo: string;
    descripcion: string;
    precio?: number;
    tipo?: 'servicio' | 'producto' | string;
    categorias_tags?: string[];
    categoria?: string;
    activo?: boolean;
    usuario_nombre?: string;
  };
  onContactar?: () => void;
}

export const OfertaCard: React.FC<OfertaProps> = ({ oferta, onContactar }) => {
  const tags = Array.isArray(oferta.categorias_tags) && oferta.categorias_tags.length > 0
    ? oferta.categorias_tags
    : [oferta.categoria || 'General'];

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between group">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200/60"
              >
                {tag}
              </span>
            ))}
          </div>
          {oferta.tipo && (
            <span className="text-[10px] font-semibold tracking-wider uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
              {oferta.tipo}
            </span>
          )}
        </div>

        <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-base line-clamp-1">
          {oferta.titulo}
        </h3>
        <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
          {oferta.descripcion}
        </p>
      </div>

      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">
            Precio estimado
          </span>
          <span className="text-base font-extrabold text-slate-900">
            {typeof oferta.precio === 'number' ? `$${oferta.precio.toLocaleString('es-MX')}` : 'A convenir'}
          </span>
        </div>

        <button
          onClick={onContactar}
          className="bg-slate-900 hover:bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer shadow-xs"
        >
          Solicitar
        </button>
      </div>
    </div>
  );
};