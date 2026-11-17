import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Bell, LogOut, Menu, MessageSquare, User, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import logoBizCerca from "../assets/BizCerca.png";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);

  if (!user) return null;

  const esOferente = user.tipo_cuenta === "oferente";
  const faltaDireccion = !user.direccion;

  const enlaces = esOferente
    ? [
        { to: "/ofertas", label: "Mis Ofertas" },
        { to: "/solicitudes", label: "Necesidades" },
        { to: "/contactos", label: "Contactos" },
      ]
    : [
        { to: "/solicitudes", label: "Mis Necesidades" },
        { to: "/explorar", label: "Explorar Ofertas" },
        { to: "/contactos", label: "Contactos" },
      ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const claseLink = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-lg text-xs font-semibold transition ${
      isActive
        ? "bg-indigo-50 text-indigo-700"
        : "text-slate-600 hover:text-indigo-600 hover:bg-slate-100"
    }`;

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Izquierda: Logo + Rol */}
        <div className="flex items-center gap-3">
          <Link
            to={esOferente ? "/ofertas" : "/solicitudes"}
            className="flex items-center"
          >
            <img
              src={logoBizCerca}
              alt="BizCerca"
              className="h-10 w-auto object-contain"
            />
          </Link>
          <Badge
            variant="secondary"
            className="hidden sm:inline-flex bg-indigo-50 text-indigo-700 border-indigo-200 text-[11px]"
          >
            {esOferente ? "Oferente" : "Contratista"}
          </Badge>
        </div>

        {/* Centro: Navegación escritorio */}
        <nav className="hidden md:flex items-center gap-1">
          {enlaces.map((item) => (
            <NavLink key={item.to} to={item.to} className={claseLink}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Derecha: Notificaciones, Mi Perfil y Salir */}
        <div className="hidden md:flex items-center gap-2">
          <NavLink
            to="/notificaciones"
            className={claseLink}
            title="Notificaciones"
          >
            <Bell className="w-4 h-4" />
          </NavLink>

          <NavLink to="/perfil" className={claseLink}>
            <span className="flex items-center gap-1.5 relative">
              <User className="w-4 h-4" />
              <span>Mi Perfil</span>
              {faltaDireccion && (
                <span
                  title="Completa tu dirección y ubicación"
                  className="w-2 h-2 rounded-full bg-amber-500"
                />
              )}
            </span>
          </NavLink>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
          >
            <LogOut className="w-4 h-4 mr-1" />
            Salir
          </Button>
        </div>

        {/* Botón hamburguesa móvil */}
        <button
          type="button"
          onClick={() => setMenuAbierto((prev) => !prev)}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
        >
          {menuAbierto ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Menú desplegable móvil */}
      {menuAbierto && (
        <div className="md:hidden bg-white border-t border-slate-200 px-4 py-3 space-y-1">
          <div className="px-3 py-1.5 text-xs text-slate-500 flex items-center justify-between">
            <span>
              Hola, <strong className="text-slate-800">{user.nombres}</strong>
            </span>
            <Badge
              variant="secondary"
              className="bg-indigo-50 text-indigo-700 text-[10px]"
            >
              {esOferente ? "Oferente" : "Contratista"}
            </Badge>
          </div>

          {enlaces.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMenuAbierto(false)}
              className={({ isActive }) => `block ${claseLink({ isActive })}`}
            >
              {item.label}
            </NavLink>
          ))}

          <NavLink
            to="/notificaciones"
            onClick={() => setMenuAbierto(false)}
            className={({ isActive }) =>
              `flex items-center gap-2 ${claseLink({ isActive })}`
            }
          >
            <Bell className="w-4 h-4" />
            <span>Notificaciones</span>
          </NavLink>

          <NavLink
            to="/perfil"
            onClick={() => setMenuAbierto(false)}
            className={({ isActive }) =>
              `flex items-center justify-between ${claseLink({ isActive })}`
            }
          >
            <span className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Mi Perfil</span>
            </span>
            {faltaDireccion && (
              <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                Falta dirección
              </span>
            )}
          </NavLink>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      )}
    </header>
  );
}
