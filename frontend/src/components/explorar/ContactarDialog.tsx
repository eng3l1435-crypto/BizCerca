import React, { useState } from "react";
import type { PublicacionFeedItem } from "./ExplorarCard";
import { enviarPeticionContacto } from "../../services/interaccionService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface Props {
  item: PublicacionFeedItem | null;
  emisorId: string;
  onClose: () => void;
  onEnviado: (publicacionId: string) => void;
  onError: (msg: string) => void;
}

export default function ContactarDialog({
  item,
  emisorId,
  onClose,
  onEnviado,
  onError,
}: Props) {
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);

  if (!item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mensaje.trim()) return;

    setEnviando(true);
    try {
      await enviarPeticionContacto({
        emisor_id: emisorId,
        receptor_id: item.data.usuario_id,
        publicacion_id: item.data.id,
        mensaje_inicial: mensaje.trim(),
      });
      setMensaje("");
      onEnviado(item.data.id);
      onClose();
    } catch (err: any) {
      const detalle = err.response?.data?.detail;
      onError(
        typeof detalle === "string"
          ? detalle
          : "No se pudo enviar la petición de contacto.",
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open={Boolean(item)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-white text-slate-900 sm:max-w-md [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-black">
            Enviar petición de contacto
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-600 pt-1">
            Publicación:{" "}
            <span className="font-semibold text-slate-800">
              "{item.data.titulo}"
            </span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          <div className="space-y-1">
            <Label className="text-xs text-slate-700">Mensaje *</Label>
            <textarea
              required
              rows={3}
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Hola, me interesa tu publicación. ¿Podríamos ponernos en contacto?"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-600"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={enviando}
              onClick={onClose}
              className="text-xs border-slate-300 text-slate-700 cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={enviando}
              className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
            >
              {enviando ? "Enviando..." : "Enviar petición"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
