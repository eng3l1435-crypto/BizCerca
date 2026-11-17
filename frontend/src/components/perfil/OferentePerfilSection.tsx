import React, { useEffect, useState } from "react";
import { Briefcase, Link2, Plus, Trash2 } from "lucide-react";
import {
  actualizarPerfilOferente,
  crearPerfilOferente,
  obtenerPerfilOferente,
} from "../../services/perfilService";
import {
  DatosEstudiante,
  DatosNegocioFreelancer,
  PerfilOferente,
  RedSocial,
} from "../../types/offerer";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DIAS_SEMANA = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

const HORAS_OPCIONES = Array.from({ length: 17 }, (_, i) => {
  const hora = String(i + 7).padStart(2, "0");
  return `${hora}:00`;
});

const PLATAFORMAS_REDES = [
  "Instagram",
  "Facebook",
  "LinkedIn",
  "GitHub",
  "TikTok",
  "X / Twitter",
  "WhatsApp",
  "Sitio Web",
];

function parsearHorario(horarioStr?: string) {
  if (!horarioStr) {
    return {
      diaInicio: "Lunes",
      diaFin: "Viernes",
      horaInicio: "09:00",
      horaFin: "18:00",
    };
  }
  const match = horarioStr.match(
    /^De\s+(.+?)\s+a\s+(.+?),\s+de\s+(\d{2}:\d{2})\s+a\s+(\d{2}:\d{2})$/,
  );
  if (match) {
    return {
      diaInicio: match[1],
      diaFin: match[2],
      horaInicio: match[3],
      horaFin: match[4],
    };
  }
  return {
    diaInicio: "Lunes",
    diaFin: "Viernes",
    horaInicio: "09:00",
    horaFin: "18:00",
  };
}

function formatearHorario(
  diaInicio: string,
  diaFin: string,
  horaInicio: string,
  horaFin: string,
) {
  return `De ${diaInicio} a ${diaFin}, de ${horaInicio} a ${horaFin}`;
}

interface Props {
  userId: string;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
  onClearAlerts: () => void;
}

