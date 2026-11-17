import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ClipboardList, FolderOpen, Package } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import type { NecesidadResponse, OfertaResponse } from "../types/publicacion";
import {
  cambiarEstadoNecesidad,
  cambiarEstadoOferta,
  eliminarNecesidadLogico,
  eliminarOfertaLogico,
  obtenerMisNecesidades,
  obtenerMisOfertas,
} from "../services/publicacionService";
import PublicacionCard from "../components/publicaciones/PublicacionCard";
import EditarPublicacionDialog, {
  type ItemEnEdicion,
} from "../components/publicaciones/EditarPublicacionDialog";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function MisPublicacionesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [ofertas, setOfertas] = useState<OfertaResponse[]>([]);
  const [necesidades, setNecesidades] = useState<NecesidadResponse[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);

  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [itemEditando, setItemEditando] = useState<ItemEnEdicion>(null);
  const [itemBorrando, setItemBorrando] = useState<{
    kind: "oferta" | "necesidad";
    id: string;
    titulo: string;
  } | null>(null);

  const userId = user?.id || (user as any)?._id;
  const esOferente = user?.tipo_cuenta === "oferente";

  useEffect(() => {
    if (!userId) return;
    setCargando(true);
    Promise.all([
      esOferente ? obtenerMisOfertas(userId) : Promise.resolve([]),
      obtenerMisNecesidades(userId),
    ])
      .then(([resOfertas, resNecesidades]) => {
        setOfertas(resOfertas);
        setNecesidades(resNecesidades);
      })
      .catch(() => setError("No se pudieron cargar tus publicaciones."))
      .finally(() => setCargando(false));
  }, [userId, esOferente]);

  if (!user) return null;

  const tabParam = searchParams.get("tab");
  const tabActiva: "ofertas" | "necesidades" =
    esOferente && tabParam !== "necesidades" ? "ofertas" : "necesidades";

  const cambiarTab = (nuevaTab: "ofertas" | "necesidades") => {
    setMensaje(null);
    setError(null);
    setSearchParams({ tab: nuevaTab });
  };

  const handleToggleEstado = async (
    kind: "oferta" | "necesidad",
    id: string,
    estadoActual: boolean,
  ) => {
    setMensaje(null);
    setError(null);
    setProcesandoId(id);
    try {
      if (kind === "oferta") {
        const actualizada = await cambiarEstadoOferta(id, !estadoActual);
        setOfertas((prev) => prev.map((o) => (o.id === id ? actualizada : o)));
      } else {
        const actualizada = await cambiarEstadoNecesidad(id, !estadoActual);
        setNecesidades((prev) =>
          prev.map((n) => (n.id === id ? actualizada : n)),
        );
      }
      setMensaje(
        !estadoActual ? "Publicación activada." : "Publicación pausada.",
      );
    } catch {
      setError("No se pudo cambiar el estado de la publicación.");
    } finally {
      setProcesandoId(null);
    }
  };

  const confirmarBorrado = async () => {
    if (!itemBorrando) return;
    const { kind, id } = itemBorrando;
    setProcesandoId(id);
    setMensaje(null);
    setError(null);
    try {
      if (kind === "oferta") {
        await eliminarOfertaLogico(id);
        setOfertas((prev) => prev.filter((o) => o.id !== id));
      } else {
        await eliminarNecesidadLogico(id);
        setNecesidades((prev) => prev.filter((n) => n.id !== id));
      }
      setMensaje("Publicación eliminada.");
      setItemBorrando(null);
    } catch {
      setError("No se pudo eliminar la publicación.");
    } finally {
      setProcesandoId(null);
    }
  };

  const listaActual = tabActiva === "ofertas" ? ofertas : necesidades;
  const borrandoActual = Boolean(
    itemBorrando && procesandoId === itemBorrando.id,
  );

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-black">Mis publicaciones</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {esOferente
              ? "Administra tus ofertas publicadas y tus solicitudes de necesidades."
              : "Administra las necesidades que has publicado."}
          </p>
        </div>

        {esOferente && (
          <div className="inline-flex p-1 rounded-lg bg-slate-100 border border-slate-200">
            <button
              type="button"
              onClick={() => cambiarTab("ofertas")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                tabActiva === "ofertas"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              Ofertas ({ofertas.length})
            </button>
            <button
              type="button"
              onClick={() => cambiarTab("necesidades")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                tabActiva === "necesidades"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              Necesidades ({necesidades.length})
            </button>
          </div>
        )}
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

      {cargando ? (
        <p className="text-xs text-slate-400 py-8 text-center">
          Cargando tus publicaciones...
        </p>
      ) : listaActual.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-14 px-4 rounded-xl bg-white border border-dashed border-slate-300">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <FolderOpen className="w-6 h-6" />
          </div>
          <h2 className="text-sm font-bold text-slate-900">
            Aún no tienes{" "}
            {tabActiva === "ofertas"
              ? "ofertas publicadas"
              : "necesidades publicadas"}
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
            {tabActiva === "ofertas"
              ? "Comparte tus productos o servicios con clientes cercanos."
              : "Publica lo que buscas para conectar con oferentes de tu zona."}
          </p>
          <Button
            type="button"
            size="sm"
            onClick={() => navigate("/publicar")}
            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
          >
            Empieza a publicar
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {tabActiva === "ofertas"
            ? ofertas.map((oferta) => (
                <PublicacionCard
                  key={oferta.id}
                  item={{ kind: "oferta", data: oferta }}
                  procesandoId={procesandoId}
                  onEditar={() =>
                    setItemEditando({ kind: "oferta", data: oferta })
                  }
                  onToggleEstado={() =>
                    handleToggleEstado("oferta", oferta.id, oferta.publicado)
                  }
                  onBorrar={() =>
                    setItemBorrando({
                      kind: "oferta",
                      id: oferta.id,
                      titulo: oferta.titulo,
                    })
                  }
                />
              ))
            : necesidades.map((necesidad) => (
                <PublicacionCard
                  key={necesidad.id}
                  item={{ kind: "necesidad", data: necesidad }}
                  procesandoId={procesandoId}
                  onEditar={() =>
                    setItemEditando({ kind: "necesidad", data: necesidad })
                  }
                  onToggleEstado={() =>
                    handleToggleEstado(
                      "necesidad",
                      necesidad.id,
                      necesidad.publicado,
                    )
                  }
                  onBorrar={() =>
                    setItemBorrando({
                      kind: "necesidad",
                      id: necesidad.id,
                      titulo: necesidad.titulo,
                    })
                  }
                />
              ))}
        </div>
      )}

      {/* Modal Edición */}
      <EditarPublicacionDialog
        item={itemEditando}
        onClose={() => setItemEditando(null)}
        onSavedOferta={(actualizada) => {
          setOfertas((prev) =>
            prev.map((o) => (o.id === actualizada.id ? actualizada : o)),
          );
          setMensaje("Oferta actualizada correctamente.");
        }}
        onSavedNecesidad={(actualizada) => {
          setNecesidades((prev) =>
            prev.map((n) => (n.id === actualizada.id ? actualizada : n)),
          );
          setMensaje("Necesidad actualizada correctamente.");
        }}
        onError={setError}
      />

      {/* Modal Confirmación de Borrado (sin botón X de cierre) */}
      <Dialog
        open={Boolean(itemBorrando)}
        onOpenChange={(open) =>
          !open && !borrandoActual && setItemBorrando(null)
        }
      >
        <DialogContent className="bg-white text-slate-900 sm:max-w-md [&>button]:hidden">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-black">
              ¿Borrar publicación?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 pt-1">
              Se quitará{" "}
              <span className="font-semibold text-slate-800">
                "{itemBorrando?.titulo}"
              </span>{" "}
              de tus publicaciones y dejará de estar visible en BizCerca.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={borrandoActual}
              onClick={() => setItemBorrando(null)}
              className="text-xs border-slate-300 text-slate-700 cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={borrandoActual}
              onClick={confirmarBorrado}
              className="text-xs bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
            >
              {borrandoActual ? "Borrando..." : "Borrar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
