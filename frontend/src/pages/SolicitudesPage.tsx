import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { listarSolicitudes, crearSolicitud, cambiarEstadoSolicitud } from '../services/api';
import SolicitudCard from '../components/solicitudes/SolicitudCard';
import { SolicitudModal } from '../components/solicitudes/SolicitudModal';
import { CrearSolicitudModal } from '../components/solicitudes/CrearSolicitudModal';

export const SolicitudesPage = () => {
  const { user } = useAuth();
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modales
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);

  // Filtros
  const [filtro, setFiltro] = useState('Todas');
  const categorias = ['Todas', 'Tecnología', 'Diseño', 'Jardineria', 'Cocina', 'Belleza', 'Fontanería', 'Educación', 'Reparación / Soporte', 'Comida', 'General'];

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listarSolicitudes();
      setSolicitudes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar feed de necesidades:', err);
      setError('No se pudieron obtener las necesidades activas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleCrearSolicitud = async (payload) => {
    await crearSolicitud(payload);
    cargarDatos();
  };

  const handleCerrarSolicitud = async (needId) => {
    try {
      await cambiarEstadoSolicitud(needId, 'cerrada');
      // Remover de la vista feed activa
      setSolicitudes((prev) =>
        prev.filter((item) => (item.id ?? item._id ?? item.need_id) !== needId)
      );
    } catch (err) {
      console.error('Error al cambiar estado de la necesidad:', err);
    }
  };

  // Filtrado multietiqueta (soporta tanto categorias_tags como campo categoria clásico)
  const solicitudesFiltradas = filtro === 'Todas'
    ? solicitudes
    : solicitudes.filter((s) => {
        if (Array.isArray(s.categorias_tags) && s.categorias_tags.length > 0) {
          return s.categorias_tags.includes(filtro);
        }
        return s.categoria === filtro;
      });

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Banner de Bienvenida y Acciones */}
        <div className="bg-gradient-to-r from-slate-900 via-violet-950 to-slate-900 rounded-3xl p-8 text-white shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-xs font-semibold tracking-wider uppercase text-indigo-400">
              Solicitudes
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold mt-1">
              Explora nuevas necesidades
            </h3>
           
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={cargarDatos}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-medium border border-white/10 transition backdrop-blur-sm cursor-pointer"
            >
              Actualizar
            </button>
            <button
              onClick={() => setModalCrearAbierto(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition cursor-pointer flex items-center gap-1.5"
            >
              <span>+</span> Publicar
            </button>
          </div>
        </div>

        {/* Listado con filtros */}
        <div className="space-y-5">
          {/* Barra de Filtros */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categorias.map((c) => (
              <button
                key={c}
                onClick={() => setFiltro(c)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  filtro === c
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Estado de Carga / Error */}
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-medium">
              {error}
            </div>
          )}

          {loading ? (
            <div className="p-16 text-center text-xs text-slate-400">
              Cargando requerimientos disponibles...
            </div>
          ) : solicitudesFiltradas.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-16 text-center">
              <p className="text-slate-500 text-sm font-medium">
                No hay necesidades publicadas hasta ahora.
              </p>
              <button
                onClick={() => setModalCrearAbierto(true)}
                className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                + Publicar tu solicitud
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {solicitudesFiltradas.map((item) => (
                <SolicitudCard
                  key={item.id ?? item._id ?? item.need_id}
                  solicitud={item}
                  onVerDetalle={() => setSolicitudSeleccionada(item)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal para Crear Necesidad */}
      <CrearSolicitudModal
        isOpen={modalCrearAbierto}
        onClose={() => setModalCrearAbierto(false)}
        onCrear={handleCrearSolicitud}
      />

      {/* Modal de Detalle */}
      {solicitudSeleccionada && (
        <SolicitudModal
          solicitud={solicitudSeleccionada}
          onClose={() => setSolicitudSeleccionada(null)}
          onEliminar={handleCerrarSolicitud}
        />
      )}
    </div>
  );
};