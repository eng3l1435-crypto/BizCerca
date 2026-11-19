import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";
import {
  AlignLeft,
  BadgeCheck,
  ChevronDown,
  Clock,
  ExternalLink,
  Globe,
  Loader2,
  MapPin,
  MessageCircle,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  SendHorizontal,
  Share2,
  ShieldCheck,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  obtenerUsuarioPublico,
  type UsuarioPublico,
} from "../services/authService";
import { obtenerPerfilOferente } from "../services/perfilService";
import type { PerfilOferente } from "../types/offerer";
import {
  borrarMensaje,
  editarMensaje,
  enviarMensaje,
  obtenerConversaciones,
  obtenerMensajes,
  type Conversacion,
  type MensajeChat,
  type UbicacionChat,
} from "../services/chatService";
import { comprimirImagen, obtenerIniciales } from "../utils/imagenUtils";
import {
  aproximarCoordenadas,
  obtenerDireccionAproximada,
  obtenerUbicacionGPS,
  type CoordenadasGPS,
} from "../utils/ubicacionUtils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PublicacionInteresItem {
  id: string;
  titulo: string;
  precio?: number | null;
  fecha?: string;
}

type ConversacionExtendida = Conversacion & {
  publicaciones_interes?: PublicacionInteresItem[];
  tiene_solicitud_pendiente?: boolean;
  peticiones_pendientes?: number;
  estado_hilo?: string;
};

function parsearFechaUTC(iso: string): Date {
  if (!iso) return new Date(NaN);
  const limpio = iso.trim();
  const tieneZona = /([zZ]|[+-]\d{2}:?\d{2})$/.test(limpio);
  return new Date(tieneZona ? limpio : `${limpio}Z`);
}

