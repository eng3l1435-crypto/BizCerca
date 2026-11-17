import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute, PublicRoute } from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PerfilPage from "./pages/PerfilPage";

function VistaEnConstruccion({ titulo }: { titulo: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <h1 className="text-lg font-bold text-black">{titulo}</h1>
      <p className="text-xs text-slate-500 mt-1">
        Módulo listo para conectar con la API.
      </p>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas públicas (redirigen si ya hay sesión) */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/registro" element={<RegisterPage />} />
          </Route>

          {/* Rutas protegidas para cualquier usuario autenticado */}
          <Route element={<ProtectedRoute />}>
            <Route path="/perfil" element={<PerfilPage />} />
            <Route
              path="/solicitudes"
              element={<VistaEnConstruccion titulo="Necesidades" />}
            />
            <Route
              path="/explorar"
              element={<VistaEnConstruccion titulo="Explorar Ofertas" />}
            />
            <Route
              path="/contactos"
              element={<VistaEnConstruccion titulo="Peticiones de Contacto" />}
            />
            <Route
              path="/notificaciones"
              element={<VistaEnConstruccion titulo="Notificaciones" />}
            />
          </Route>

          {/* Rutas protegidas exclusivas para Oferentes */}
          <Route element={<ProtectedRoute rolPermitido="oferente" />}>
            <Route
              path="/ofertas"
              element={<VistaEnConstruccion titulo="Mis Ofertas" />}
            />
            <Route path="/completar-perfil" element={<PerfilPage />} />
          </Route>

          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
