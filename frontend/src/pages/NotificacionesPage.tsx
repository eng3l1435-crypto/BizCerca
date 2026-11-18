import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Briefcase,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Store,
  Trash2,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  obtenerUsuarioPublico,
  type UsuarioPublico,
} from "../services/authService";
import { obtenerContactosRecibidos } from "../services/interaccionService";
import {
  eliminarNotificacion,
  iniciarConversacion,
  marcarNotificacionLeida,
  marcarNotificacionRespondida,
  marcarTodasNotificacionesLeidas,
  obtenerConversaciones,
  obtenerNotificaciones,
  type NotificacionItem,
} from "../services/chatService";
import { obtenerIniciales } from "../utils/imagenUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type PerfilRemitente = UsuarioPublico & {
  tipo_cuenta?: "consumidor" | "oferente";
};

const POR_PAGINA_6X2 = 12; // 6 filas x 2 columnas

function limpiarMensajeNotificacion(contenido: string): string {
  const match = contenido.match(
    /te envió una petición de contacto:\s*"([\s\S]*)"$/i,
  );
  return match?.[1] ? match[1] : contenido;
}

function extraerNombreFallback(
  notif: NotificacionItem,
  emisor?: PerfilRemitente,
): string {
  if (emisor?.nombre_publico) return emisor.nombre_publico;
  const match = notif.contenido.match(
    /^([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?)\s+(?:respondió|te envió|quiere)/i,
  );
  return match?.[1] || "Usuario";
}

export default function NotificacionesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = user?.id || (user as any)?._id;

  const [notificaciones, setNotificaciones] = useState<NotificacionItem[]>([]);
  const [usuariosMap, setUsuariosMap] = useState<
    Record<string, PerfilRemitente>
  >({});
  const [chatsExistentesIds, setChatsExistentesIds] = useState<Set<string>>(
    new Set(),
  );
  const [seleccionadaId, setSeleccionadaId] = useState<string | null>(null);

  // Modo selección para borrado lógico
  const [modoSeleccion, setModoSeleccion] = useState(false);
  const [marcadasBorrar, setMarcadasBorrar] = useState<Set<string>>(new Set());

  const [cargando, setCargando] = useState(true);
  const [abriendoChatId, setAbriendoChatId] = useState<string | null>(null);
  const [procesandoMasivo, setProcesandoMasivo] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);

  useEffect(() => {
    if (!userId) return;
    setCargando(true);

    Promise.all([
      obtenerNotificaciones(userId),
      obtenerContactosRecibidos(userId).catch(() => []),
      obtenerConversaciones(userId).catch(() => []),
    ])
      .then(async ([lista, recibidos, conversaciones]) => {
        const otrosConChat = new Set<string>();
        conversaciones.forEach((c) => {
          const otro = c.participantes.find((p) => p !== userId);
          if (otro) otrosConChat.add(otro);
        });
        setChatsExistentesIds(otrosConChat);

        const enriquecidas = lista.map((notif) => {
          if (notif.emisor_id) return notif;
          const esSolicitud = /te envió una petición de contacto/i.test(
            notif.contenido,
          );
          if (!esSolicitud) return notif;

          const msgLimpio = limpiarMensajeNotificacion(notif.contenido);
          const matchContacto = recibidos.find((c) =>
            c.mensaje_inicial.startsWith(msgLimpio),
          );
          if (!matchContacto) return notif;

          return {
            ...notif,
            tipo: "solicitud_contacto" as const,
            emisor_id: matchContacto.emisor_id,
            publicacion_id: matchContacto.publicacion_id,
          };
        });

        setNotificaciones(enriquecidas);

        const emisoresUnicos = Array.from(
          new Set(
            enriquecidas.map((n) => n.emisor_id).filter(Boolean) as string[],
          ),
        );
        const perfiles = await Promise.all(
          emisoresUnicos.map((id) =>
            obtenerUsuarioPublico(id).catch(() => null),
          ),
        );
        const mapa: Record<string, PerfilRemitente> = {};
        emisoresUnicos.forEach((id, idx) => {
          if (perfiles[idx]) mapa[id] = perfiles[idx] as PerfilRemitente;
        });
        setUsuariosMap(mapa);
      })
      .finally(() => setCargando(false));
  }, [userId]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(notificaciones.length / POR_PAGINA_6X2),
  );

  useEffect(() => {
    if (paginaActual > totalPaginas) {
      setPaginaActual(totalPaginas);
    }
  }, [paginaActual, totalPaginas]);

  const notificacionesPaginadas = useMemo(() => {
    const inicio = (paginaActual - 1) * POR_PAGINA_6X2;
    return notificaciones.slice(inicio, inicio + POR_PAGINA_6X2);
  }, [notificaciones, paginaActual]);

  if (!user) return null;

  const totalNoLeidas = notificaciones.filter((n) => !n.leido).length;
  const totalMarcadas = marcadasBorrar.size;

  const notificarCambioNavbar = () => {
    window.dispatchEvent(new Event("bizcerca:notificaciones-actualizadas"));
  };

  const handleActivarModoBorrar = () => {
    setModoSeleccion(true);
    setMarcadasBorrar(new Set());
  };

  const handleCancelarModoBorrar = () => {
    setModoSeleccion(false);
    setMarcadasBorrar(new Set());
  };

  const handleToggleCheck = (notifId: string) => {
    setMarcadasBorrar((prev) => {
      const siguiente = new Set(prev);
      if (siguiente.has(notifId)) {
        siguiente.delete(notifId);
      } else {
        siguiente.add(notifId);
      }
      return siguiente;
    });
  };

  const handleCardClick = (notif: NotificacionItem) => {
    if (modoSeleccion) {
      handleToggleCheck(notif.id);
      return;
    }

    setSeleccionadaId((prev) => (prev === notif.id ? null : notif.id));
    if (!notif.leido) {
      setNotificaciones((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, leido: true } : n)),
      );
      marcarNotificacionLeida(notif.id)
        .then(notificarCambioNavbar)
        .catch(() => {});
    }
  };

  const handleMarcarTodasLeidas = async () => {
    if (!userId || totalNoLeidas === 0 || procesandoMasivo) return;
    setProcesandoMasivo(true);
    try {
      await marcarTodasNotificacionesLeidas(userId);
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leido: true })));
      notificarCambioNavbar();
    } finally {
      setProcesandoMasivo(false);
    }
  };

  const handleBorrarSeleccionadas = async () => {
    if (totalMarcadas === 0 || procesandoMasivo) return;
    setProcesandoMasivo(true);
    const idsAEliminar = Array.from(marcadasBorrar);
    try {
      await Promise.all(idsAEliminar.map((id) => eliminarNotificacion(id)));
      const eliminadosSet = new Set(idsAEliminar);
      setNotificaciones((prev) => prev.filter((n) => !eliminadosSet.has(n.id)));
      setMarcadasBorrar(new Set());
      setModoSeleccion(false);
      if (seleccionadaId && eliminadosSet.has(seleccionadaId)) {
        setSeleccionadaId(null);
      }
      notificarCambioNavbar();
    } finally {
      setProcesandoMasivo(false);
    }
  };

  const handleResponder = async (
    notif: NotificacionItem,
    yaRespondida: boolean,
  ) => {
    if (!notif.emisor_id || !userId) return;
    setAbriendoChatId(notif.id);
    try {
      if (!yaRespondida) {
        await marcarNotificacionRespondida(notif.id).catch(() => {});
        setNotificaciones((prev) =>
          prev.map((n) =>
            n.id === notif.id ? { ...n, leido: true, respondido: true } : n,
          ),
        );
        notificarCambioNavbar();
      } else if (!notif.leido) {
        await marcarNotificacionLeida(notif.id).catch(() => {});
        notificarCambioNavbar();
      }

      const conv = await iniciarConversacion({
        usuario_actual_id: userId,
        otro_usuario_id: notif.emisor_id,
        publicacion_id: notif.publicacion_id,
        publicacion_titulo: notif.publicacion_titulo,
        mensaje_inicial: limpiarMensajeNotificacion(notif.contenido),
        emisor_mensaje_inicial_id: notif.emisor_id,
      });
      navigate(`/conversaciones?chat=${conv.id}`);
    } finally {
      setAbriendoChatId(null);
    }
  };

  const inicioRango =
    notificaciones.length === 0 ? 0 : (paginaActual - 1) * POR_PAGINA_6X2 + 1;
  const finRango = Math.min(
    paginaActual * POR_PAGINA_6X2,
    notificaciones.length,
  );

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-10">
      {/* Encabezado y controles superiores */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-black">Notificaciones</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Revisa las solicitudes de contacto y responde directamente en
            conversaciones.
          </p>
        </div>

        {notificaciones.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {!modoSeleccion ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={totalNoLeidas === 0 || procesandoMasivo}
                  onClick={handleMarcarTodasLeidas}
                  className="h-8 px-3 text-xs font-semibold border-slate-300 bg-white text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
                  Marcar como leídas
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={procesandoMasivo}
                  onClick={handleActivarModoBorrar}
                  className="h-8 px-3 text-xs font-semibold border-rose-200 bg-white text-rose-600 hover:bg-rose-50 hover:border-rose-300 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Borrar notificaciones
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={procesandoMasivo}
                  onClick={handleCancelarModoBorrar}
                  className="h-8 px-3 text-xs font-semibold border-slate-300 bg-white text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5 mr-1.5" />
                  Cancelar
                </Button>

                <Button
                  type="button"
                  size="sm"
                  disabled={totalMarcadas === 0 || procesandoMasivo}
                  onClick={handleBorrarSeleccionadas}
                  className="h-8 px-3 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  {procesandoMasivo
                    ? "Borrando..."
                    : `Borrar seleccionadas (${totalMarcadas})`}
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {cargando ? (
        <p className="text-xs text-slate-400 py-10 text-center">
          Cargando notificaciones...
        </p>
      ) : notificaciones.length === 0 ? (
        <div className="text-center py-14 px-4 rounded-xl bg-white border border-dashed border-slate-300">
          <Bell className="w-7 h-7 text-indigo-600 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-900">
            No tienes notificaciones
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Cuando alguien se interese en una de tus publicaciones aparecerá
            aquí.
          </p>
        </div>
      ) : (
        <>
          {/* Cuadrícula 6x2 (2 columnas x 6 filas = 12 por página) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-start">
            {notificacionesPaginadas.map((notif) => {
              const emisor = notif.emisor_id
                ? usuariosMap[notif.emisor_id]
                : undefined;
              const nombreMostrar = extraerNombreFallback(notif, emisor);
              const abierta = !modoSeleccion && seleccionadaId === notif.id;
              const marcada = modoSeleccion && marcadasBorrar.has(notif.id);
              const rolPrincipal =
                emisor?.tipo_cuenta === "oferente" ? "Oferente" : "Contratista";

              const esRespuesta =
                notif.tipo === "contacto_respondido" ||
                /respondió a tu petición/i.test(notif.contenido);

              const esSolicitudRecibida =
                Boolean(notif.emisor_id) && !esRespuesta;

              const yaRespondida = Boolean(
                notif.respondido ||
                (notif.emisor_id && chatsExistentesIds.has(notif.emisor_id)),
              );

              const textoMensaje = limpiarMensajeNotificacion(notif.contenido);

              return (
                <Card
                  key={notif.id}
                  onClick={() => handleCardClick(notif)}
                  className={`py-0 gap-0 transition-all cursor-pointer ${
                    marcada
                      ? "bg-rose-50/35 border-rose-300 ring-1 ring-rose-200"
                      : !notif.leido
                        ? "bg-indigo-50/35 border-indigo-200 shadow-sm"
                        : "bg-white border-slate-200 hover:border-indigo-200"
                  }`}
                >
                  <CardContent className="p-4 space-y-3">
                    {/* Cabecera: Check (solo en modo selección) + Avatar + Nombre + Rol + Botones */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-3 min-w-0">
                        {modoSeleccion && (
                          <label
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center justify-center shrink-0 cursor-pointer"
                            aria-label={`Seleccionar notificación de ${nombreMostrar}`}
                          >
                            <input
                              type="checkbox"
                              checked={marcada}
                              onChange={() => handleToggleCheck(notif.id)}
                              className="h-4 w-4 rounded border-slate-300 accent-rose-600 cursor-pointer"
                            />
                          </label>
                        )}

                        <Avatar className="h-10 w-10 border border-slate-200 shrink-0">
                          <AvatarImage
                            src={emisor?.foto_perfil || undefined}
                            alt={nombreMostrar}
                          />
                          <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-bold">
                            {obtenerIniciales(nombreMostrar)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-sm font-bold text-slate-900 truncate">
                              {nombreMostrar}
                            </p>
                            {emisor && (
                              <Badge
                                variant="secondary"
                                className="bg-indigo-50 text-indigo-700 text-[11px] font-semibold gap-1"
                              >
                                {rolPrincipal === "Oferente" ? (
                                  <Store className="w-3 h-3" />
                                ) : (
                                  <Briefcase className="w-3 h-3" />
                                )}
                                {rolPrincipal}
                              </Badge>
                            )}
                          </div>

                          {notif.publicacion_titulo && (
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              Publicación:{" "}
                              <span className="font-semibold text-slate-700">
                                {notif.publicacion_titulo}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {esSolicitudRecibida && !modoSeleccion && (
                          <Button
                            type="button"
                            size="sm"
                            disabled={abriendoChatId === notif.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResponder(notif, yaRespondida);
                            }}
                            className={`h-7 px-3 text-xs font-semibold cursor-pointer ${
                              yaRespondida
                                ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-none"
                                : "bg-indigo-600 hover:bg-indigo-700 text-white"
                            }`}
                          >
                            {abriendoChatId === notif.id ? (
                              "Abriendo..."
                            ) : yaRespondida ? (
                              <>
                                <Check className="w-3.5 h-3.5 mr-1" />
                                Respondido
                              </>
                            ) : (
                              "Responder"
                            )}
                          </Button>
                        )}

                        <Badge
                          variant={notif.leido ? "secondary" : "default"}
                          className={`text-[11px] ${
                            notif.leido
                              ? "bg-slate-100 text-slate-600"
                              : "bg-indigo-600 text-white"
                          }`}
                        >
                          {notif.leido ? "Leída" : "No leída"}
                        </Badge>
                      </div>
                    </div>

                    {/* Vista previa vs detalle expandido */}
                    {!abierta ? (
                      <p
                        className={`text-xs text-slate-600 truncate ${
                          modoSeleccion ? "pl-7" : ""
                        }`}
                      >
                        {textoMensaje}
                      </p>
                    ) : (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="pt-2.5 border-t border-slate-100"
                      >
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                          <p className="text-[11px] font-semibold text-slate-500 mb-1">
                            Mensaje:
                          </p>
                          <p className="text-xs text-slate-800 whitespace-pre-line leading-relaxed">
                            {textoMensaje}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Paginación 6x2 */}
          {totalPaginas > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-200">
              <p className="text-xs text-slate-500">
                Mostrando{" "}
                <span className="font-semibold text-slate-800">
                  {inicioRango}–{finRango}
                </span>{" "}
                de{" "}
                <span className="font-semibold text-slate-800">
                  {notificaciones.length}
                </span>{" "}
                notificaciones
              </p>

              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={paginaActual === 1}
                  onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                  className="h-8 px-2.5 text-xs border-slate-300 text-slate-700 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                  Anterior
                </Button>

                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(
                  (num) => (
                    <Button
                      key={num}
                      type="button"
                      variant={num === paginaActual ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPaginaActual(num)}
                      className={`h-8 w-8 p-0 text-xs font-semibold cursor-pointer ${
                        num === paginaActual
                          ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                          : "border-slate-300 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {num}
                    </Button>
                  ),
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={paginaActual === totalPaginas}
                  onClick={() =>
                    setPaginaActual((p) => Math.min(totalPaginas, p + 1))
                  }
                  className="h-8 px-2.5 text-xs border-slate-300 text-slate-700 cursor-pointer"
                >
                  Siguiente
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
