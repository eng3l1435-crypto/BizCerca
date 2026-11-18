import React, { useEffect, useRef, useState } from "react";
import { RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  imagenSrc: string | null;
  onClose: () => void;
  onAplicar: (imagenAjustada: string) => void;
}

const ASPECTO = 16 / 10;
const ANCHO_SALIDA = 960;
const ALTO_SALIDA = Math.round(ANCHO_SALIDA / ASPECTO);

export default function AjustarFotoDialog({
  imagenSrc,
  onClose,
  onAplicar,
}: Props) {
  const marcoRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [marcoAncho, setMarcoAncho] = useState(440);
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotacion, setRotacion] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [arrastrando, setArrastrando] = useState(false);
  const [inicioArrastre, setInicioArrastre] = useState({ x: 0, y: 0 });
  const [errorCors, setErrorCors] = useState<string | null>(null);

  const marcoAlto = marcoAncho / ASPECTO;

  useEffect(() => {
    if (!imagenSrc) return;
    setZoom(1);
    setRotacion(0);
    setOffset({ x: 0, y: 0 });
    setErrorCors(null);
    setNaturalSize({ w: 0, h: 0 });
  }, [imagenSrc]);

  useEffect(() => {
    const nodo = marcoRef.current;
    if (!nodo) return;
    const actualizarAncho = () => {
      if (nodo.clientWidth > 0) setMarcoAncho(nodo.clientWidth);
    };
    actualizarAncho();
    const ro = new ResizeObserver(actualizarAncho);
    ro.observe(nodo);
    return () => ro.disconnect();
  }, [imagenSrc]);

  const rotado90 = rotacion % 180 !== 0;
  const effW = rotado90 ? naturalSize.h : naturalSize.w;
  const effH = rotado90 ? naturalSize.w : naturalSize.h;

  const baseScale =
    effW > 0 && effH > 0 ? Math.max(marcoAncho / effW, marcoAlto / effH) : 1;
  const scale = baseScale * zoom;

  const limitarOffset = (x: number, y: number, z = zoom, rot = rotacion) => {
    const r90 = rot % 180 !== 0;
    const ew = r90 ? naturalSize.h : naturalSize.w;
    const eh = r90 ? naturalSize.w : naturalSize.h;
    if (!ew || !eh) return { x: 0, y: 0 };

    const bs = Math.max(marcoAncho / ew, marcoAlto / eh);
    const sc = bs * z;
    const maxX = Math.max(0, (ew * sc - marcoAncho) / 2);
    const maxY = Math.max(0, (eh * sc - marcoAlto) / 2);

    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    };
  };

  const handleZoom = (nuevoZoom: number) => {
    const z = Math.min(3, Math.max(1, Number(nuevoZoom.toFixed(2))));
    setZoom(z);
    setOffset((prev) => limitarOffset(prev.x, prev.y, z, rotacion));
  };

  const handleRotar = () => {
    const nuevaRot = (rotacion + 90) % 360;
    setRotacion(nuevaRot);
    setOffset((prev) => limitarOffset(prev.x, prev.y, zoom, nuevaRot));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setArrastrando(true);
    setInicioArrastre({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!arrastrando) return;
    setOffset(
      limitarOffset(e.clientX - inicioArrastre.x, e.clientY - inicioArrastre.y),
    );
  };

  const handleGuardarAjuste = () => {
    const img = imgRef.current;
    if (!img || !naturalSize.w || !naturalSize.h) return;

    try {
      const canvas = document.createElement("canvas");
      canvas.width = ANCHO_SALIDA;
      canvas.height = ALTO_SALIDA;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const factorSalida = ANCHO_SALIDA / marcoAncho;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, ANCHO_SALIDA, ALTO_SALIDA);

      ctx.save();
      ctx.translate(
        ANCHO_SALIDA / 2 + offset.x * factorSalida,
        ALTO_SALIDA / 2 + offset.y * factorSalida,
      );
      ctx.rotate((rotacion * Math.PI) / 180);

      const drawW = naturalSize.w * scale * factorSalida;
      const drawH = naturalSize.h * scale * factorSalida;
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
      onAplicar(dataUrl);
      onClose();
    } catch {
      setErrorCors(
        "Esta imagen externa bloquea su edición por seguridad. Súbela desde tu dispositivo para ajustarla.",
      );
    }
  };

  return (
    <Dialog
      open={Boolean(imagenSrc)}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="bg-white text-slate-900 sm:max-w-lg [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-black">
            Ajustar fotografía
          </DialogTitle>
          <DialogDescription className="sr-only">
            Ajustar fotografía
          </DialogDescription>
        </DialogHeader>

        {imagenSrc && (
          <div className="space-y-3 pt-1">
            {/* Marco de recorte 16:10 */}
            <div
              ref={marcoRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={() => setArrastrando(false)}
              onPointerCancel={() => setArrastrando(false)}
              className="relative w-full aspect-[16/10] overflow-hidden rounded-lg bg-slate-900 border border-slate-300 select-none touch-none cursor-grab active:cursor-grabbing"
            >
              <img
                ref={imgRef}
                src={imagenSrc}
                alt="Ajustar"
                crossOrigin="anonymous"
                draggable={false}
                onLoad={(e) => {
                  const el = e.currentTarget;
                  setNaturalSize({ w: el.naturalWidth, h: el.naturalHeight });
                }}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: naturalSize.w ? `${naturalSize.w * scale}px` : "auto",
                  height: naturalSize.h ? `${naturalSize.h * scale}px` : "auto",
                  maxWidth: "none",
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) rotate(${rotacion}deg)`,
                }}
              />

              {/* Guía visual de tercios */}
              <div className="pointer-events-none absolute inset-0 border border-white/30 grid grid-cols-3 grid-rows-3">
                <div className="border-r border-b border-white/15" />
                <div className="border-r border-b border-white/15" />
                <div className="border-b border-white/15" />
                <div className="border-r border-b border-white/15" />
                <div className="border-r border-b border-white/15" />
                <div className="border-b border-white/15" />
                <div className="border-r border-white/15" />
                <div className="border-r border-white/15" />
                <div />
              </div>
            </div>

            {/* Controles de Zoom y Rotación */}
            <div className="flex items-center gap-3 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => handleZoom(zoom - 0.15)}
                className="p-1 text-slate-600 hover:text-indigo-700 cursor-pointer"
                title="Alejar"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => handleZoom(parseFloat(e.target.value))}
                className="flex-1 accent-indigo-600 cursor-pointer"
              />

              <button
                type="button"
                onClick={() => handleZoom(zoom + 0.15)}
                className="p-1 text-slate-600 hover:text-indigo-700 cursor-pointer"
                title="Acercar"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <div className="h-4 w-px bg-slate-300" />

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRotar}
                className="h-7 px-2.5 text-xs border-slate-300 text-slate-700 cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5 mr-1" />
                Rotar
              </Button>
            </div>

            {errorCors && (
              <p className="text-[11px] text-rose-600">{errorCors}</p>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="text-xs border-slate-300 text-slate-700 cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleGuardarAjuste}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
              >
                Aplicar ajuste
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
