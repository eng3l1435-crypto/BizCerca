import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logotipo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            B
          </div>
          <span className="font-extrabold text-xl tracking-tight text-slate-900">
            Biz<span className="text-indigo-600">Cerca</span>
          </span>
        </Link>

        {/* Enlaces y Acciones */}
        {user ? (
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-1">
              <Link
                to="/solicitudes"
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${
                  isActive('/solicitudes')
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Necesidades
              </Link>
              <Link
                to="/ofertas"
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${
                  isActive('/ofertas')
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Oferta
              </Link>
              <Link
                to="/perfil"
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${
                  isActive('/perfil')
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Mi Perfil
              </Link>
            </nav>

            <div className="h-5 w-px bg-slate-200 hidden md:block" />

            {/* Tarjeta de usuario */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-semibold flex items-center justify-center text-xs uppercase border border-indigo-200">
                {user.nombres?.charAt(0) || 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-900 leading-tight">
                  {user.nombres} {user.apellidos}
                </p>
                <span className="text-[10px] font-medium uppercase tracking-wider text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                  {user.tipo_cuenta?.replace('_', ' ')}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="ml-2 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                title="Cerrar sesión"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500 font-medium">
            Acceso seguro a servicios
          </div>
        )}
      </div>
    </header>
  );
};