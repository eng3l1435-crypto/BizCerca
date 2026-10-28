// src/context/AuthContext.tsx
import React, { createContext, useContext, useState } from 'react';
import { UsuarioSession } from '../types';

interface AuthContextType {
  user: UsuarioSession | null;
  login: (usuario: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UsuarioSession | null>(() => {
    try {
      const sesion = localStorage.getItem('usuario_sesion');
      return sesion ? JSON.parse(sesion) : null;
    } catch {
      return null;
    }
  });

  const login = (usuarioBackend: any) => {
    // Normalizar datos según lo que devuelve el backend (/auth/login o /usuarios/)
    const id = usuarioBackend.id || usuarioBackend._id || usuarioBackend.usuario_id;
    const rol = usuarioBackend.tipo_cuenta || usuarioBackend.rol || 'CONSUMIDOR';
    const nombre = usuarioBackend.nombres || usuarioBackend.nombre || usuarioBackend.correo_registro?.split('@')[0] || 'Usuario';

    const sesionNormalizada = {
      ...usuarioBackend,
      id: String(id),
      nombres: nombre,
      nombre: nombre,
      rol: rol.toUpperCase(), // Para que el badge del Navbar no quede vacío
      tipo_cuenta: rol.toLowerCase(),
    };

    setUser(sesionNormalizada);
    localStorage.setItem('usuario_sesion', JSON.stringify(sesionNormalizada));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('usuario_sesion');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);