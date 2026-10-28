import React, { useEffect, useState } from 'react';
import { listarOfertas, crearOferta } from '../services/api';
import { OfertaCard } from '../components/ofertas/OfertaCard';
import { CrearOfertaModal } from '../components/ofertas/CrearOfertaModal';

export const OfertasPage: React.FC = () => {
  const [ofertas, setOfertas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'servicio' | 'producto'>('todos');

  const cargarOfertas = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listarOfertas();
      setOfertas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al listar ofertas:', err);
      setError('No se pudo cargar el catálogo de ofertas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarOfertas();
  }, []);

  const handleCrearOferta = async (payload: any) => {
    await crearOferta(payload);
    cargarOfertas();
  };

  const ofertasFiltradas = filtroTipo === 'todos'
    ? ofertas
    : ofertas.filter((o) => o.tipo?.toLowerCase() === filtroTipo);

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Banner */}
        <div className="bg-gradient-to-r from-violet-950 via-slate-900 to-slate-900 rounded-3xl p-8 text-white shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-xs font-semibold tracking-wider uppercase text-violet-400">
              Catálogo de Servicios y Productos
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
              Marketplace de Ofertas
            </h1>
            
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={cargarOfertas}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-medium border border-white/10 transition backdrop-blur-sm cursor-pointer"
            >
              Actualizar
            </button>
            <button
              onClick={() => setModalAbierto(true)}
              className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/30 transition cursor-pointer flex items-center gap-1.5"
            >
              <span>+</span> Publicar Oferta
            </button>
          </div>
        </div>

        {/* Filtros de Tipo */}
        <div className="flex items-center gap-2">
          {(['todos', 'servicio', 'producto'] as const).map((tipo) => (
            <button
              key={tipo}
              onClick={() => setFiltroTipo(tipo)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition cursor-pointer ${
                filtroTipo === tipo
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tipo === 'todos' ? 'Todas las ofertas' : `${tipo}s`}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-medium">
            {error}
          </div>
        )}

        {/* Grid de Ofertas */}
        {loading ? (
          <div className="p-16 text-center text-xs text-slate-400">
            Cargando ofertas disponibles...
          </div>
        ) : ofertasFiltradas.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-16 text-center">
            <p className="text-slate-500 text-sm font-medium">
              No hay ofertas publicadas en esta sección.
            </p>
            <button
              onClick={() => setModalAbierto(true)}
              className="mt-3 text-xs font-semibold text-violet-600 hover:text-violet-800 cursor-pointer"
            >
              + Publicar la primera oferta
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {ofertasFiltradas.map((oferta) => (
              <OfertaCard
                key={oferta.id ?? oferta._id}
                oferta={oferta}
                onContactar={() => console.log('Contactar oferta:', oferta)}
              />
            ))}
          </div>
        )}
      </div>

      <CrearOfertaModal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onCrear={handleCrearOferta}
      />
    </div>
  );
};