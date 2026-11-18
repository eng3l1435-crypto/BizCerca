import { useState } from "react";
import { Loader2, MapPin, Trash2 } from "lucide-react";
import {
  aproximarCoordenadas,
  obtenerDireccionAproximada,
  obtenerUbicacionGPS,
} from "../../utils/ubicacionUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type RadioCoberturaKm = 1 | 3 | 5;

export interface UbicacionPublicacionData {
  direccion_aproximada: string;
  radio_km: RadioCoberturaKm;
  ubicacion_gps: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat] GeoJSON
  };
}

interface Props {
  value: UbicacionPublicacionData | null;
  onChange: (value: UbicacionPublicacionData | null) => void;
}

const RADIOS_PERMITIDOS: RadioCoberturaKm[] = [1, 3, 5];

export default function UbicacionPublicacionField({ value, onChange }: Props) {
  const [cargandoGps, setCargandoGps] = useState(false);
  const [errorGps, setErrorGps] = useState<string | null>(null);

  const handleObtenerGps = async () => {
    setErrorGps(null);
    setCargandoGps(true);
    try {
      const exactas = await obtenerUbicacionGPS();
      const aprox = aproximarCoordenadas(exactas);
      const direccion = await obtenerDireccionAproximada(aprox.lat, aprox.lng);

      onChange({
        direccion_aproximada: direccion,
        radio_km: value?.radio_km ?? 3,
        ubicacion_gps: {
          type: "Point",
          coordinates: [aprox.lng, aprox.lat],
        },
      });
    } catch (err: any) {
      setErrorGps(
        err?.message || "No se pudo obtener tu ubicación GPS próxima.",
      );
    } finally {
      setCargandoGps(false);
    }
  };

  return (
    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-indigo-600" />
            Ubicación próxima y radio de alcance (opcional)
          </Label>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Solo será visible para usuarios que activen su ubicación en
            Explorar.
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={cargandoGps}
            onClick={handleObtenerGps}
            className="h-8 text-xs font-semibold border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50 cursor-pointer"
          >
            {cargandoGps ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Obteniendo...
              </>
            ) : (
              <>
                <MapPin className="w-3.5 h-3.5 mr-1.5" />
                {value ? "Actualizar GPS" : "Obtener dirección GPS"}
              </>
            )}
          </Button>

          {value && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                setErrorGps(null);
                onChange(null);
              }}
              title="Quitar ubicación"
              className="h-8 w-8 text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {errorGps && (
        <p className="text-[11px] font-medium text-rose-600">{errorGps}</p>
      )}

      {value && (
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
          <div className="sm:col-span-8 space-y-1">
            <Label className="text-[11px] font-semibold text-slate-700">
              Dirección o zona aproximada
            </Label>
            <Input
              value={value.direccion_aproximada}
              onChange={(e) =>
                onChange({
                  ...value,
                  direccion_aproximada: e.target.value,
                })
              }
              placeholder="Ej. Col. Centro, Toluca, Estado de México"
              className="h-8 bg-white border-slate-200 text-xs text-slate-900"
            />
          </div>

          <div className="sm:col-span-4 space-y-1">
            <Label
              htmlFor="radio-cobertura-select"
              className="text-[11px] font-semibold text-slate-700"
            >
              Radio de cobertura (km)
            </Label>
            <select
              id="radio-cobertura-select"
              value={value.radio_km}
              onChange={(e) => {
                const seleccionado = Number(e.target.value) as RadioCoberturaKm;
                if (RADIOS_PERMITIDOS.includes(seleccionado)) {
                  onChange({
                    ...value,
                    radio_km: seleccionado,
                  });
                }
              }}
              className="h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-900 outline-none focus:border-indigo-600 cursor-pointer"
            >
              {RADIOS_PERMITIDOS.map((km) => (
                <option key={km} value={km}>
                  {km} km
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
