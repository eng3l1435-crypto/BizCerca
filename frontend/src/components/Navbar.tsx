import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  Compass,
  FolderKanban,
  LogOut,
  Menu,
  MessageCircle,
  Plus,
  User,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { obtenerNotificacionesNoLeidas } from "../services/interaccionService";
import { obtenerMensajesNoLeidos } from "../services/chatService";
import logoBizCerca from "../assets/BizCerca.png";

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [menuAbierto, setMenuAbierto] = useState(false);
  const [noLeidas, setNoLeidas] = useState(0);
  const [mensajesNoLeidos, setMensajesNoLeidos] = useState(0);

  const userId = user?.id || (user as any)?._id;

  const actualizarContadores = useCallback(() => {
    if (!userId) return;
    obtenerNotificacionesNoLeidas(userId)
      .then((lista) => setNoLeidas(lista.length))
      .catch(() => {});
    obtenerMensajesNoLeidos(userId)
      .then((total) => setMensajesNoLeidos(total))
      .catch(() => {});
  }, [userId]);

  useEffect(() => {
    actualizarContadores();
    const interval = window.setInterval(actualizarContadores, 15000);
    window.addEventListener("bizcerca:chat-actualizado", actualizarContadores);
    window.addEventListener(
      "bizcerca:notificaciones-actualizadas",
      actualizarContadores,
    );
    return () => {
      window.clearInterval(interval);
      window.removeEventListener(
        "bizcerca:chat-actualizado",
        actualizarContadores,
      );
      window.removeEventListener(
        "bizcerca:notificaciones-actualizadas",
        actualizarContadores,
      );
    };
  }, [actualizarContadores, location.pathname]);

  if (!user) return null;

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    setMenuAbierto(false);
    logout();
    navigate("/login");
  };

  const navItems = [
    {
      label: "Explorar",
      path: "/explorar",
      icon: Compass,
    },
    {
      label: "Mis publicaciones",
      path: "/mis-publicaciones",
      icon: FolderKanban,
    },
  ];

  const iniciales = `${(user.nombres || "U")[0]}${
    (user.apellido_paterno || "")[0] || ""
  }`.toUpperCase();

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo + Navegación principal */}
        <div className="flex items-center gap-6">
          <Link to="/explorar" className="flex items-center shrink-0">
            <img
              src={logoBizCerca}
              alt="BizCerca"
              className="h-8 w-auto object-contain"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ label, path, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  isActive(path)
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Acciones rápidas derecha: Conversaciones, Publicar, Notificaciones, Mi Perfil */}
        <div className="hidden md:flex items-center gap-2">
          <button
            type="button"
            aria-label="Conversaciones"
            onClick={() => navigate("/conversaciones")}
            className={`relative group flex items-center h-9 px-2.5 rounded-lg border transition-all duration-300 cursor-pointer ${
              isActive("/conversaciones")
                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                : "border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50/70"
            }`}
          >
            <MessageCircle className="w-4 h-4 shrink-0 transition-transform duration-300 group-hover:scale-105" />
            {mensajesNoLeidos > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                {mensajesNoLeidos > 9 ? "9+" : mensajesNoLeidos}
              </span>
            )}
            <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover:max-w-[115px] group-hover:opacity-100 group-hover:ml-1.5 transition-all duration-300 ease-out text-xs font-semibold">
              Conversaciones
            </span>
          </button>

          <Link
            to="/publicar"
            aria-label="Publicar"
            className={`group flex items-center h-9 px-2.5 rounded-lg border transition-all duration-300 ${
              isActive("/publicar")
                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                : "border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50/70"
            }`}
          >
            <Plus className="w-4 h-4 shrink-0 transition-transform duration-300 group-hover:rotate-90" />
            <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover:max-w-[90px] group-hover:opacity-100 group-hover:ml-1.5 transition-all duration-300 ease-out text-xs font-semibold">
              Publicar
            </span>
          </Link>

          <button
            type="button"
            aria-label="Notificaciones"
            onClick={() => navigate("/notificaciones")}
            className={`relative group flex items-center h-9 px-2.5 rounded-lg border transition-all duration-300 cursor-pointer ${
              isActive("/notificaciones")
                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                : "border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50/70"
            }`}
          >
            <Bell className="w-4 h-4 shrink-0 transition-transform duration-300 group-hover:rotate-12" />
            {noLeidas > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                {noLeidas > 9 ? "9+" : noLeidas}
              </span>
            )}
            <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover:max-w-[115px] group-hover:opacity-100 group-hover:ml-1.5 transition-all duration-300 ease-out text-xs font-semibold">
              Notificaciones
            </span>
          </button>

          <Link
            to="/perfil"
            className={`flex items-center gap-2 pl-2 pr-3 py-1 rounded-full border text-xs font-semibold transition-colors ${
              isActive("/perfil")
                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                : "border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px] font-bold overflow-hidden">
              {user.foto_perfil ? (
                <img
                  src={user.foto_perfil}
                  alt="Mi Perfil"
                  className="w-full h-full object-cover"
                />
              ) : (
                iniciales
              )}
            </span>
            <span>Mi Perfil</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            title="Cerrar sesión"
            className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Botones móviles */}
        <div className="flex md:hidden items-center gap-1.5">
          <button
            type="button"
            aria-label="Conversaciones"
            onClick={() => navigate("/conversaciones")}
            className={`relative p-2 rounded-lg border cursor-pointer ${
              isActive("/conversaciones")
                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                : "border-slate-200 text-slate-600"
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            {mensajesNoLeidos > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[15px] h-3.5 px-1 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                {mensajesNoLeidos > 9 ? "9+" : mensajesNoLeidos}
              </span>
            )}
          </button>

          <Link
            to="/publicar"
            aria-label="Publicar"
            className={`p-2 rounded-lg border ${
              isActive("/publicar")
                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                : "border-slate-200 text-slate-600"
            }`}
          >
            <Plus className="w-4 h-4" />
          </Link>

          <button
            type="button"
            aria-label="Notificaciones"
            onClick={() => navigate("/notificaciones")}
            className={`relative p-2 rounded-lg border cursor-pointer ${
              isActive("/notificaciones")
                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                : "border-slate-200 text-slate-600"
            }`}
          >
            <Bell className="w-4 h-4" />
            {noLeidas > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[15px] h-3.5 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                {noLeidas > 9 ? "9+" : noLeidas}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMenuAbierto((prev) => !prev)}
            aria-label="Abrir menú"
            className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            {menuAbierto ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Menú desplegable móvil */}
      {menuAbierto && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1.5">
          {navItems.map(({ label, path, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              onClick={() => setMenuAbierto(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${
                isActive(path)
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}

          <Link
            to="/conversaciones"
            onClick={() => setMenuAbierto(false)}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold ${
              isActive("/conversaciones")
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            <span className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Conversaciones
            </span>
            {mensajesNoLeidos > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                {mensajesNoLeidos}
              </span>
            )}
          </Link>

          <Link
            to="/publicar"
            onClick={() => setMenuAbierto(false)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${
              isActive("/publicar")
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Plus className="w-4 h-4" />
            Publicar
          </Link>

          <Link
            to="/perfil"
            onClick={() => setMenuAbierto(false)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${
              isActive("/perfil")
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            <User className="w-4 h-4" />
            Mi Perfil
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      )}
    </header>
  );
}
