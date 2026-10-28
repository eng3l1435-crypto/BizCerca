import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

interface CrearOfertaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCrear: (payload: any) => Promise<void>;
}

const CATEGORIAS_PREDEFINIDAS = [
  'Tecnología',
  'Diseño',
  'Cocina',
  'Educación',
  'Reparación / Soporte',
  'Comida',
  'Marketing',
  'Jardinería',
  'Fontanería',
  'Otros',
];

export const CrearOfertaModal: React.FC<CrearOfertaModalProps> = ({
  isOpen,
  onClose,
  onCrear,
}) => {
  const { user } = useAuth();

  const [tipo, setTipo] = useState<'servicio' | 'producto'>('servicio');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('Tecnología');
  const [precio, setPrecio] = useState<number | ''>('');
  const [plazo, setPlazo] = useState('Entrega inmediata');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const userId = user?.id || user?._id || user?.usuario_id;
    if (!userId) {
      setError('Debes tener una sesión activa para publicar una oferta.');
      return;
    }

    if (precio === '' || Number(precio) < 0) {
      setError('Por favor indica un precio válido mayor o igual a 0.');
      return;
    }

    setEnviando(true);

    try {
      // Estructura exacta requerida por OfferCreate
      const payload = {
        tipo,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        categorias_tags: [categoria],
        precio: Number(precio),
        fecha_plazo_aproximado: plazo.trim() || undefined,
        publicado: true,
        usuario_id: String(userId),
      };

      await onCrear(payload);

      // Limpieza de campos
      setTitulo('');
      setDescripcion('');
      setPrecio('');
      setPlazo('Entrega inmediata');
      setTipo('servicio');
      onClose();
    } catch (err: any) {
      console.error('Error al registrar la oferta:', err);
      const detalle = err.response?.data?.detail;
      if (typeof detalle === 'string') {
        setError(detalle);
      } else if (Array.isArray(detalle)) {
        setError(detalle.map((d: any) => d.msg).join(' | '));
      } else {
        setError('Ocurrió un error al registrar la oferta.');
      }
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
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-pulse" />
            <h3 className="text-lg font-bold text-slate-900">Publicar Oferta en Catálogo</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          {/* Selector de Tipo */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tipo de oferta <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['servicio', 'producto'] as const).map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setTipo(t)}
                  className={`py-2 text-xs font-semibold rounded-xl border transition capitalize cursor-pointer ${
                    tipo === t
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Título del servicio o producto <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Elaboracion de postres, cuidado del jartin, etc."
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-indigo-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Precio (MXN) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                placeholder="0.00"
                value={precio}
                onChange={(e) => setPrecio(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-indigo-600"
              />
            </div>

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
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Plazo de entrega estimado
            </label>
            <input
              type="text"
              placeholder="Ej. 3 días hábiles o Entrega inmediata"
              value={plazo}
              onChange={(e) => setPlazo(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Descripción detallada <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="Detalla qué incluye tu oferta, condiciones de entrega o alcances..."
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
              {enviando ? 'Guardando...' : 'Publicar oferta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};