export default function OferentePerfilSection({
  userId,
  onSuccess,
  onError,
  onClearAlerts,
}: Props) {
  const [perfilComercial, setPerfilComercial] = useState<PerfilOferente | null>(
    null,
  );
  const [cargandoOferente, setCargandoOferente] = useState(true);
  const [guardandoOferente, setGuardandoOferente] = useState(false);

  const [subRol, setSubRol] = useState<"estudiante" | "negocio" | "freelancer">(
    "estudiante",
  );
  const [productosServicios, setProductosServicios] = useState<
    "productos" | "servicios" | "ambos"
  >("servicios");
  const [modalidad, setModalidad] = useState<
    "presencial" | "en línea" | "mixto"
  >("mixto");
  const [descripcion, setDescripcion] = useState("");
  const [diaInicio, setDiaInicio] = useState("Lunes");
  const [diaFin, setDiaFin] = useState("Viernes");
  const [horaInicio, setHoraInicio] = useState("09:00");
  const [horaFin, setHoraFin] = useState("18:00");

  // Redes sociales
  const [redesSociales, setRedesSociales] = useState<RedSocial[]>([]);
  const [nuevoTipoRed, setNuevoTipoRed] = useState("Instagram");
  const [nuevaUrlRed, setNuevaUrlRed] = useState("");

  const [estForm, setEstForm] = useState({
    institucion_educativa: "",
    programa_carrera: "",
    correo_institucional_edu: "",
    semestre: "",
    portafolio_url: "",
    habilidades: "",
  });

  const [negForm, setNegForm] = useState({
    nombre_publico: "",
    tipo_actividad: "",
    sector: "",
    nombre_representante: "",
  });

  useEffect(() => {
    if (!userId) return;
    obtenerPerfilOferente(userId)
      .then((perfil) => {
        if (perfil) {
          setPerfilComercial(perfil);
          cargarFormOferente(perfil);
        }
      })
      .catch(() => onError("No se pudo consultar tu perfil comercial."))
      .finally(() => setCargandoOferente(false));
  }, [userId]);

  const cargarFormOferente = (perfil: PerfilOferente) => {
    setSubRol(perfil.sub_rol);
    setProductosServicios(perfil.productos_servicios);
    setModalidad(perfil.modalidad_atencion);
    setDescripcion(perfil.descripcion || "");
    setRedesSociales(perfil.redes_sociales || []);

    const parsed = parsearHorario(perfil.horarios);
    setDiaInicio(parsed.diaInicio);
    setDiaFin(parsed.diaFin);
    setHoraInicio(parsed.horaInicio);
    setHoraFin(parsed.horaFin);

    if (perfil.sub_rol === "estudiante") {
      const d = perfil.datos_especificos as DatosEstudiante;
      setEstForm({
        institucion_educativa: d.institucion_educativa || "",
        programa_carrera: d.programa_carrera || "",
        correo_institucional_edu: d.correo_institucional_edu || "",
        semestre: d.semestre || "",
        portafolio_url: d.portafolio_url || "",
        habilidades: (d.habilidades || []).join(", "),
      });
    } else {
      const d = perfil.datos_especificos as DatosNegocioFreelancer;
      setNegForm({
        nombre_publico: d.nombre_publico || "",
        tipo_actividad: d.tipo_actividad || "",
        sector: d.sector || "",
        nombre_representante: d.nombre_representante || "",
      });
    }
  };

  const horarioActualStr = formatearHorario(
    diaInicio,
    diaFin,
    horaInicio,
    horaFin,
  );

  const hayCambiosOferente = (() => {
    if (!perfilComercial) return true;

    const redesGuardadas = perfilComercial.redes_sociales || [];
    const hayCambioRedes =
      redesSociales.length !== redesGuardadas.length ||
      redesSociales.some(
        (r, idx) =>
          r.tipo !== redesGuardadas[idx]?.tipo ||
          r.url !== redesGuardadas[idx]?.url,
      );

    if (
      descripcion.trim() !== (perfilComercial.descripcion || "") ||
      productosServicios !== perfilComercial.productos_servicios ||
      modalidad !== perfilComercial.modalidad_atencion ||
      horarioActualStr !== (perfilComercial.horarios || "") ||
      hayCambioRedes
    ) {
      return true;
    }

    if (perfilComercial.sub_rol === "estudiante") {
      const d = perfilComercial.datos_especificos as DatosEstudiante;
      return (
        estForm.institucion_educativa.trim() !==
          (d.institucion_educativa || "") ||
        estForm.programa_carrera.trim() !== (d.programa_carrera || "") ||
        estForm.correo_institucional_edu.trim() !==
          (d.correo_institucional_edu || "") ||
        estForm.portafolio_url.trim() !== (d.portafolio_url || "") ||
        estForm.habilidades.trim() !== (d.habilidades || []).join(", ")
      );
    } else {
      const d = perfilComercial.datos_especificos as DatosNegocioFreelancer;
      return (
        negForm.nombre_publico.trim() !== (d.nombre_publico || "") ||
        negForm.tipo_actividad.trim() !== (d.tipo_actividad || "") ||
        negForm.sector.trim() !== (d.sector || "")
      );
    }
  })();

  const handleAgregarRed = () => {
    onClearAlerts();
    const urlLimpia = nuevaUrlRed.trim();
    if (!urlLimpia) return;

    const urlFormateada = /^https?:\/\//i.test(urlLimpia)
      ? urlLimpia
      : `https://${urlLimpia}`;

    try {
      new URL(urlFormateada);
    } catch {
      onError(
        "Ingresa una URL válida (ejemplo: https://instagram.com/tu_usuario).",
      );
      return;
    }

    setRedesSociales((prev) => [
      ...prev,
      { tipo: nuevoTipoRed, url: urlFormateada },
    ]);
    setNuevaUrlRed("");
  };

  const handleEliminarRed = (index: number) => {
    setRedesSociales((prev) => prev.filter((_, i) => i !== index));
  };

  const descartarOferente = () => {
    onClearAlerts();
    if (perfilComercial) {
      cargarFormOferente(perfilComercial);
    }
  };

  const guardarOferente = async (e: React.FormEvent) => {
    e.preventDefault();
    onClearAlerts();
    setGuardandoOferente(true);

    const datos_especificos: DatosEstudiante | DatosNegocioFreelancer =
      subRol === "estudiante"
        ? {
            institucion_educativa: estForm.institucion_educativa.trim(),
            programa_carrera: estForm.programa_carrera.trim(),
            correo_institucional_edu:
              estForm.correo_institucional_edu.trim() || undefined,
            estudiante_verificado: Boolean(
              estForm.correo_institucional_edu.trim(),
            ),
            semestre: estForm.semestre.trim() || undefined,
            portafolio_url: estForm.portafolio_url.trim() || undefined,
            habilidades: estForm.habilidades
              .split(",")
              .map((h) => h.trim())
              .filter(Boolean),
            intereses: [],
          }
        : {
            nombre_publico: negForm.nombre_publico.trim(),
            tipo_actividad: negForm.tipo_actividad.trim(),
            sector: negForm.sector.trim(),
            representacion_legitimidad: true,
            nombre_representante:
              negForm.nombre_representante.trim() || undefined,
          };

    try {
      let resultado: PerfilOferente;
      if (perfilComercial) {
        resultado = await actualizarPerfilOferente(userId, {
          datos_especificos,
          descripcion: descripcion.trim() || undefined,
          productos_servicios: productosServicios,
          redes_sociales: redesSociales,
          modalidad_atencion: modalidad,
          horarios: horarioActualStr,
        });
      } else {
        resultado = await crearPerfilOferente({
          usuario_id: userId,
          sub_rol: subRol,
          datos_especificos,
          descripcion: descripcion.trim() || undefined,
          productos_servicios: productosServicios,
          redes_sociales: redesSociales,
          modalidad_atencion: modalidad,
          horarios: horarioActualStr,
        });
      }
      setPerfilComercial(resultado);
      cargarFormOferente(resultado);
      onSuccess("Perfil comercial guardado correctamente.");
    } catch (err: any) {
      const detalle = err.response?.data?.detail;
      onError(
        typeof detalle === "string"
          ? detalle
          : "Revisa que las URLs tengan formato https://...",
      );
    } finally {
      setGuardandoOferente(false);
    }
  };

  return (
    <Card className="bg-white border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-indigo-600" />
          <CardTitle className="text-base font-bold text-slate-900">
            Perfil Comercial de Oferente
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {cargandoOferente ? (
          <p className="text-xs text-slate-400">
            Cargando información comercial...
          </p>
        ) : (
          <form onSubmit={guardarOferente} className="space-y-4">
            <div>
              <Label className="text-xs text-slate-700 block mb-1.5">
                Tipo de Oferente *
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {(["estudiante", "freelancer", "negocio"] as const).map(
                  (rol) => (
                    <button
                      key={rol}
                      type="button"
                      disabled={Boolean(perfilComercial)}
                      onClick={() => setSubRol(rol)}
                      className={`py-2 px-3 rounded-lg border text-xs font-semibold capitalize cursor-pointer ${
                        subRol === rol
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 text-slate-600"
                      } disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                      {rol}
                    </button>
                  ),
                )}
              </div>
            </div>

            {/* Descripción de tu perfil */}
            <div className="space-y-1">
              <Label className="text-xs text-slate-700">
                Descripción de tu perfil
              </Label>
              <textarea
                rows={3}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Cuéntale a tus clientes quién eres, tu experiencia y qué ofreces..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-600"
              />
            </div>

            {subRol === "estudiante" ? (
              <div className="space-y-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-700">
                      Institución Educativa *
                    </Label>
                    <Input
                      required
                      value={estForm.institucion_educativa}
                      onChange={(e) =>
                        setEstForm({
                          ...estForm,
                          institucion_educativa: e.target.value,
                        })
                      }
                      placeholder="Ej. UTVT"
                      className="bg-white border-slate-300 text-sm text-slate-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-700">
                      Carrera / Programa *
                    </Label>
                    <Input
                      required
                      value={estForm.programa_carrera}
                      onChange={(e) =>
                        setEstForm({
                          ...estForm,
                          programa_carrera: e.target.value,
                        })
                      }
                      placeholder="Ing. en TI"
                      className="bg-white border-slate-300 text-sm text-slate-900"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-700">
                      Correo Institucional (.edu)
                    </Label>
                    <Input
                      type="email"
                      value={estForm.correo_institucional_edu}
                      onChange={(e) =>
                        setEstForm({
                          ...estForm,
                          correo_institucional_edu: e.target.value,
                        })
                      }
                      className="bg-white border-slate-300 text-sm text-slate-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-700">
                      Portafolio URL
                    </Label>
                    <Input
                      type="url"
                      value={estForm.portafolio_url}
                      onChange={(e) =>
                        setEstForm({
                          ...estForm,
                          portafolio_url: e.target.value,
                        })
                      }
                      placeholder="https://github.com/..."
                      className="bg-white border-slate-300 text-sm text-slate-900"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-700">
                    Habilidades (separadas por coma)
                  </Label>
                  <Input
                    value={estForm.habilidades}
                    onChange={(e) =>
                      setEstForm({
                        ...estForm,
                        habilidades: e.target.value,
                      })
                    }
                    placeholder="React, Python, Diseño gráfico"
                    className="bg-white border-slate-300 text-sm text-slate-900"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-700">
                    {subRol === "negocio"
                      ? "Nombre del Negocio *"
                      : "Nombre Profesional / Marca *"}
                  </Label>
                  <Input
                    required
                    value={negForm.nombre_publico}
                    onChange={(e) =>
                      setNegForm({
                        ...negForm,
                        nombre_publico: e.target.value,
                      })
                    }
                    className="bg-white border-slate-300 text-sm text-slate-900"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-700">
                      Tipo de Actividad *
                    </Label>
                    <Input
                      required
                      value={negForm.tipo_actividad}
                      onChange={(e) =>
                        setNegForm({
                          ...negForm,
                          tipo_actividad: e.target.value,
                        })
                      }
                      placeholder="Ej. Desarrollo web, Cafetería"
                      className="bg-white border-slate-300 text-sm text-slate-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-700">Sector *</Label>
                    <Input
                      required
                      value={negForm.sector}
                      onChange={(e) =>
                        setNegForm({ ...negForm, sector: e.target.value })
                      }
                      placeholder="Ej. Tecnología, Alimentos"
                      className="bg-white border-slate-300 text-sm text-slate-900"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-700 block mb-1">
                  ¿Qué ofreces? *
                </Label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["productos", "servicios", "ambos"] as const).map((op) => (
                    <button
                      key={op}
                      type="button"
                      onClick={() => setProductosServicios(op)}
                      className={`py-2 rounded-lg border text-xs font-medium capitalize cursor-pointer ${
                        productosServicios === op
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 text-slate-600"
                      }`}
                    >
                      {op}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs text-slate-700 block mb-1">
                  Modalidad *
                </Label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["presencial", "en línea", "mixto"] as const).map((mod) => (
                    <button
                      key={mod}
                      type="button"
                      onClick={() => setModalidad(mod)}
                      className={`py-2 rounded-lg border text-xs font-medium capitalize cursor-pointer ${
                        modalidad === mod
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 text-slate-600"
                      }`}
                    >
                      {mod}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Horarios de atención compactos */}
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-700 block">
                Horarios de atención
              </Label>
              <div className="flex flex-wrap items-center gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-slate-600">
                    De:
                  </span>
                  <Select value={diaInicio} onValueChange={setDiaInicio}>
                    <SelectTrigger className="w-[115px] h-8 bg-white border-slate-300 text-xs text-slate-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {DIAS_SEMANA.map((d) => (
                        <SelectItem key={d} value={d} className="text-xs">
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <span className="text-xs font-medium text-slate-600">A:</span>
                  <Select value={diaFin} onValueChange={setDiaFin}>
                    <SelectTrigger className="w-[115px] h-8 bg-white border-slate-300 text-xs text-slate-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {DIAS_SEMANA.map((d) => (
                        <SelectItem key={d} value={d} className="text-xs">
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-slate-600">
                    De:
                  </span>
                  <Select value={horaInicio} onValueChange={setHoraInicio}>
                    <SelectTrigger className="w-[88px] h-8 bg-white border-slate-300 text-xs text-slate-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {HORAS_OPCIONES.map((h) => (
                        <SelectItem key={h} value={h} className="text-xs">
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <span className="text-xs font-medium text-slate-600">A:</span>
                  <Select value={horaFin} onValueChange={setHoraFin}>
                    <SelectTrigger className="w-[88px] h-8 bg-white border-slate-300 text-xs text-slate-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {HORAS_OPCIONES.map((h) => (
                        <SelectItem key={h} value={h} className="text-xs">
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Redes Sociales */}
            <div className="space-y-2">
              <Label className="text-xs text-slate-700 block">
                Redes sociales y enlaces de contacto
              </Label>

              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={nuevoTipoRed} onValueChange={setNuevoTipoRed}>
                  <SelectTrigger className="sm:w-[150px] h-9 bg-white border-slate-300 text-xs text-slate-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {PLATAFORMAS_REDES.map((p) => (
                      <SelectItem key={p} value={p} className="text-xs">
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  type="text"
                  value={nuevaUrlRed}
                  onChange={(e) => setNuevaUrlRed(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAgregarRed();
                    }
                  }}
                  placeholder="Link de tu perfil"
                  className="flex-1 h-9 bg-white border-slate-300 text-xs text-slate-900"
                />

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAgregarRed}
                  className="h-9 text-xs border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Agregar
                </Button>
              </div>

              {redesSociales.length > 0 && (
                <ul className="space-y-1.5 pt-1">
                  {redesSociales.map((red, index) => (
                    <li
                      key={`${red.tipo}-${index}`}
                      className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Link2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="font-semibold text-slate-800 shrink-0">
                          {red.tipo}:
                        </span>
                        <a
                          href={red.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:underline truncate"
                        >
                          {red.url}
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleEliminarRed(index)}
                        title="Eliminar enlace"
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {hayCambiosOferente && (
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                {perfilComercial && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={descartarOferente}
                    disabled={guardandoOferente}
                    className="text-xs border-slate-300 text-slate-700 cursor-pointer"
                  >
                    Descartar
                  </Button>
                )}
                <Button
                  type="submit"
                  size="sm"
                  disabled={guardandoOferente}
                  className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                >
                  {guardandoOferente
                    ? "Guardando..."
                    : perfilComercial
                      ? "Guardar cambios"
                      : "Guardar Perfil Comercial"}
                </Button>
              </div>
            )}
          </form>
        )}
      </CardContent>
    </Card>
  );
}
