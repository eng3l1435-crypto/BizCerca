import React, { useRef, useState } from "react";
import { Crop, ImagePlus, Link2, Plus, Trash2 } from "lucide-react";
import AjustarFotoDialog from "./AjustarFotoDialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  imagenes: string[];
  onChange: (imagenes: string[]) => void;
  maxFotos?: number;
}

function comprimirImagen(
  file: File,
  maxAncho = 960,
  calidad = 0.8,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const escala = img.width > maxAncho ? maxAncho / img.width : 1;
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * escala);
        canvas.height = Math.round(img.height * escala);

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("No se pudo procesar la imagen."));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", calidad));
      };
      img.onerror = () =>
        reject(new Error("Uno de los archivos no es una imagen válida."));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error("Error al leer el archivo."));
    reader.readAsDataURL(file);
  });
}

export default function ImagenPublicacionInput({
  imagenes,
  onChange,
  maxFotos = 4,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [mostrarUrl, setMostrarUrl] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [indiceAjustando, setIndiceAjustando] = useState<number | null>(null);
  const [errorImg, setErrorImg] = useState<string | null>(null);

  const espaciosDisponibles = Math.max(0, maxFotos - imagenes.length);

  const handleArchivos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivos = Array.from(e.target.files || []);
    e.target.value = "";
    if (archivos.length === 0) return;

    setErrorImg(null);
    const validos = archivos.filter((f) => f.type.startsWith("image/"));
    if (validos.length !== archivos.length) {
      setErrorImg("Solo se permiten archivos de imagen (JPG, PNG o WEBP).");
    }

    const lote = validos.slice(0, espaciosDisponibles);
    if (validos.length > espaciosDisponibles) {
      setErrorImg(
        `Puedes subir un máximo de ${maxFotos} fotos por publicación.`,
      );
    }

    try {
      const nuevas = await Promise.all(lote.map((f) => comprimirImagen(f)));
      onChange([...imagenes, ...nuevas]);
    } catch (err: any) {
      setErrorImg(err?.message || "No se pudieron cargar las imágenes.");
    }
  };

  const handleAgregarUrl = () => {
    const limpia = urlInput.trim();
    if (!limpia || espaciosDisponibles === 0) return;
    setErrorImg(null);
    onChange([...imagenes, limpia]);
    setUrlInput("");
  };

  const handleEliminar = (index: number) => {
    setErrorImg(null);
    onChange(imagenes.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-slate-700">
          Fotos de referencia{" "}
          <span className="text-slate-400">
            (opcional, {imagenes.length}/{maxFotos})
          </span>
        </Label>

        {espaciosDisponibles > 0 && (
          <button
            type="button"
            onClick={() => setMostrarUrl((prev) => !prev)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-700 cursor-pointer"
          >
            <Link2 className="w-3 h-3" />
            {mostrarUrl ? "Subir desde dispositivo" : "Agregar por URL"}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleArchivos}
        className="hidden"
      />

      {/* Cuadrícula de fotos cargadas */}
      {imagenes.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {imagenes.map((src, idx) => (
            <div
              key={`${idx}-${src.slice(0, 24)}`}
              className="group relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50 aspect-[16/10]"
            >
              <img
                src={src}
                alt={`Foto ${idx + 1}`}
                className="w-full h-full object-cover"
              />

              <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIndiceAjustando(idx)}
                  title="Ajustar encuadre"
                  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white/95 hover:bg-indigo-50 text-slate-800 hover:text-indigo-700 border border-slate-200 text-[10px] font-semibold shadow-sm cursor-pointer"
                >
                  <Crop className="w-3 h-3" />
                  Ajustar
                </button>

                <button
                  type="button"
                  onClick={() => handleEliminar(idx)}
                  title="Quitar foto"
                  className="p-1 rounded bg-white/95 hover:bg-rose-50 text-rose-600 border border-slate-200 shadow-sm cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Zona para agregar más fotos */}
      {espaciosDisponibles > 0 &&
        (mostrarUrl ? (
          <div className="flex gap-2">
            <Input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAgregarUrl();
                }
              }}
              placeholder="https://ejemplo.com/foto.jpg"
              className="text-xs border-slate-300 text-slate-900"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleAgregarUrl}
              className="text-xs border-slate-300 text-slate-700 shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Añadir
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-4 px-4 rounded-lg border border-dashed border-slate-300 bg-slate-50/70 hover:bg-indigo-50/40 hover:border-indigo-300 transition-colors flex flex-col items-center justify-center gap-1 text-slate-600 cursor-pointer"
          >
            <ImagePlus className="w-5 h-5 text-indigo-600" />
            <span className="text-xs font-medium text-slate-800">
              {imagenes.length === 0
                ? "Seleccionar fotos desde tu dispositivo"
                : `Agregar más fotos (quedan ${espaciosDisponibles})`}
            </span>
            <span className="text-[11px] text-slate-400">
              Puedes subir varias y ajustar cada una
            </span>
          </button>
        ))}

      {errorImg && <p className="text-[11px] text-rose-600">{errorImg}</p>}

      <AjustarFotoDialog
        imagenSrc={
          indiceAjustando !== null ? (imagenes[indiceAjustando] ?? null) : null
        }
        onClose={() => setIndiceAjustando(null)}
        onAplicar={(ajustada) => {
          if (indiceAjustando === null) return;
          onChange(
            imagenes.map((img, i) => (i === indiceAjustando ? ajustada : img)),
          );
        }}
      />
    </div>
  );
}
