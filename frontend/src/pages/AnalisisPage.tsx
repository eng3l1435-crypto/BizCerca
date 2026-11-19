import React, { useCallback, useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  DollarSign,
  Layers,
  Loader2,
  MessageSquare,
  PieChart as PieChartIcon,
  Radar as RadarIcon,
  RefreshCw,
  UserCheck,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import { obtenerAnalisisUsuario } from "../services/analisisService";
import type { AnalisisDashboardResponse } from "../types/analisis";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function formatearMonedaMXN(valor: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(valor);
}

export default function AnalisisPage() {
  const { user } = useAuth();
  const userId = user?.id || (user as any)?._id;

  const [datos, setDatos] = useState<AnalisisDashboardResponse | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarAnalisis = useCallback(() => {
    if (!userId) return;
    setCargando(true);
    setError(null);

    obtenerAnalisisUsuario(userId)
      .then((res) => setDatos(res))
      .catch(() => {
        setError(
          "No se pudieron cargar las métricas de análisis. Verifica que el backend esté activo.",
        );
      })
      .finally(() => setCargando(false));
  }, [userId]);

  useEffect(() => {
    cargarAnalisis();
  }, [cargarAnalisis]);

  if (!user) return null;

  const totalEmbudo =
    datos?.embudo_contactos.reduce((acc, item) => acc + item.cantidad, 0) || 0;

  return (
    <div className="max-w-6xl mx-auto pb-10 space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-black">Análisis</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Métricas de rendimiento de tu perfil y comportamiento de oferta y
            demanda local.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {datos && (
            <Badge
              variant="secondary"
              className={
                datos.sensores_peas.vitalidad_activa
                  ? "bg-emerald-50 text-emerald-700 text-[11px] font-semibold"
                  : "bg-amber-50 text-amber-700 text-[11px] font-semibold"
              }
            >
              {datos.sensores_peas.vitalidad_activa
                ? "Perfil activo en visibilidad"
                : "Inactividad detectada (+30 días)"}
            </Badge>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={cargando}
            onClick={cargarAnalisis}
            className="h-8 text-xs border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 mr-1.5 ${cargando ? "animate-spin" : ""}`}
            />
            Actualizar
          </Button>
        </div>
      </div>

      {cargando && !datos ? (
        <div className="rounded-xl border border-slate-200 bg-white py-20 flex flex-col items-center justify-center gap-2 text-xs text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          Calculando indicadores y gráficas...
        </div>
      ) : error && !datos ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-6 text-center space-y-3">
          <p className="text-xs font-medium text-rose-700">{error}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={cargarAnalisis}
            className="h-8 text-xs border-rose-300 text-rose-700 bg-white cursor-pointer"
          >
            Reintentar
          </Button>
        </div>
      ) : (
        datos && (
          <>
            {/* Fila superior: 4 tarjetas KPI */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-slate-500">
                    Publicaciones activas
                  </p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {datos.kpis.publicaciones_activas}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Ofertas y necesidades visibles
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-slate-500">
                    Solicitudes recibidas
                  </p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {datos.kpis.solicitudes_recibidas}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Interesados desde Explorar
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-slate-500">
                    Conversaciones activas
                  </p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {datos.kpis.conversaciones_activas}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Hilos abiertos en chat
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-slate-500">
                    Precio promedio
                  </p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {formatearMonedaMXN(datos.kpis.precio_promedio)}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Ticket de referencia en ofertas
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Cuadrícula 2x2 de gráficas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Gráfica 1: Área - Actividad */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-indigo-600" />
                      Actividad
                    </h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Solicitudes de contacto recibidas frente a mensajes
                      enviados en chat (últimos 7 días).
                    </p>
                  </div>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={datos.actividad_diaria}
                      margin={{ top: 10, right: 12, left: -18, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="gradSolicitudes"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#4f46e5"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#4f46e5"
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="gradMensajes"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#10b981"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#10b981"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="dia"
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        axisLine={{ stroke: "#cbd5e1" }}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        axisLine={{ stroke: "#cbd5e1" }}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "10px",
                          borderColor: "#e2e8f0",
                          fontSize: "12px",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px" }} />
                      <Area
                        type="monotone"
                        dataKey="solicitudes"
                        name="Solicitudes"
                        stroke="#4f46e5"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#gradSolicitudes)"
                      />
                      <Area
                        type="monotone"
                        dataKey="mensajes"
                        name="Mensajes"
                        stroke="#10b981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#gradMensajes)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráfica 2: Barras agrupadas - Oferta y Demanda */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-indigo-600" />
                    Oferta y Demanda
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Comparativa entre ofertas publicadas y necesidades buscadas
                    por etiqueta.
                  </p>
                </div>

                {datos.oferta_demanda_tags.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                    Aún no hay etiquetas suficientes en publicaciones activas.
                  </div>
                ) : (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={datos.oferta_demanda_tags}
                        margin={{ top: 10, right: 12, left: -18, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                          dataKey="tag"
                          tick={{ fontSize: 11, fill: "#64748b" }}
                          axisLine={{ stroke: "#cbd5e1" }}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 11, fill: "#64748b" }}
                          axisLine={{ stroke: "#cbd5e1" }}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "10px",
                            borderColor: "#e2e8f0",
                            fontSize: "12px",
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: "12px" }} />
                        <Bar
                          dataKey="ofertas"
                          name="Ofertas"
                          fill="#4f46e5"
                          radius={[6, 6, 0, 0]}
                        />
                        <Bar
                          dataKey="necesidades"
                          name="Necesidades"
                          fill="#f59e0b"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Gráfica 3: Dona - Atención brindada */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4 text-indigo-600" />
                    Atención brindada
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Estado de seguimiento de las peticiones de contacto
                    recibidas.
                  </p>
                </div>

                {totalEmbudo === 0 ? (
                  <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                    Todavía no tienes peticiones de contacto recibidas.
                  </div>
                ) : (
                  <div className="h-64 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={datos.embudo_contactos}
                          dataKey="cantidad"
                          nameKey="estado"
                          cx="50%"
                          cy="46%"
                          innerRadius={56}
                          outerRadius={84}
                          paddingAngle={3}
                        >
                          {datos.embudo_contactos.map((seg) => (
                            <Cell key={seg.estado} fill={seg.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            borderRadius: "10px",
                            borderColor: "#e2e8f0",
                            fontSize: "12px",
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: "12px" }} />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Indicador central */}
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-6">
                      <span className="text-lg font-bold text-slate-900">
                        {datos.tasa_respuesta}%
                      </span>
                      <span className="text-[10px] font-medium text-slate-500">
                        Respuesta
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Gráfica 4: Radar - Coberturas cercanas */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <RadarIcon className="w-4 h-4 text-indigo-600" />
                    Coberturas cercanas
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Distribución por radio kilométrico y modalidad de entrega
                    frente al ecosistema local.
                  </p>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart
                      cx="50%"
                      cy="50%"
                      outerRadius="72%"
                      data={datos.cobertura_modalidad}
                    >
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis
                        dataKey="eje"
                        tick={{ fontSize: 11, fill: "#475569" }}
                      />
                      <PolarRadiusAxis
                        tick={{ fontSize: 10, fill: "#94a3b8" }}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "10px",
                          borderColor: "#e2e8f0",
                          fontSize: "12px",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px" }} />
                      <Radar
                        name="Ecosistema local"
                        dataKey="ecosistema"
                        stroke="#4f46e5"
                        fill="#4f46e5"
                        fillOpacity={0.22}
                      />
                      <Radar
                        name="Tu perfil"
                        dataKey="usuario"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.35}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )
      )}
    </div>
  );
}
