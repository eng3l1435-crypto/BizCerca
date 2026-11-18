import { useEffect, useState } from "react";
import { Check, Inbox, Send } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import type { ContactoResponse } from "../types/interaccion";
import {
  obtenerContactosEnviados,
  obtenerContactosRecibidos,
  responderPeticionContacto,
} from "../services/interaccionService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ContactosPage() {
  const { user } = useAuth();
  const userId = user?.id || (user as any)?._id;

  const [tab, setTab] = useState<"recibidos" | "enviados">("recibidos");
  const [recibidos, setRecibidos] = useState<ContactoResponse[]>([]);
  const [enviados, setEnviados] = useState<ContactoResponse[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    setCargando(true);
    Promise.all([
      obtenerContactosRecibidos(userId),
      obtenerContactosEnviados(userId),
    ])
      .then(([resRec, resEnv]) => {
        setRecibidos(resRec);
        setEnviados(resEnv);
      })
      .finally(() => setCargando(false));
  }, [userId]);

  const handleResponder = async (id: string) => {
    setProcesandoId(id);
    setMensaje(null);
    try {
      await responderPeticionContacto(id);
      setRecibidos((prev) => prev.filter((c) => c.id !== id));
      setMensaje("Petición marcada como respondida.");
    } finally {
      setProcesandoId(null);
    }
  };

  if (!user) return null;
  const lista = tab === "recibidos" ? recibidos : enviados;

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-black">
            Peticiones de Contacto
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestiona las solicitudes recibidas y el estado de las que enviaste.
          </p>
        </div>

        <div className="inline-flex p-1 rounded-lg bg-slate-100 border border-slate-200">
          <button
            type="button"
            onClick={() => setTab("recibidos")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
              tab === "recibidos"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600"
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            Recibidas ({recibidos.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("enviados")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
              tab === "enviados"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600"
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            Enviadas ({enviados.length})
          </button>
        </div>
      </div>

      {mensaje && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
          {mensaje}
        </div>
      )}

      {cargando ? (
        <p className="text-xs text-slate-400 py-8 text-center">Cargando...</p>
      ) : lista.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-xl bg-white border border-dashed border-slate-300">
          <p className="text-xs text-slate-500">
            No tienes peticiones {tab} por el momento.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {lista.map((c) => (
            <Card key={c.id} className="bg-white border-slate-200 shadow-sm">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                        c.estado === "respondida"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {c.estado}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Intl.DateTimeFormat("es-MX", {
                        day: "numeric",
                        month: "short",
                      }).format(new Date(c.fecha_creacion))}
                    </span>
                  </div>
                  <p className="text-xs text-slate-800">{c.mensaje_inicial}</p>
                </div>

                {tab === "recibidos" && c.estado === "pendiente" && (
                  <Button
                    type="button"
                    size="sm"
                    disabled={procesandoId === c.id}
                    onClick={() => handleResponder(c.id)}
                    className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shrink-0"
                  >
                    <Check className="w-3.5 h-3.5 mr-1" />
                    Marcar respondida
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
