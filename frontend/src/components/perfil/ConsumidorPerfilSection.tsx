import React, { useRef, useState } from "react";
import {
  Camera,
  CheckCircle2,
  LocateFixed,
  MapPin,
  Move,
  ShieldAlert,
  User,
  ZoomIn,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  actualizarUsuario,
  verificarCorreoUsuario,
} from "../../services/perfilService";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
  onClearAlerts: () => void;
}

export default function ConsumidorPerfilSection({
  onSuccess,
  onError,
  onClearAlerts,
}: Props) {
  const { user, login } = useAuth();
  if (!user) return null;

  const userId = user.id || (user as any)._id;

  const [guardandoPersonal, setGuardandoPersonal] = useState(false);
  const [guardandoDireccion, setGuardandoDireccion] = useState(false);

  // Modal GPS
  const [modalAvisoGPS, setModalAvisoGPS] = useState(false);
  const [detectandoGPS, setDetectandoGPS] = useState(false);
  const [coordenadasDetectadas, setCoordenadasDetectadas] = useState<
    [number, number] | null
  >(user.ubicacion_gps?.coordinates || null);

  // Modal y estado para ajustar Foto de Perfil
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [modalFoto, setModalFoto] = useState(false);
  const [imagenCruda, setImagenCruda] = useState<string | null>(null);
  const [zoomFoto, setZoomFoto] = useState(1);
  const [offsetFoto, setOffsetFoto] = useState({ x: 0, y: 0 });
  const [arrastrando, setArrastrando] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Datos personales + Foto de perfil
  const [datosPers, setDatosPers] = useState({
    nombres: user.nombres || "",
    apellido_paterno: user.apellido_paterno || "",
    apellido_materno: user.apellido_materno || "",
    telefono: user.telefono || "",
    foto_perfil: user.foto_perfil || "",
  });

  // Dirección
  const [dirForm, setDirForm] = useState({
    pais: user.direccion?.pais || "México",
    estado: user.direccion?.estado || "",
    municipio: user.direccion?.municipio || "",
    colonia: user.direccion?.colonia || "",
    calle: user.direccion?.calle || "",
    numero_exterior: user.direccion?.numero_exterior || "",
    numero_interior: user.direccion?.numero_interior || "",
    codigo_postal: user.direccion?.codigo_postal || "",
  });

  const hayCambiosPersonales =
    datosPers.nombres.trim() !== (user.nombres || "") ||
    datosPers.apellido_paterno.trim() !== (user.apellido_paterno || "") ||
    datosPers.apellido_materno.trim() !== (user.apellido_materno || "") ||
    datosPers.telefono !== (user.telefono || "") ||
    datosPers.foto_perfil !== (user.foto_perfil || "");

  const gpsGuardado = user.ubicacion_gps?.coordinates;
  const hayCambioGPS =
    Boolean(coordenadasDetectadas) &&
    (!gpsGuardado ||
      coordenadasDetectadas![0] !== gpsGuardado[0] ||
      coordenadasDetectadas![1] !== gpsGuardado[1]);

  const hayCambiosDireccion =
    dirForm.pais.trim() !== (user.direccion?.pais || "México") ||
    dirForm.estado.trim() !== (user.direccion?.estado || "") ||
    dirForm.municipio.trim() !== (user.direccion?.municipio || "") ||
    dirForm.colonia.trim() !== (user.direccion?.colonia || "") ||
    dirForm.calle.trim() !== (user.direccion?.calle || "") ||
    dirForm.numero_exterior.trim() !==
      (user.direccion?.numero_exterior || "") ||
    dirForm.numero_interior.trim() !==
      (user.direccion?.numero_interior || "") ||
    dirForm.codigo_postal.trim() !== (user.direccion?.codigo_postal || "") ||
    hayCambioGPS;

  // Foto de perfil
  const handleClickAvatar = () => {
    onClearAlerts();
    if (datosPers.foto_perfil) {
      setImagenCruda(datosPers.foto_perfil);
      setZoomFoto(1);
      setOffsetFoto({ x: 0, y: 0 });
      setModalFoto(true);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleArchivoSeleccionado = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      onError("Selecciona un archivo de imagen válido (JPG, PNG o WebP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagenCruda(ev.target?.result as string);
      setZoomFoto(1);
      setOffsetFoto({ x: 0, y: 0 });
      setModalFoto(true);
    };
    reader.readAsDataURL(file);
  };

  const aplicarRecorteFoto = () => {
    if (!imagenCruda) return;
    const img = new Image();
    img.onload = () => {
      const outputSize = 256;
      const previewSize = 224;
      const canvas = document.createElement("canvas");
      canvas.width = outputSize;
      canvas.height = outputSize;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, outputSize, outputSize);

      const scaleToCover = Math.max(
        outputSize / img.width,
        outputSize / img.height,
      );
      const drawWidth = img.width * scaleToCover * zoomFoto;
      const drawHeight = img.height * scaleToCover * zoomFoto;

      const ratio = outputSize / previewSize;
      const dx = (outputSize - drawWidth) / 2 + offsetFoto.x * ratio;
      const dy = (outputSize - drawHeight) / 2 + offsetFoto.y * ratio;

      ctx.drawImage(img, dx, dy, drawWidth, drawHeight);
      const recorteBase64 = canvas.toDataURL("image/jpeg", 0.85);

      setDatosPers((prev) => ({ ...prev, foto_perfil: recorteBase64 }));
      setModalFoto(false);
    };
    img.src = imagenCruda;
  };

  const descartarPersonal = () => {
    onClearAlerts();
    setDatosPers({
      nombres: user.nombres || "",
      apellido_paterno: user.apellido_paterno || "",
      apellido_materno: user.apellido_materno || "",
      telefono: user.telefono || "",
      foto_perfil: user.foto_perfil || "",
    });
  };

  const descartarDireccion = () => {
    onClearAlerts();
    setDirForm({
      pais: user.direccion?.pais || "México",
      estado: user.direccion?.estado || "",
      municipio: user.direccion?.municipio || "",
      colonia: user.direccion?.colonia || "",
      calle: user.direccion?.calle || "",
      numero_exterior: user.direccion?.numero_exterior || "",
      numero_interior: user.direccion?.numero_interior || "",
      codigo_postal: user.direccion?.codigo_postal || "",
    });
    setCoordenadasDetectadas(user.ubicacion_gps?.coordinates || null);
  };

  // Detectar ubicación GPS
  const obtenerDireccionPorGPS = () => {
    onClearAlerts();
    if (!("geolocation" in navigator)) {
      setModalAvisoGPS(false);
      onError("Tu navegador no soporta geolocalización.");
      return;
    }

    setDetectandoGPS(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoordenadasDetectadas([longitude, latitude]);

        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=es`,
          );
          const data = await resp.json();
          const addr = data.address || {};

          setDirForm((prev) => ({
            ...prev,
            pais: addr.country || "México",
            estado: addr.state || prev.estado,
            municipio:
              addr.city ||
              addr.town ||
              addr.municipality ||
              addr.county ||
              prev.municipio,
            colonia:
              addr.suburb ||
              addr.neighbourhood ||
              addr.quarter ||
              addr.village ||
              prev.colonia,
            calle: addr.road || prev.calle,
            numero_exterior: addr.house_number || prev.numero_exterior || "S/N",
            codigo_postal:
              (addr.postcode || "").replace(/\D/g, "").slice(0, 5) ||
              prev.codigo_postal,
          }));

          setModalAvisoGPS(false);
          onSuccess(
            "Ubicación detectada. Revisa los campos rellenados y pulsa 'Guardar cambios'.",
          );
        } catch {
          setModalAvisoGPS(false);
          onError(
            "Se obtuvieron tus coordenadas GPS, pero no se pudo traducir la calle automáticamente.",
          );
        } finally {
          setDetectandoGPS(false);
        }
      },
      (geoErr) => {
        setDetectandoGPS(false);
        setModalAvisoGPS(false);
        if (geoErr.code === geoErr.PERMISSION_DENIED) {
          onError(
            "Permiso de ubicación denegado. Habilítalo en tu navegador o escribe tu dirección manualmente.",
          );
        } else {
          onError("No se pudo obtener tu ubicación actual. Intenta de nuevo.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // Guardar Datos Personales
  const guardarPersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    onClearAlerts();
    if (!datosPers.nombres.trim() || !datosPers.apellido_paterno.trim()) {
      onError("El nombre y apellido paterno son obligatorios.");
      return;
    }
    if (datosPers.telefono && datosPers.telefono.length !== 10) {
      onError("El teléfono debe tener exactamente 10 dígitos.");
      return;
    }
    setGuardandoPersonal(true);
    try {
      const actualizado = await actualizarUsuario(userId, {
        nombres: datosPers.nombres.trim(),
        apellido_paterno: datosPers.apellido_paterno.trim(),
        apellido_materno: datosPers.apellido_materno.trim() || undefined,
        telefono: datosPers.telefono || undefined,
        foto_perfil: datosPers.foto_perfil || undefined,
      });
      login({ ...user, ...actualizado, id: userId });
      onSuccess("Datos personales guardados.");
    } catch {
      onError("No se pudieron guardar los datos personales.");
    } finally {
      setGuardandoPersonal(false);
    }
  };

  // Guardar Dirección + GPS
  const guardarDireccion = async (e: React.FormEvent) => {
    e.preventDefault();
    onClearAlerts();
    if (
      !dirForm.estado.trim() ||
      !dirForm.municipio.trim() ||
      !dirForm.colonia.trim() ||
      !dirForm.calle.trim() ||
      !dirForm.numero_exterior.trim() ||
      dirForm.codigo_postal.length !== 5
    ) {
      onError(
        "Completa todos los campos obligatorios de dirección y un C.P. de 5 dígitos.",
      );
      return;
    }
    setGuardandoDireccion(true);
    try {
      const actualizado = await actualizarUsuario(userId, {
        direccion: {
          pais: dirForm.pais.trim() || "México",
          estado: dirForm.estado.trim(),
          municipio: dirForm.municipio.trim(),
          colonia: dirForm.colonia.trim(),
          calle: dirForm.calle.trim(),
          numero_exterior: dirForm.numero_exterior.trim(),
          numero_interior: dirForm.numero_interior.trim() || undefined,
          codigo_postal: dirForm.codigo_postal,
        },
        ...(coordenadasDetectadas
          ? {
              ubicacion_gps: {
                type: "Point" as const,
                coordinates: coordenadasDetectadas,
              },
            }
          : {}),
      });
      login({ ...user, ...actualizado, id: userId });
      onSuccess("Dirección y ubicación guardadas correctamente.");
    } catch {
      onError("No se pudo guardar la dirección.");
    } finally {
      setGuardandoDireccion(false);
    }
  };

  // Verificar Correo
  const handleVerificarCorreo = async () => {
    onClearAlerts();
    try {
      await verificarCorreoUsuario(user.correo_registro);
      login({ ...user, correo_verificado: true });
      onSuccess("Correo verificado exitosamente.");
    } catch {
      onError("No se pudo verificar el correo.");
    }
  };

  const iniciales = `${(datosPers.nombres || "U")[0]}${
    (datosPers.apellido_paterno || "")[0] || ""
  }`.toUpperCase();

  return (
    <>
      {/* BLOQUE 1: DATOS PERSONALES + FOTO DE PERFIL CENTRADA */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-600" />
            <CardTitle className="text-base font-bold text-slate-900">
              Datos Personales
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={guardarPersonal} className="space-y-5">
            <div className="flex flex-col items-center justify-center pt-1 pb-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleArchivoSeleccionado}
                className="hidden"
              />
              <div className="relative group">
                <button
                  type="button"
                  onClick={handleClickAvatar}
                  title={
                    datosPers.foto_perfil
                      ? "Ajustar o cambiar foto de perfil"
                      : "Subir foto de perfil"
                  }
                  className="w-28 h-28 rounded-full bg-indigo-100 text-indigo-700 font-bold text-3xl flex items-center justify-center overflow-hidden border-2 border-indigo-200 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {datosPers.foto_perfil ? (
                    <img
                      src={datosPers.foto_perfil}
                      alt="Foto de perfil"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{iniciales}</span>
                  )}

                  <span className="absolute inset-x-0 bottom-0 h-8 bg-black/55 text-white flex items-center justify-center gap-1 text-[11px] font-medium backdrop-blur-[1px] group-hover:bg-indigo-600/90 transition-colors">
                    <Camera className="w-3.5 h-3.5" />
                    {datosPers.foto_perfil ? "Ajustar" : "Subir"}
                  </span>
                </button>
              </div>
              <span className="text-[11px] text-slate-400 mt-1.5">
                {datosPers.foto_perfil
                  ? "Toca la foto para ajustar encuadre o cambiarla"
                  : "Toca el círculo para subir tu foto de perfil"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-slate-700">Nombre(s) *</Label>
                <Input
                  required
                  value={datosPers.nombres}
                  onChange={(e) =>
                    setDatosPers({ ...datosPers, nombres: e.target.value })
                  }
                  className="bg-white border-slate-300 text-sm text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-700">
                  Apellido Paterno *
                </Label>
                <Input
                  required
                  value={datosPers.apellido_paterno}
                  onChange={(e) =>
                    setDatosPers({
                      ...datosPers,
                      apellido_paterno: e.target.value,
                    })
                  }
                  className="bg-white border-slate-300 text-sm text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-700">
                  Apellido Materno
                </Label>
                <Input
                  value={datosPers.apellido_materno}
                  onChange={(e) =>
                    setDatosPers({
                      ...datosPers,
                      apellido_materno: e.target.value,
                    })
                  }
                  placeholder="Opcional"
                  className="bg-white border-slate-300 text-sm text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <Label className="text-xs text-slate-700">
                    Teléfono (10 dígitos)
                  </Label>
                  <span className="text-[11px] text-slate-400">
                    {datosPers.telefono.length}/10
                  </span>
                </div>
                <Input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={datosPers.telefono}
                  onChange={(e) =>
                    setDatosPers({
                      ...datosPers,
                      telefono: e.target.value.replace(/\D/g, "").slice(0, 10),
                    })
                  }
                  placeholder="7221234567"
                  className="bg-white border-slate-300 text-sm text-slate-900"
                />
              </div>

              <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <div className="truncate">
                  <span className="text-slate-400 block text-[11px]">
                    Correo electrónico
                  </span>
                  <span className="font-semibold text-slate-800">
                    {user.correo_registro}
                  </span>
                </div>
                {user.correo_verificado ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verificado
                  </span>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleVerificarCorreo}
                    className="text-xs border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 cursor-pointer shrink-0"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 mr-1" /> Verificar
                  </Button>
                )}
              </div>
            </div>

            {hayCambiosPersonales && (
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={descartarPersonal}
                  disabled={guardandoPersonal}
                  className="text-xs border-slate-300 text-slate-700 cursor-pointer"
                >
                  Descartar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={guardandoPersonal}
                  className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                >
                  {guardandoPersonal ? "Guardando..." : "Guardar cambios"}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* BLOQUE 2: DIRECCIÓN */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-600" />
              <CardTitle className="text-base font-bold text-slate-900">
                Dirección
              </CardTitle>
            </div>
            {coordenadasDetectadas && (
              <span className="text-[11px] text-slate-400">
                GPS: {coordenadasDetectadas[1].toFixed(4)},{" "}
                {coordenadasDetectadas[0].toFixed(4)}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={guardarDireccion} className="space-y-3">
            <div className="pb-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onClearAlerts();
                  setModalAvisoGPS(true);
                }}
                className="w-full sm:w-auto text-xs border-indigo-200 bg-indigo-50/80 text-indigo-700 hover:bg-indigo-100 cursor-pointer"
              >
                <LocateFixed className="w-3.5 h-3.5 mr-1.5" />
                Obtener dirección automáticamente (GPS)
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-slate-700">Estado *</Label>
                <Input
                  required
                  value={dirForm.estado}
                  onChange={(e) =>
                    setDirForm({ ...dirForm, estado: e.target.value })
                  }
                  placeholder="Estado de México"
                  className="bg-white border-slate-300 text-sm text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-700">Municipio *</Label>
                <Input
                  required
                  value={dirForm.municipio}
                  onChange={(e) =>
                    setDirForm({ ...dirForm, municipio: e.target.value })
                  }
                  placeholder="Toluca"
                  className="bg-white border-slate-300 text-sm text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-700">
                  Código Postal *
                </Label>
                <Input
                  required
                  inputMode="numeric"
                  maxLength={5}
                  value={dirForm.codigo_postal}
                  onChange={(e) =>
                    setDirForm({
                      ...dirForm,
                      codigo_postal: e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 5),
                    })
                  }
                  placeholder="50200"
                  className="bg-white border-slate-300 text-sm text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-slate-700">Colonia *</Label>
                <Input
                  required
                  value={dirForm.colonia}
                  onChange={(e) =>
                    setDirForm({ ...dirForm, colonia: e.target.value })
                  }
                  placeholder="Colonia o localidad"
                  className="bg-white border-slate-300 text-sm text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-700">Calle *</Label>
                <Input
                  required
                  value={dirForm.calle}
                  onChange={(e) =>
                    setDirForm({ ...dirForm, calle: e.target.value })
                  }
                  placeholder="Nombre de la calle"
                  className="bg-white border-slate-300 text-sm text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-slate-700">No. Exterior *</Label>
                <Input
                  required
                  value={dirForm.numero_exterior}
                  onChange={(e) =>
                    setDirForm({ ...dirForm, numero_exterior: e.target.value })
                  }
                  placeholder="S/N o número"
                  className="bg-white border-slate-300 text-sm text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-700">No. Interior</Label>
                <Input
                  value={dirForm.numero_interior}
                  onChange={(e) =>
                    setDirForm({ ...dirForm, numero_interior: e.target.value })
                  }
                  placeholder="Opcional"
                  className="bg-white border-slate-300 text-sm text-slate-900"
                />
              </div>
              <div className="space-y-1 col-span-2 sm:col-span-1">
                <Label className="text-xs text-slate-700">País</Label>
                <Input
                  value={dirForm.pais}
                  onChange={(e) =>
                    setDirForm({ ...dirForm, pais: e.target.value })
                  }
                  className="bg-white border-slate-300 text-sm text-slate-900"
                />
              </div>
            </div>

            {hayCambiosDireccion && (
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={descartarDireccion}
                  disabled={guardandoDireccion}
                  className="text-xs border-slate-300 text-slate-700 cursor-pointer"
                >
                  Descartar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={guardandoDireccion}
                  className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                >
                  {guardandoDireccion ? "Guardando..." : "Guardar cambios"}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* MODAL AJUSTE DE FOTO DE PERFIL */}
      <Dialog open={modalFoto} onOpenChange={setModalFoto}>
        <DialogContent className="bg-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-black">
              Ajustar foto de perfil
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Arrastra la imagen para centrar tu rostro y usa el deslizador para
              acercar o alejar.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-2">
            <div
              onPointerDown={(e) => {
                setArrastrando(true);
                dragStartRef.current = {
                  x: e.clientX - offsetFoto.x,
                  y: e.clientY - offsetFoto.y,
                };
              }}
              onPointerMove={(e) => {
                if (!arrastrando) return;
                setOffsetFoto({
                  x: e.clientX - dragStartRef.current.x,
                  y: e.clientY - dragStartRef.current.y,
                });
              }}
              onPointerUp={() => setArrastrando(false)}
              onPointerLeave={() => setArrastrando(false)}
              className="relative w-56 h-56 rounded-full overflow-hidden border-2 border-indigo-600 bg-slate-100 cursor-grab active:cursor-grabbing select-none touch-none"
            >
              {imagenCruda && (
                <img
                  src={imagenCruda}
                  alt="Vista previa"
                  draggable={false}
                  style={{
                    transform: `translate(${offsetFoto.x}px, ${offsetFoto.y}px) scale(${zoomFoto})`,
                  }}
                  className="w-full h-full object-cover pointer-events-none"
                />
              )}
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] flex items-center gap-1 pointer-events-none">
                <Move className="w-3 h-3" /> Arrastra
              </span>
            </div>

            <div className="w-full max-w-xs flex items-center gap-2">
              <ZoomIn className="w-4 h-4 text-slate-500 shrink-0" />
              <input
                type="range"
                min={1}
                max={2.5}
                step={0.05}
                value={zoomFoto}
                onChange={(e) => setZoomFoto(parseFloat(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <span className="text-xs text-slate-500 w-10 text-right">
                {Math.round(zoomFoto * 100)}%
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between w-full gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs border-slate-300 text-slate-700 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 mr-1.5" />
                Elegir otra foto
              </Button>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setModalFoto(false)}
                  className="text-xs border-slate-300 text-slate-700 cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={aplicarRecorteFoto}
                  className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                >
                  Aplicar foto
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL AVISO DE UBICACIÓN GPS */}
      <Dialog open={modalAvisoGPS} onOpenChange={setModalAvisoGPS}>
        <DialogContent className="bg-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-black flex items-center gap-2">
              <LocateFixed className="w-5 h-5 text-indigo-600" />
              Detección automática de ubicación
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 pt-1 leading-relaxed">
              Tu navegador te pedirá permiso para acceder a tu ubicación actual.
              Usaremos tus coordenadas únicamente para rellenar tu calle,
              colonia, municipio y código postal de forma automática. Podrás
              revisar o corregir los datos antes de guardarlos.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={detectandoGPS}
              onClick={() => setModalAvisoGPS(false)}
              className="text-xs border-slate-300 text-slate-700 cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={detectandoGPS}
              onClick={obtenerDireccionPorGPS}
              className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
            >
              {detectandoGPS
                ? "Detectando ubicación..."
                : "Permitir y detectar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
