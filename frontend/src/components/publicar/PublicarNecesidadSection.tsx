import React, { useState } from "react";
import { ClipboardList } from "lucide-react";
import { crearNecesidad } from "../../services/publicacionService";
import TagsInput from "./TagsInput";
import ImagenPublicacionInput from "./ImagenPublicacionInput";
import UbicacionPublicacionField, {
  type UbicacionPublicacionData,
} from "./UbicacionPublicacionField";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  userId: string;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
  onClearAlerts: () => void;
}

export default function PublicarNecesidadSection({
  userId,
  onSuccess,
  onError,
  onClearAlerts,
}: Props) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [fechaLimite, setFechaLimite] = useState("");
  const [imagenes, setImagenes] = useState<string[]>([]);
  const [ubicacion, setUbicacion] = useState<UbicacionPublicacionData | null>(
    null,
  );
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onClearAlerts();

    const tagsFinales = Array.from(
      new Set([
        ...tags,
        ...tagInput
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean),
      ]),
    );

    if (!titulo.trim() || !descripcion.trim() || !fechaLimite.trim()) {
      onError("Completa el título, la descripción y la fecha límite.");
      return;
    }

    if (tagsFinales.length === 0) {
      onError("Agrega al menos un tag para facilitar la búsqueda.");
      return;
    }

    setEnviando(true);
    try {
      await crearNecesidad({
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        categorias_tags: tagsFinales,
        imagenes_urls: imagenes,
        imagen_url: imagenes[0] ?? null,
        fecha_plazo_aproximado: fechaLimite.trim(),
        direccion_aproximada: ubicacion?.direccion_aproximada.trim() || null,
        radio_km: ubicacion?.radio_km ?? null,
        ubicacion_gps: ubicacion?.ubicacion_gps ?? null,
        publicado: true,
        usuario_id: userId,
      });

      setTitulo("");
      setDescripcion("");
      setTags([]);
      setTagInput("");
      setFechaLimite("");
      setImagenes([]);
      setUbicacion(null);
      onSuccess("Tu necesidad se publicó correctamente.");
    } catch (err: any) {
      const detalle = err.response?.data?.detail;
      onError(
        typeof detalle === "string"
          ? detalle
          : "No se pudo publicar tu necesidad. Revisa los datos.",
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Card className="bg-white border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-indigo-600" />
          <CardTitle className="text-base font-bold text-slate-900">
            Publicar Necesidad
          </CardTitle>
        </div>
        <p className="text-xs text-slate-500">
          Describe el producto o servicio que buscas para que estudiantes,
          freelancers o negocios locales te contacten.
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-slate-700">Título *</Label>
            <Input
              required
              maxLength={120}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej. Diseño de logotipo para cafetería"
              className="bg-white border-slate-300 text-sm text-slate-900"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-slate-700">Descripción *</Label>
            <textarea
              required
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Explica qué necesitas, características, ubicación o requisitos específicos..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-600"
            />
          </div>

          {/* Tags y Fecha Límite */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
            <TagsInput
              tags={tags}
              inputValue={tagInput}
              onInputChange={setTagInput}
              onChangeTags={setTags}
              placeholder="Ej. diseño gráfico, logotipo"
            />

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-700 block">
                Fecha Límite *
              </Label>
              <Input
                required
                value={fechaLimite}
                onChange={(e) => setFechaLimite(e.target.value)}
                placeholder="Ej. Antes del 15 de noviembre"
                className="h-9 bg-white border-slate-300 text-xs text-slate-900"
              />
            </div>
          </div>

          {/* Fotos opcionales con ajuste */}
          <ImagenPublicacionInput imagenes={imagenes} onChange={setImagenes} />

          {/* Ubicación GPS próxima y radio de cobertura */}
          <UbicacionPublicacionField
            value={ubicacion}
            onChange={setUbicacion}
          />

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <Button
              type="submit"
              size="sm"
              disabled={enviando}
              className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
            >
              {enviando ? "Publicando..." : "Publicar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
