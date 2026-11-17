import React, { useState } from "react";
import { ClipboardList, Package } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import PublicarNecesidadSection from "../components/publicar/PublicarNecesidadSection";
import PublicarOfertaSection from "../components/publicar/PublicarOfertaSection";

export default function PublicarPage() {
  const { user } = useAuth();
  if (!user) return null;

  const userId = user.id || (user as any)._id;
  const esOferente = user.tipo_cuenta === "oferente";

  const [tabActiva, setTabActiva] = useState<"oferta" | "necesidad">(
    esOferente ? "oferta" : "necesidad",
  );
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const limpiarAlertas = () => {
    setMensaje(null);
    setError(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-black">Publicar</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {esOferente
            ? "Publica tus productos y servicios o crea una solicitud de lo que necesitas."
            : "Publica una necesidad para recibir propuestas de oferentes cercanos."}
        </p>
      </div>

      {/* Selector de sección (solo visible si es Oferente, pues tiene acceso a ambas) */}
      {esOferente && (
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 border border-slate-200">
          <button
            type="button"
            onClick={() => {
              limpiarAlertas();
              setTabActiva("oferta");
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              tabActiva === "oferta"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Package className="w-4 h-4" />
            Publicar Oferta
          </button>

          <button
            type="button"
            onClick={() => {
              limpiarAlertas();
              setTabActiva("necesidad");
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              tabActiva === "necesidad"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Publicar Necesidad
          </button>
        </div>
      )}

      {mensaje && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
          {mensaje}
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          {error}
        </div>
      )}

      {esOferente && tabActiva === "oferta" ? (
        <PublicarOfertaSection
          userId={userId}
          onSuccess={setMensaje}
          onError={setError}
          onClearAlerts={limpiarAlertas}
        />
      ) : (
        <PublicarNecesidadSection
          userId={userId}
          onSuccess={setMensaje}
          onError={setError}
          onClearAlerts={limpiarAlertas}
        />
      )}
    </div>
  );
}
