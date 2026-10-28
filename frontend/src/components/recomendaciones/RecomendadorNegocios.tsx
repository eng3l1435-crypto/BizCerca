import React, { useState, useEffect } from 'react';
import { obtenerRecomendaciones } from '../../services/api';

export const RecomendadorNegocios = () => {
  const [precio, setPrecio] = useState(5);
  const [calidad, setCalidad] = useState(8);
  const [metodo, setMetodo] = useState('euclidiana');

  const [recomendaciones, setRecomendaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const consultarRecomendaciones = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await obtenerRecomendaciones(
        { precio: Number(precio), calidad: Number(calidad) },
        metodo
      );
      setRecomendaciones(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError('No se pudo conectar con el motor de recomendación.');
    } finally {
      setLoading(false);
    }
  };

  // Carga inicial y actualización al cambiar los parámetros
  useEffect(() => {
    consultarRecomendaciones();
  }, [precio, calidad, metodo]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-100">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-violet-50 text-violet-700 px-2.5 py-1 rounded-full border border-violet-100">
            Machine Learning & Matching
          </span>
          <h2 style={{ color: '#0f172a', font: 'bold' }} className="text-xl mt-2">
            Recomendador Inteligente de Proveedores
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Ajusta los ponderadores para encontrar el negocio con menor distancia vectorial a tus necesidades.
          </p>
        </div>

        {/* Selector de Algoritmo */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600">Métrica:</label>
          <select
            value={metodo}
            onChange={(e) => setMetodo(e.target.value)}
            className="text-xs rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-indigo-600 bg-white font-medium text-slate-700"
          >
            <option value="euclidiana">Distancia Euclidiana</option>
            <option value="manhattan">Distancia Manhattan</option>
            <option value="coseno">Similitud Coseno</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Panel de Controles (Sliders) */}
        <div className="lg:col-span-5 space-y-6 bg-slate-50/70 p-6 rounded-2xl border border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Tus Prioridades
          </h3>

          {/* Slider 1: Precio */}
          <div>
            <div className="flex justify-between items-center text-xs font-semibold mb-2">
              <span className="text-slate-700">Sensibilidad al Precio</span>
              <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-md font-mono">
                {precio}/10
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1.5 font-medium">
              <span>Económico (1)</span>
              <span>Flexible / Alto (10)</span>
            </div>
          </div>

          {/* Slider 2: Calidad */}
          <div>
            <div className="flex justify-between items-center text-xs font-semibold mb-2">
              <span className="text-slate-700">Nivel de Calidad / Experiencia</span>
              <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-md font-mono">
                {calidad}/10
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={calidad}
              onChange={(e) => setCalidad(e.target.value)}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1.5 font-medium">
              <span>Estudiante / Inicial (1)</span>
              <span>Empresa / Experto (10)</span>
            </div>
          </div>

          {/* Resumen del vector */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 text-[11px] text-slate-500 space-y-1">
            <span className="font-semibold text-slate-700 block">Vector usuario generado:</span>
            <code className="text-indigo-600 font-mono text-xs font-bold">
              [{precio}, {calidad}]
            </code>
          </div>
        </div>

        {/* Lista de Resultados Rankeados */}
        <div className="lg:col-span-7">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Negocios Recomendados (Orden de afinidad)
            </h3>
            {loading && (
              <span className="text-[11px] text-indigo-600 font-medium animate-pulse">
                Calculando distancias...
              </span>
            )}
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-medium">
              {error}
            </div>
          )}

          {!loading && recomendaciones.length === 0 && !error && (
            <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
              No hay negocios coincidentes con este criterio.
            </div>
          )}

          <div className="space-y-3">
            {recomendaciones.map((negocio, index) => {
              const esPrimero = index === 0;

              return (
                <div
                  key={negocio.id ?? index}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                    esPrimero
                      ? 'bg-gradient-to-r from-indigo-50/70 to-white border-indigo-200 shadow-xs'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    {/* Medalla / Posición */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                        esPrimero
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 font-medium'
                      }`}
                    >
                      #{index + 1}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900 leading-tight">
                          {negocio.nombre}
                        </h4>
                        {esPrimero && (
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                            Mejor Match
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Perfil del negocio:{' '}
                        <span className="font-mono text-slate-700 font-medium">
                          P: {negocio.perfil?.[0] ?? '-'} | C: {negocio.perfil?.[1] ?? '-'}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Métrica / Score */}
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-medium">
                      {metodo === 'coseno' ? 'Similitud' : 'Distancia'}
                    </span>
                    <strong className="text-xs font-mono text-slate-800">
                      {typeof negocio.distancia === 'number'
                        ? negocio.distancia.toFixed(3)
                        : typeof negocio.similitud === 'number'
                        ? negocio.similitud.toFixed(3)
                        : typeof negocio.score === 'number'
                        ? negocio.score.toFixed(3)
                        : 'N/A'}
                    </strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};