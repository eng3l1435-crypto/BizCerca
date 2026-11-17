import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import ConsumidorPerfilSection from "../components/perfil/ConsumidorPerfilSection";
import OferentePerfilSection from "../components/perfil/OferentePerfilSection";

export default function PerfilPage() {
  const { user } = useAuth();
  if (!user) return null;

  const userId = user.id || (user as any)._id;
  const esOferente = user.tipo_cuenta === "oferente";

  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const limpiarAlertas = () => {
    setMensaje(null);
    setError(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-black">Mi Perfil</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Edita tus datos directamente; el botón de guardar aparecerá cuando
          realices cambios.
        </p>
      </div>

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

      <ConsumidorPerfilSection
        onSuccess={setMensaje}
        onError={setError}
        onClearAlerts={limpiarAlertas}
      />

      {esOferente && (
        <OferentePerfilSection
          userId={userId}
          onSuccess={setMensaje}
          onError={setError}
          onClearAlerts={limpiarAlertas}
        />
      )}
    </div>
  );
}
