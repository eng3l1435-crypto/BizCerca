import React, { useEffect, useState } from "react";
import type {
  NecesidadResponse,
  OfertaResponse,
} from "../../types/publicacion";
import {
  actualizarNecesidad,
  actualizarOferta,
} from "../../services/publicacionService";
import TagsInput from "../publicar/TagsInput";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type ItemEnEdicion =
  | { kind: "oferta"; data: OfertaResponse }
  | { kind: "necesidad"; data: NecesidadResponse }
  | null;

interface Props {
  item: ItemEnEdicion;
  onClose: () => void;
  onSavedOferta: (actualizada: OfertaResponse) => void;
  onSavedNecesidad: (actualizada: NecesidadResponse) => void;
  onError: (msg: string) => void;
}

export default function EditarPublicacionDialog({
  item,
  onClose,
  onSavedOferta,
  onSavedNecesidad,
  onError,
}: Props) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [fechaLimite, setFechaLimite] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!item) return;
    setTitulo(item.data.titulo);
    setDescripcion(item.data.descripcion);
    setTags(item.data.categorias_tags || []);
    setTagInput("");
    setFechaLimite(item.data.fecha_plazo_aproximado || "");
    if (item.kind === "oferta") {
      setPrecio(String(item.data.precio));
    }
  }, [item]);

  if (!item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const tagsFinales = [...tags];
    if (tagInput.trim()) {
      tagInput
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0 && !tagsFinales.includes(t))
        .forEach((t) => tagsFinales.push(t));
    }

    if (!titulo.trim() || !descripcion.trim() || !fechaLimite.trim()) {
      onError("Completa los campos obligatorios antes de guardar.");
      return;
    }

    setGuardando(true);
    try {
      if (item.kind === "oferta") {
        const precioNum = parseFloat(precio);
        if (Number.isNaN(precioNum) || precioNum < 0) {
          onError("Ingresa un precio válido.");
          setGuardando(false);
          return;
        }
        const actualizada = await actualizarOferta(item.data.id, {
          titulo: titulo.trim(),
          descripcion: descripcion.trim(),
          precio: precioNum,
          categorias_tags: tagsFinales,
          fecha_plazo_aproximado: fechaLimite.trim(),
        });
        onSavedOferta(actualizada);
      } else {
        const actualizada = await actualizarNecesidad(item.data.id, {
          titulo: titulo.trim(),
          descripcion: descripcion.trim(),
          categorias_tags: tagsFinales,
          fecha_plazo_aproximado: fechaLimite.trim(),
        });
        onSavedNecesidad(actualizada);
      }
      onClose();
    } catch {
      onError("No se pudieron guardar los cambios de la publicación.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={Boolean(item)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-white text-slate-900 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-black">
            Editar {item.kind === "oferta" ? "Oferta" : "Necesidad"}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Actualiza los detalles de tu publicación.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          <div
            className={
              item.kind === "oferta"
                ? "grid grid-cols-1 sm:grid-cols-3 gap-3"
                : "space-y-1"
            }
          >
            <div
              className={
                item.kind === "oferta" ? "space-y-1 sm:col-span-2" : "space-y-1"
              }
            >
              <Label className="text-xs text-slate-700">Título *</Label>
              <Input
                required
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="bg-white border-slate-300 text-sm text-slate-900"
              />
            </div>

            {item.kind === "oferta" && (
              <div className="space-y-1">
                <Label className="text-xs text-slate-700">Precio (MXN) *</Label>
                <Input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  className="bg-white border-slate-300 text-sm text-slate-900"
                />
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-slate-700">Descripción *</Label>
            <textarea
              required
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
            <TagsInput
              tags={tags}
              inputValue={tagInput}
              onInputChange={setTagInput}
              onChangeTags={setTags}
            />

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-700 block">
                Fecha Límite *
              </Label>
              <Input
                required
                value={fechaLimite}
                onChange={(e) => setFechaLimite(e.target.value)}
                className="h-9 bg-white border-slate-300 text-xs text-slate-900"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={guardando}
              onClick={onClose}
              className="text-xs border-slate-300 text-slate-700 cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={guardando}
              className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
            >
              {guardando ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
