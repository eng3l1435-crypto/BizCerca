import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "./Navbar";

interface ProtectedRouteProps {
  rolPermitido?: "consumidor" | "oferente";
}

export function ProtectedRoute({ rolPermitido }: ProtectedRouteProps) {
  const { user } = useAuth();

  // Si no ha iniciado sesión, mandar a /login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si la ruta exige un rol específico y no coincide, redirigir a su inicio
  if (rolPermitido && user.tipo_cuenta !== rolPermitido) {
    return (
      <Navigate
        to={user.tipo_cuenta === "oferente" ? "/ofertas" : "/solicitudes"}
        replace
      />
    );
  }

  // Si tiene permiso, renderizar el Navbar arriba y la página hija abajo (<Outlet />)
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

export function PublicRoute() {
  const { user } = useAuth();

  // Si ya inició sesión, evitar que entre de nuevo a /login o /registro
  if (user) {
    return (
      <Navigate
        to={user.tipo_cuenta === "oferente" ? "/ofertas" : "/solicitudes"}
        replace
      />
    );
  }

  return <Outlet />;
}
