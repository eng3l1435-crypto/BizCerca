import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "./Navbar";

interface ProtectedRouteProps {
  rolPermitido?: "consumidor" | "oferente";
}

export function ProtectedRoute({ rolPermitido }: ProtectedRouteProps) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (rolPermitido && user.tipo_cuenta !== rolPermitido) {
    return (
      <Navigate
        to={
          user.tipo_cuenta === "oferente"
            ? "/mis-publicaciones?tab=ofertas"
            : "/mis-publicaciones"
        }
        replace
      />
    );
  }

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

  if (user) {
    return (
      <Navigate
        to={
          user.tipo_cuenta === "oferente"
            ? "/mis-publicaciones?tab=ofertas"
            : "/mis-publicaciones"
        }
        replace
      />
    );
  }

  return <Outlet />;
}