function formatearHora(iso: string): string {
  const d = parsearFechaUTC(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

function claveDia(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function etiquetaFechaChat(iso: string): string {
  const fecha = parsearFechaUTC(iso);
  if (Number.isNaN(fecha.getTime())) return "";
  const hoy = new Date();
  const ayer = new Date();
  ayer.setDate(hoy.getDate() - 1);

  if (claveDia(fecha) === claveDia(hoy)) return "Hoy";
  if (claveDia(fecha) === claveDia(ayer)) return "Ayer";

  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(fecha);
}

function formatearLoQueOfrece(
  valor: PerfilOferente["productos_servicios"],
): string {
  if (valor === "productos") return "Productos";
  if (valor === "servicios") return "Servicios";
  return "Productos y servicios";
}

function formatearModalidad(
  valor: PerfilOferente["modalidad_atencion"],
): string {
  if (valor === "presencial") return "Presencial";
  if (valor === "en línea") return "En línea";
  return "Mixto (presencial y en línea)";
}

function extraerTarjetaInteres(contenido: string): {
  esReactivacion: boolean;
  tituloInteres: string | null;
  cuerpoMensaje: string;
} {
  if (!contenido) {
    return { esReactivacion: false, tituloInteres: null, cuerpoMensaje: "" };
  }

  let lineas = contenido.split("\n");
  let esReactivacion = false;

  if (lineas[0]?.startsWith("🔄 Reactivación de contacto")) {
    esReactivacion = true;
    lineas = lineas.slice(1);
  }

  if (lineas[0]?.startsWith("📌 Interés en:")) {
    const tituloInteres = lineas[0].replace("📌 Interés en:", "").trim();
    const cuerpoMensaje = lineas.slice(1).join("\n").trim();
    return { esReactivacion, tituloInteres, cuerpoMensaje };
  }

  return {
    esReactivacion,
    tituloInteres: null,
    cuerpoMensaje: lineas.join("\n").trim(),
  };
}

export default function ConversacionesPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const userId = user?.id || (user as any)?._id;

  const [conversaciones, setConversaciones] = useState<ConversacionExtendida[]>(
    [],
  );
  const [usuariosMap, setUsuariosMap] = useState<
    Record<string, UsuarioPublico>
  >({});
  const [busquedaChat, setBusquedaChat] = useState("");
  const [cargandoConvs, setCargandoConvs] = useState(true);
  const [errorConvs, setErrorConvs] = useState<string | null>(null);

  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [cargandoMensajes, setCargandoMensajes] = useState(false);

  const [textoInput, setTextoInput] = useState("");
  const [fotoAdjunta, setFotoAdjunta] = useState<string | null>(null);
  const [coordsExactas, setCoordsExactas] = useState<CoordenadasGPS | null>(
    null,
  );
  const [etiquetaUbicacion, setEtiquetaUbicacion] = useState("");
  const [usarUbicacionAproximada, setUsarUbicacionAproximada] = useState(true);
  const [obteniendoGps, setObteniendoGps] = useState(false);
  const [errorUbicacion, setErrorUbicacion] = useState<string | null>(null);

  const [enviando, setEnviando] = useState(false);
  const [mensajeEditando, setMensajeEditando] = useState<MensajeChat | null>(
    null,
  );
  const [imagenAmpliada, setImagenAmpliada] = useState<string | null>(null);

  // Modal de perfil en solo lectura al dar clic en la cabecera del chat
  const [modalPerfilAbierto, setModalPerfilAbierto] = useState(false);
  const [cargandoPerfilChat, setCargandoPerfilChat] = useState(false);
  const [perfilesOferenteCache, setPerfilesOferenteCache] = useState<
    Record<string, PerfilOferente | null>
  >({});

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const finChatRef = useRef<HTMLDivElement | null>(null);

  const chatActivoId = searchParams.get("chat");

  const cargarConversaciones = useCallback(() => {
    if (!userId) return;
    setCargandoConvs(true);
    setErrorConvs(null);

    obtenerConversaciones(userId)
      .then(async (lista) => {
        const listaExt = lista as ConversacionExtendida[];
        setConversaciones(listaExt);
        const otrosIds = Array.from(
          new Set(
            listaExt
              .map((c) => c.participantes.find((p) => p !== userId))
              .filter(Boolean) as string[],
          ),
        );
        const perfiles = await Promise.all(
          otrosIds.map((id) => obtenerUsuarioPublico(id).catch(() => null)),
        );
        const mapa: Record<string, UsuarioPublico> = {};
        otrosIds.forEach((id, idx) => {
          if (perfiles[idx]) mapa[id] = perfiles[idx]!;
        });
        setUsuariosMap(mapa);

        if (!chatActivoId && listaExt.length > 0) {
          setSearchParams({ chat: listaExt[0].id }, { replace: true });
        }
      })
      .catch(() => {
        setErrorConvs(
          "No se pudieron cargar tus conversaciones. Verifica que el backend esté activo.",
        );
      })
      .finally(() => setCargandoConvs(false));
  }, [userId, chatActivoId, setSearchParams]);

  useEffect(() => {
    cargarConversaciones();
  }, [cargarConversaciones]);

  useEffect(() => {
    if (!chatActivoId || !userId) {
      setMensajes([]);
      return;
    }
    setCargandoMensajes(true);
    setMensajeEditando(null);
    obtenerMensajes(chatActivoId, userId)
      .then((lista) => {
        setMensajes(lista);
        window.dispatchEvent(new Event("bizcerca:chat-actualizado"));
      })
      .catch(() => {
        setErrorUbicacion("No se pudieron cargar los mensajes de este chat.");
      })
      .finally(() => setCargandoMensajes(false));
  }, [chatActivoId, userId]);

  useEffect(() => {
    finChatRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes.length, chatActivoId]);

  const conversacionesFiltradas = useMemo(() => {
    const q = busquedaChat.trim().toLowerCase();
    if (!q) return conversaciones;
    return conversaciones.filter((c) => {
      const otroId = c.participantes.find((p) => p !== userId) || "";
      const nombre = usuariosMap[otroId]?.nombre_publico?.toLowerCase() || "";
      const coincideInteres = (c.publicaciones_interes || []).some((item) =>
        item.titulo.toLowerCase().includes(q),
      );
      return (
        nombre.includes(q) ||
        c.ultimo_mensaje.toLowerCase().includes(q) ||
        (c.publicacion_titulo || "").toLowerCase().includes(q) ||
        coincideInteres
      );
    });
  }, [conversaciones, busquedaChat, usuariosMap, userId]);

  const gruposPorFecha = useMemo(() => {
    const grupos: { fechaEtiqueta: string; items: MensajeChat[] }[] = [];
    mensajes.forEach((msg) => {
      const etiqueta = etiquetaFechaChat(msg.fecha_envio);
      const ultimoGrupo = grupos[grupos.length - 1];
      if (ultimoGrupo && ultimoGrupo.fechaEtiqueta === etiqueta) {
        ultimoGrupo.items.push(msg);
      } else {
        grupos.push({ fechaEtiqueta: etiqueta, items: [msg] });
      }
    });
    return grupos;
  }, [mensajes]);

  if (!user) return null;

  const convActiva = conversaciones.find((c) => c.id === chatActivoId) || null;
  const otroUsuarioId =
    convActiva?.participantes.find((p) => p !== userId) || "";
  const otroUsuario = usuariosMap[otroUsuarioId];
  const perfilOferenteActivo = otroUsuarioId
    ? (perfilesOferenteCache[otroUsuarioId] ?? null)
    : null;

  // Lista de todas las secciones/ofertas por las que existe interés en esta conversación
  const seccionesInteres = useMemo(() => {
    if (!convActiva) return [];
    const acumuladas = convActiva.publicaciones_interes || [];
    if (acumuladas.length > 0) return acumuladas;
    if (convActiva.publicacion_titulo) {
      return [
        {
          id: convActiva.publicacion_id || "",
          titulo: convActiva.publicacion_titulo,
          precio: null,
        },
      ];
    }
    return [];
  }, [convActiva]);

  const handleAbrirPerfilChat = async () => {
    if (!otroUsuarioId) return;
    setModalPerfilAbierto(true);

    if (otroUsuarioId in perfilesOferenteCache) return;

    setCargandoPerfilChat(true);
    try {
      const perfil = await obtenerPerfilOferente(otroUsuarioId);
      setPerfilesOferenteCache((prev) => ({
        ...prev,
        [otroUsuarioId]: perfil,
      }));
    } catch {
      setPerfilesOferenteCache((prev) => ({
        ...prev,
        [otroUsuarioId]: null,
      }));
    } finally {
      setCargandoPerfilChat(false);
    }
  };

  const handleSeleccionarFoto = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    const comprimida = await comprimirImagen(file);
    setFotoAdjunta(comprimida);
  };

  const handleAdjuntarUbicacion = async () => {
    setErrorUbicacion(null);
    setObteniendoGps(true);
    try {
      const coords = await obtenerUbicacionGPS();
      const direccion = await obtenerDireccionAproximada(
        coords.lat,
        coords.lng,
      );
      setCoordsExactas(coords);
      setEtiquetaUbicacion(direccion);
      setUsarUbicacionAproximada(true);
    } catch (err: any) {
      setErrorUbicacion(err?.message || "No se pudo obtener la ubicación.");
    } finally {
      setObteniendoGps(false);
    }
  };

  const construirUbicacionEnviar = (): UbicacionChat | null => {
    if (!coordsExactas) return null;
    const coordsFinal = usarUbicacionAproximada
      ? aproximarCoordenadas(coordsExactas)
      : coordsExactas;
    return {
      lat: coordsFinal.lat,
      lng: coordsFinal.lng,
      etiqueta: etiquetaUbicacion || null,
      aproximada: usarUbicacionAproximada,
    };
  };

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatActivoId || !userId || enviando) return;

    if (mensajeEditando) {
      if (!textoInput.trim()) return;
      setEnviando(true);
      try {
        const actualizado = await editarMensaje(
          mensajeEditando.id,
          userId,
          textoInput.trim(),
        );
        setMensajes((prev) =>
          prev.map((m) => (m.id === actualizado.id ? actualizado : m)),
        );
        setMensajeEditando(null);
        setTextoInput("");
      } finally {
        setEnviando(false);
      }
      return;
    }

    const ubicacionEnviar = construirUbicacionEnviar();
    if (!textoInput.trim() && !fotoAdjunta && !ubicacionEnviar) return;

    setEnviando(true);
    try {
      const nuevo = await enviarMensaje(chatActivoId, {
        emisor_id: userId,
        contenido: textoInput.trim(),
        imagen_url: fotoAdjunta,
        ubicacion: ubicacionEnviar,
      });
      setMensajes((prev) => [...prev, nuevo]);
      setConversaciones((prev) =>
        prev.map((c) =>
          c.id === chatActivoId
            ? {
                ...c,
                ultimo_mensaje:
                  nuevo.contenido ||
                  (nuevo.ubicacion
                    ? "📍 Ubicación compartida"
                    : "📷 Fotografía"),
                ultima_actualizacion: nuevo.fecha_envio,
                tiene_solicitud_pendiente: false,
                peticiones_pendientes: 0,
              }
            : c,
        ),
      );
      setTextoInput("");
      setFotoAdjunta(null);
      setCoordsExactas(null);
      setEtiquetaUbicacion("");
    } finally {
      setEnviando(false);
    }
  };

  const handleIniciarEdicion = (msg: MensajeChat) => {
    setMensajeEditando(msg);
    setFotoAdjunta(null);
    setCoordsExactas(null);
    setTextoInput(msg.contenido);
  };

  const handleBorrarMensaje = async (msg: MensajeChat) => {
    const borrado = await borrarMensaje(msg.id, userId);
    setMensajes((prev) => prev.map((m) => (m.id === borrado.id ? borrado : m)));
  };

  const puedeEnviar = Boolean(
    textoInput.trim() || fotoAdjunta || coordsExactas,
  );

  return (
    <div className="max-w-6xl mx-auto pb-8 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-black">Conversaciones</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Chatea con oferentes y contratistas de BizCerca.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden h-[74vh] min-h-[520px]">
        {/* Lista lateral de chats */}
        <aside className="lg:col-span-4 border-r border-slate-200 flex flex-col bg-white">
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={busquedaChat}
                onChange={(e) => setBusquedaChat(e.target.value)}
                placeholder="Buscar conversación..."
                className="pl-9 h-9 bg-slate-50 border-slate-200 text-xs text-slate-900"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {cargandoConvs ? (
              <p className="text-xs text-slate-400 text-center py-8">
                Cargando chats...
              </p>
            ) : errorConvs ? (
              <div className="text-center py-10 px-4 space-y-2.5">
                <p className="text-xs font-medium text-rose-600">
                  {errorConvs}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={cargarConversaciones}
                  className="h-8 text-xs border-slate-300 text-slate-700 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Reintentar
                </Button>
              </div>
            ) : conversacionesFiltradas.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageCircle className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-600">
                  No hay conversaciones aún
                </p>
              </div>
            ) : (
              conversacionesFiltradas.map((conv) => {
                const otroId =
                  conv.participantes.find((p) => p !== userId) || "";
                const perfil = usuariosMap[otroId];
                const activa = conv.id === chatActivoId;
                const totalSecciones =
                  conv.publicaciones_interes?.length ||
                  (conv.publicacion_titulo ? 1 : 0);

                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => setSearchParams({ chat: conv.id })}
                    className={`w-full text-left p-3.5 flex items-center gap-3 transition-colors cursor-pointer ${
                      activa
                        ? "bg-indigo-50/80 border-l-4 border-l-indigo-600"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <Avatar className="h-11 w-11 border border-slate-200 shrink-0">
                      <AvatarImage
                        src={perfil?.foto_perfil || undefined}
                        alt={perfil?.nombre_publico || "Usuario"}
                      />
                      <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-bold">
                        {obtenerIniciales(perfil?.nombre_publico)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {perfil?.nombre_publico || "Usuario"}
                        </p>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {formatearHora(conv.ultima_actualizacion)}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {conv.ultimo_mensaje || "Sin mensajes aún"}
                      </p>

                      {(conv.tiene_solicitud_pendiente ||
                        totalSecciones > 1) && (
                        <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                          {conv.tiene_solicitud_pendiente && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                              Nueva solicitud pendiente
                              {conv.peticiones_pendientes &&
                              conv.peticiones_pendientes > 1
                                ? ` (${conv.peticiones_pendientes})`
                                : ""}
                            </span>
                          )}
                          {totalSecciones > 1 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-100/80 text-indigo-700">
                              <Tag className="w-2.5 h-2.5" />
                              {totalSecciones} ofertas de interés
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Panel derecho de mensajes */}
        <section className="lg:col-span-8 flex flex-col bg-slate-50/70 h-full overflow-hidden">
          {!convActiva ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
              <MessageCircle className="w-10 h-10 text-indigo-200 mb-2" />
              <p className="text-sm font-semibold text-slate-700">
                Selecciona una conversación
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Elige un chat de la izquierda o responde una notificación.
              </p>
            </div>
          ) : (
            <>
              {/* Cabecera superior clicable para abrir info del perfil */}
              <header className="px-4 py-3 bg-white border-b border-slate-200 space-y-2 shrink-0">
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleAbrirPerfilChat}
                    title="Ver información del perfil"
                    className="flex items-center gap-3 min-w-0 text-left rounded-xl p-1 -m-1 hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <Avatar className="h-10 w-10 border border-slate-200 shrink-0 group-hover:ring-2 group-hover:ring-indigo-100 transition-all">
                      <AvatarImage
                        src={otroUsuario?.foto_perfil || undefined}
                        alt={otroUsuario?.nombre_publico || "Usuario"}
                      />
                      <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-bold">
                        {obtenerIniciales(otroUsuario?.nombre_publico)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-700 transition-colors">
                          {otroUsuario?.nombre_publico || "Usuario"}
                        </h2>

                        {otroUsuario?.correo_verificado ? (
                          <Badge
                            variant="secondary"
                            className="bg-emerald-50 text-emerald-700 text-[11px] font-semibold gap-1"
                          >
                            <BadgeCheck className="w-3.5 h-3.5" />
                            Verificado
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-amber-50 text-amber-700 text-[11px] font-semibold gap-1"
                          >
                            <Clock className="w-3 h-3" />
                            Por verificar
                          </Badge>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 truncate">
                        {seccionesInteres.length === 1
                          ? `Ref: ${seccionesInteres[0].titulo} • `
                          : seccionesInteres.length > 1
                            ? `Interés en ${seccionesInteres.length} publicaciones • `
                            : ""}
                        <span className="text-indigo-600/80 group-hover:underline">
                          Ver perfil
                        </span>
                      </p>
                    </div>
                  </button>
                </div>

                {/* Franja con todas las secciones/ofertas por las que hay interés */}
                {seccionesInteres.length > 1 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-100">
                    <span className="text-[10px] font-semibold text-slate-500 mr-1">
                      Secciones de interés:
                    </span>
                    {seccionesInteres.map((sec, idx) => (
                      <span
                        key={`${sec.id || sec.titulo}-${idx}`}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200/80 text-[11px] font-medium text-indigo-800"
                      >
                        <Tag className="w-3 h-3 text-indigo-600 shrink-0" />
                        <span>{sec.titulo}</span>
                        {typeof sec.precio === "number" && sec.precio > 0 && (
                          <span className="text-indigo-600 font-semibold">
                            (${sec.precio.toLocaleString("es-MX")})
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </header>

              {/* Área de mensajes agrupada por fechas */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {cargandoMensajes ? (
                  <p className="text-xs text-slate-400 text-center py-8">
                    Cargando mensajes...
                  </p>
                ) : (
                  gruposPorFecha.map((grupo) => (
                    <div key={grupo.fechaEtiqueta} className="space-y-2.5">
                      <div className="sticky top-0 z-10 flex justify-center">
                        <Badge
                          variant="outline"
                          className="bg-white/95 border-slate-200 text-[11px] font-semibold text-slate-600 shadow-xs"
                        >
                          {grupo.fechaEtiqueta}
                        </Badge>
                      </div>

                      {grupo.items.map((msg) => {
                        const esMio = msg.emisor_id === userId;
                        const { esReactivacion, tituloInteres, cuerpoMensaje } =
                          extraerTarjetaInteres(msg.contenido);

                        return (
                          <div
                            key={msg.id}
                            className={`flex ${
                              esMio ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`group relative max-w-[78%] sm:max-w-[68%] rounded-2xl px-3.5 py-2 shadow-xs ${
                                esMio
                                  ? "bg-indigo-600 text-white rounded-br-xs"
                                  : "bg-[#F5EFE6] border border-[#E6DCCB] text-slate-900 rounded-bl-xs"
                              }`}
                            >
                              {esMio && !msg.eliminado && (
                                <div className="absolute top-1 right-1.5">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button
                                        type="button"
                                        className="p-0.5 rounded bg-indigo-700/75 hover:bg-indigo-800 text-white/90 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer"
                                        title="Opciones del mensaje"
                                      >
                                        <ChevronDown className="w-3.5 h-3.5" />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                      align="end"
                                      className="w-32 bg-white text-slate-800"
                                    >
                                      {msg.contenido && (
                                        <DropdownMenuItem
                                          onClick={() =>
                                            handleIniciarEdicion(msg)
                                          }
                                          className="text-xs gap-2 cursor-pointer"
                                        >
                                          <Pencil className="w-3.5 h-3.5 text-indigo-600" />
                                          Editar
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuItem
                                        onClick={() => handleBorrarMensaje(msg)}
                                        className="text-xs text-rose-600 focus:text-rose-600 gap-2 cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Borrar
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              )}

                              {msg.eliminado ? (
                                <p
                                  className={`text-xs italic pr-2 ${
                                    esMio ? "text-indigo-200" : "text-slate-500"
                                  }`}
                                >
                                  Este mensaje fue eliminado
                                </p>
                              ) : (
                                <div className="space-y-1.5">
                                  {esReactivacion && (
                                    <div
                                      className={`text-[10px] font-semibold uppercase tracking-wide ${
                                        esMio
                                          ? "text-indigo-200"
                                          : "text-amber-700"
                                      }`}
                                    >
                                      🔄 Reactivación de contacto
                                    </div>
                                  )}

                                  {tituloInteres && (
                                    <div
                                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold ${
                                        esMio
                                          ? "bg-indigo-700/70 border-indigo-400/40 text-white"
                                          : "bg-white/90 border-[#DFD3C0] text-indigo-900"
                                      }`}
                                    >
                                      <Tag className="w-3.5 h-3.5 shrink-0" />
                                      <span>
                                        Interesado en: {tituloInteres}
                                      </span>
                                    </div>
                                  )}

                                  {msg.imagen_url && (
                                    <img
                                      src={msg.imagen_url}
                                      alt="Adjunto"
                                      onClick={() =>
                                        setImagenAmpliada(msg.imagen_url!)
                                      }
                                      title="Clic para agrandar"
                                      className="rounded-lg max-h-56 w-auto object-cover border border-black/10 cursor-zoom-in hover:opacity-95 transition-opacity"
                                    />
                                  )}

                                  {msg.ubicacion && (
                                    <a
                                      href={`https://www.openstreetmap.org/?mlat=${msg.ubicacion.lat}&mlon=${msg.ubicacion.lng}#map=16/${msg.ubicacion.lat}/${msg.ubicacion.lng}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`block p-2.5 rounded-xl border text-xs transition-colors ${
                                        esMio
                                          ? "bg-indigo-700/60 border-indigo-400/40 text-white hover:bg-indigo-700"
                                          : "bg-white/80 border-[#DFD3C0] text-slate-800 hover:bg-white"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-2 font-semibold">
                                        <span className="inline-flex items-center gap-1">
                                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                                          {msg.ubicacion.aproximada
                                            ? "Ubicación aproximada"
                                            : "Ubicación exacta"}
                                        </span>
                                        <ExternalLink className="w-3 h-3 opacity-75 shrink-0" />
                                      </div>
                                      {msg.ubicacion.etiqueta && (
                                        <p className="text-[11px] opacity-90 mt-1 line-clamp-2">
                                          {msg.ubicacion.etiqueta}
                                        </p>
                                      )}
                                    </a>
                                  )}

                                  {cuerpoMensaje && (
                                    <p className="text-xs sm:text-[13px] whitespace-pre-line leading-relaxed pr-4">
                                      {cuerpoMensaje}
                                    </p>
                                  )}
                                </div>
                              )}

                              <div
                                className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                                  esMio ? "text-indigo-200" : "text-slate-500"
                                }`}
                              >
                                {msg.editado && !msg.eliminado && (
                                  <span>(editado)</span>
                                )}
                                <span>{formatearHora(msg.fecha_envio)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
                <div ref={finChatRef} />
              </div>

              {errorUbicacion && (
                <div className="px-4 py-1.5 bg-rose-50 border-t border-rose-200 text-rose-700 text-[11px] flex items-center justify-between">
                  <span>{errorUbicacion}</span>
                  <button
                    type="button"
                    onClick={() => setErrorUbicacion(null)}
                    className="p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Vista previa de edición, foto o ubicación antes de enviar */}
              {(mensajeEditando || fotoAdjunta || coordsExactas) && (
                <div className="px-4 py-2 bg-indigo-50 border-t border-indigo-100 flex items-center justify-between gap-3">
                  {mensajeEditando ? (
                    <div className="text-xs text-indigo-800 truncate">
                      <span className="font-semibold">Editando mensaje: </span>
                      {mensajeEditando.contenido}
                    </div>
                  ) : fotoAdjunta ? (
                    <div className="flex items-center gap-2">
                      <img
                        src={fotoAdjunta}
                        alt="Vista previa"
                        className="w-12 h-12 rounded object-cover border border-indigo-200"
                      />
                      <span className="text-xs font-medium text-indigo-800">
                        Imagen lista para enviar
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2 text-xs text-indigo-900 min-w-0">
                      <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="truncate font-medium">
                        {etiquetaUbicacion}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setUsarUbicacionAproximada((prev) => !prev)
                        }
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-indigo-200 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100 cursor-pointer shrink-0"
                      >
                        <ShieldCheck className="w-3 h-3" />
                        {usarUbicacionAproximada
                          ? "Aproximada (~300m, segura)"
                          : "Exacta"}
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setMensajeEditando(null);
                      setFotoAdjunta(null);
                      setCoordsExactas(null);
                      setEtiquetaUbicacion("");
                      setTextoInput("");
                    }}
                    className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Barra inferior: "+" fotos, ubicación GPS, recuadro y enviar */}
              <form
                onSubmit={handleEnviar}
                className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleSeleccionarFoto}
                  className="hidden"
                />

                {!mensajeEditando && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      title="Adjuntar fotografía"
                      className="h-9 w-9 rounded-full border-slate-300 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 shrink-0 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={obteniendoGps}
                      onClick={handleAdjuntarUbicacion}
                      title="Compartir ubicación"
                      className="h-9 w-9 rounded-full border-slate-300 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 shrink-0 cursor-pointer"
                    >
                      <MapPin className="w-4 h-4" />
                    </Button>
                  </>
                )}

                <Input
                  value={textoInput}
                  onChange={(e) => setTextoInput(e.target.value)}
                  placeholder={
                    mensajeEditando
                      ? "Edita tu mensaje..."
                      : "Escribe un mensaje..."
                  }
                  className="h-9 bg-slate-50 border-slate-200 text-xs text-slate-900"
                />

                <Button
                  type="submit"
                  size="icon"
                  disabled={enviando || !puedeEnviar}
                  title="Enviar"
                  className="h-9 w-9 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 cursor-pointer"
                >
                  <SendHorizontal className="w-4 h-4" />
                </Button>
              </form>
            </>
          )}
        </section>
      </div>

      {/* Modal de perfil en solo lectura */}
      <Dialog
        open={modalPerfilAbierto}
        onOpenChange={(open) => !open && setModalPerfilAbierto(false)}
      >
        <DialogContent className="bg-white text-slate-900 sm:max-w-lg">
          <DialogHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3 pr-6">
              <Avatar className="h-12 w-12 border border-slate-200 shrink-0">
                <AvatarImage
                  src={otroUsuario?.foto_perfil || undefined}
                  alt={otroUsuario?.nombre_publico || "Usuario"}
                />
                <AvatarFallback className="bg-indigo-100 text-indigo-700 text-sm font-bold">
                  {obtenerIniciales(otroUsuario?.nombre_publico)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <DialogTitle className="text-base font-bold text-slate-900 truncate">
                    {otroUsuario?.nombre_publico || "Usuario"}
                  </DialogTitle>

                  {otroUsuario?.correo_verificado ? (
                    <Badge
                      variant="secondary"
                      className="bg-emerald-50 text-emerald-700 text-[11px] font-semibold gap-1"
                    >
                      <BadgeCheck className="w-3.5 h-3.5" />
                      Verificado
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="bg-amber-50 text-amber-700 text-[11px] font-semibold gap-1"
                    >
                      <Clock className="w-3 h-3" />
                      Por verificar
                    </Badge>
                  )}
                </div>
                <DialogDescription className="sr-only">
                  Información del perfil
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {cargandoPerfilChat ? (
            <div className="py-10 flex items-center justify-center gap-2 text-xs text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              Cargando información del perfil...
            </div>
          ) : !perfilOferenteActivo ? (
            <div className="py-6 px-4 text-center rounded-xl bg-slate-50 border border-slate-200/80">
              <p className="text-xs font-semibold text-slate-800">
                Contratista
              </p>
            </div>
          ) : (
            <div className="space-y-3.5 pt-1 text-xs">
              {/* Descripción del perfil */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                  <AlignLeft className="w-3.5 h-3.5 text-indigo-600" />
                  Descripción del perfil
                </p>
                <p className="text-slate-800 whitespace-pre-line leading-relaxed">
                  {perfilOferenteActivo.descripcion?.trim() ||
                    "Sin descripción registrada."}
                </p>
              </div>

              {/* Lo que ofrece y Modalidad */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-indigo-600" />
                    Lo que ofrece
                  </p>
                  <p className="font-semibold text-slate-900">
                    {formatearLoQueOfrece(
                      perfilOferenteActivo.productos_servicios,
                    )}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-indigo-600" />
                    Modalidad de atención
                  </p>
                  <p className="font-semibold text-slate-900">
                    {formatearModalidad(
                      perfilOferenteActivo.modalidad_atencion,
                    )}
                  </p>
                </div>
              </div>

              {/* Horarios de atención */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  Horarios de atención
                </p>
                <p className="text-slate-800 whitespace-pre-line">
                  {perfilOferenteActivo.horarios?.trim() ||
                    "Horarios no especificados."}
                </p>
              </div>

              {/* Redes sociales */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-indigo-600" />
                  Redes sociales
                </p>

                {perfilOferenteActivo.redes_sociales &&
                perfilOferenteActivo.redes_sociales.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {perfilOferenteActivo.redes_sociales.map((red, idx) => (
                      <a
                        key={`${red.url}-${idx}`}
                        href={red.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-indigo-50 hover:border-indigo-200 text-xs font-medium text-slate-700 hover:text-indigo-700 transition-colors capitalize"
                      >
                        <span>{red.tipo || "Enlace"}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500">
                    Sin redes sociales registradas.
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal shadcn/ui para agrandar imágenes del chat */}
      <Dialog
        open={Boolean(imagenAmpliada)}
        onOpenChange={(open) => !open && setImagenAmpliada(null)}
      >
        <DialogContent className="bg-white text-slate-900 sm:max-w-3xl p-3">
          <DialogHeader className="px-2 pt-1">
            <DialogTitle className="text-sm font-bold text-slate-900">
              Vista previa de imagen
            </DialogTitle>
          </DialogHeader>
          {imagenAmpliada && (
            <div className="flex items-center justify-center bg-slate-950/5 rounded-lg overflow-hidden max-h-[78vh]">
              <img
                src={imagenAmpliada}
                alt="Imagen ampliada"
                className="max-h-[76vh] w-auto object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
