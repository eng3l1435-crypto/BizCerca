import React, { createContext, useContext, useState } from "react";
import { UsuarioSesion } from "../types/auth";

interface AuthContextType {
  user: UsuarioSesion | null;
  login: (usuario: UsuarioSesion) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const STORAGE_KEY = "bizcerca_sesion";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UsuarioSesion | null>(() => {
    try {
      const guardado = localStorage.getItem(STORAGE_KEY);
      return guardado ? JSON.parse(guardado) : null;
    } catch {
      return null;
    }
  });

  const login = (usuario: UsuarioSesion) => {
    setUser(usuario);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(usuario));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
