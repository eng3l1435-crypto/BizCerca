import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { iniciarSesion } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import logoBizCerca from "../assets/BizCerca.png";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [verContrasena, setVerContrasena] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCargando(true);

    try {
      const usuario = await iniciarSesion(correo, contrasena);
      login(usuario);
      navigate(
        usuario.tipo_cuenta === "oferente" ? "/ofertas" : "/solicitudes",
      );
    } catch (err: any) {
      const detalle = err.response?.data?.detail;
      if (typeof detalle === "string") {
        setError(detalle);
      } else {
        setError(
          "No se pudo conectar con el servidor. Verifica que FastAPI esté corriendo.",
        );
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md bg-white border-slate-200 shadow-sm">
        <CardHeader className="items-center text-center pb-4">
          <img
            src={logoBizCerca}
            alt="Logotipo de BizCerca"
            className="h-32 w-auto mx-auto object-contain"
          />
          <CardTitle className="text-2xl font-bold tracking-normal text-black mt-2">
            Iniciar Sesión
          </CardTitle>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="correo"
                className="text-xs font-semibold text-slate-700"
              >
                Correo electrónico
              </Label>
              <Input
                id="correo"
                type="email"
                required
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="tu@correo.com"
                className="bg-white border-slate-300 text-sm text-slate-900 focus-visible:border-indigo-600 focus-visible:ring-indigo-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="contrasena"
                className="text-xs font-semibold text-slate-700"
              >
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="contrasena"
                  type={verContrasena ? "text" : "password"}
                  required
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10 bg-white border-slate-300 text-sm text-slate-900 focus-visible:border-indigo-600 focus-visible:ring-indigo-500/20"
                />
                <button
                  type="button"
                  onClick={() => setVerContrasena((prev) => !prev)}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-indigo-600 cursor-pointer"
                >
                  {verContrasena ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={cargando}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm cursor-pointer"
            >
              {cargando ? "Verificando..." : "Entrar"}
            </Button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-6">
            ¿Aún no tienes cuenta?{" "}
            <Link
              to="/registro"
              className="text-indigo-600 font-semibold hover:underline"
            >
              Regístrate aquí
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
