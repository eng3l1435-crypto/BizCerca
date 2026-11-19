import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute, PublicRoute } from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PerfilPage from "./pages/PerfilPage";
import PublicarPage from "./pages/PublicarPage";
import MisPublicacionesPage from "./pages/MisPublicacionesPage";
import ExplorarPage from "./pages/ExplorarPage";
import ConversacionesPage from "./pages/ConversacionesPage";
import NotificacionesPage from "./pages/NotificacionesPage";
import AnalisisPage from "./pages/AnalisisPage";

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
            <Route path="/publicar" element={<PublicarPage />} />
            <Route
              path="/mis-publicaciones"
              element={<MisPublicacionesPage />}
            />
            <Route
              path="/solicitudes"
              element={<Navigate to="/mis-publicaciones" replace />}
            />
            <Route path="/explorar" element={<ExplorarPage />} />
            <Route path="/analisis" element={<AnalisisPage />} />
            <Route path="/conversaciones" element={<ConversacionesPage />} />
            <Route
              path="/contactos"
              element={<Navigate to="/conversaciones" replace />}
            />
            <Route path="/notificaciones" element={<NotificacionesPage />} />
          </Route>

          {/* Rutas protegidas exclusivas para Oferentes */}
          <Route element={<ProtectedRoute rolPermitido="oferente" />}>
            <Route
              path="/ofertas"
              element={<Navigate to="/mis-publicaciones" replace />}
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
