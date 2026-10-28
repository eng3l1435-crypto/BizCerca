import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const CATEGORIAS_PREDEFINIDAS = [
  'Tecnología',
  'Diseño',
  'Jardinería',
  'Cocina',
  'Belleza',
  'Fonateneria',
  'Educación',
  'Comida',
  'Reparación / Soporte',
  'General',
];

export const CrearSolicitudModal = ({ isOpen, onClose, onCrear }) => {
  const { user } = useAuth();

  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('Tecnología');
  const [plazo, setPlazo] = useState('1 a 2 semanas');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const userId = user?.id || user?._id || user?.usuario_id;
    if (!userId) {
      setError('Debes iniciar sesión para publicar una necesidad.');
      return;
    }

    setEnviando(true);
    try {
      // Payload idéntico al Request Body de POST /necesidades/
      const payload = {
        usuario_id: String(userId),
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        categorias_tags: [categoria],
        fecha_plazo_aproximado: plazo,
        publicado: true,
      };

      await onCrear(payload);

      // Limpiar formulario y cerrar
      setTitulo('');
      setDescripcion('');
      setCategoria('Tecnología');
      setPlazo('1 a 2 semanas');
      onClose();
    } catch (err) {
      console.error('Error al registrar la necesidad:', err);
      const detalle = err.response?.data?.detail;
      setError(
        typeof detalle === 'string'
          ? detalle
          : 'Ocurrió un error al registrar la necesidad.'
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
            <h3 className="text-lg font-bold text-slate-900">Publicar Necesidad</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Título del requerimiento <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej. App móvil en React Native"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-indigo-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Categoría principal
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 px-2.5 py-2 outline-none focus:border-indigo-600 bg-white"
              >
                {CATEGORIAS_PREDEFINIDAS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Plazo estimado <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ej. 1 a 2 semanas"
                value={plazo}
                onChange={(e) => setPlazo(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Descripción del proyecto <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="Describe los entregables esperados, requerimientos técnicos y alcance..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-indigo-600 resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-5 py-2 rounded-xl transition text-xs shadow-md shadow-slate-900/10 disabled:opacity-50 cursor-pointer"
            >
              {enviando ? 'Publicando...' : 'Publicar necesidad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};