import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { registrarUsuario, iniciarSesion } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import { UsuarioRegistroPayload } from "../types/auth";
import logoBizCerca from "../assets/BizCerca.png";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";

const URL_TERMINOS_DRIVE = "https://drive.google.com";

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [paso, setPaso] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState({
    tipo_cuenta: "consumidor" as "consumidor" | "oferente",
    nombres: "",
    apellido_paterno: "",
    apellido_materno: "",
    telefono: "",
    correo_registro: "",
    contrasena: "",
    confirmar_contrasena: "",
    acepta_terminos: false,
  });

  const [verContrasena, setVerContrasena] = useState(false);
  const [verConfirmar, setVerConfirmar] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "telefono") {
      const soloDigitos = value.replace(/\D/g, "").slice(0, 10);
      setForm((prev) => ({ ...prev, telefono: soloDigitos }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const avanzarPaso = () => {
    setError(null);
    if (paso === 2) {
      if (!form.nombres.trim() || !form.apellido_paterno.trim()) {
        setError("Por favor ingresa tu nombre y apellido paterno.");
        return;
      }
      if (form.telefono && form.telefono.length !== 10) {
        setError("El número telefónico debe tener exactamente 10 dígitos.");
        return;
      }
    }
    setPaso((prev) => (prev < 3 ? ((prev + 1) as 1 | 2 | 3) : prev));
  };

  const retrocederPaso = () => {
    setError(null);
    setPaso((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3) : prev));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.contrasena.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (form.contrasena !== form.confirmar_contrasena) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setCargando(true);

    const payload: UsuarioRegistroPayload = {
      tipo_cuenta: form.tipo_cuenta,
      nombres: form.nombres.trim(),
      apellido_paterno: form.apellido_paterno.trim(),
      apellido_materno: form.apellido_materno.trim() || undefined,
      telefono: form.telefono || undefined,
      correo_registro: form.correo_registro.trim(),
      contrasena: form.contrasena,
      acepta_terminos: form.acepta_terminos,
      recibe_avisos: false,
    };

    try {
      await registrarUsuario(payload);
      const sesion = await iniciarSesion(
        payload.correo_registro,
        form.contrasena,
      );
      login(sesion);
      navigate(
        sesion.tipo_cuenta === "oferente"
          ? "/completar-perfil"
          : "/solicitudes",
      );
    } catch (err: any) {
      const detalle = err.response?.data?.detail;
      if (typeof detalle === "string") {
        setError(detalle);
      } else if (Array.isArray(detalle)) {
        setError(
          detalle.map((d: any) => `${d.loc?.slice(-1)}: ${d.msg}`).join(" | "),
        );
      } else {
        setError(
          "No se pudo crear la cuenta. Verifica la conexión con el servidor.",
        );
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8">
      <Card className="w-full max-w-lg bg-white border-slate-200 shadow-sm">
        <CardHeader className="items-center text-center pb-4">
          <img
            src={logoBizCerca}
            alt="Logotipo de BizCerca"
            className="h-24 w-auto mx-auto object-contain"
          />
          <CardTitle className="text-2xl font-bold tracking-normal text-black mt-2">
            Crear Cuenta
          </CardTitle>
        </CardHeader>

        <CardContent>
          {/* Barra de progreso en colores claros */}
          <div className="mb-6 space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span
                className={
                  paso >= 1 ? "text-indigo-600 font-semibold" : "text-slate-400"
                }
              >
                1. Uso de cuenta
              </span>
              <span
                className={
                  paso >= 2 ? "text-indigo-600 font-semibold" : "text-slate-400"
                }
              >
                2. Datos personales
              </span>
              <span
                className={
                  paso === 3
                    ? "text-indigo-600 font-semibold"
                    : "text-slate-400"
                }
              >
                3. Acceso
              </span>
            </div>
            <Progress
              value={(paso / 3) * 100}
              className="h-2 bg-indigo-100 [&>div]:bg-indigo-600"
            />
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* SECCIÓN 1: USO DE CUENTA */}
            {paso === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        tipo_cuenta: "consumidor",
                      }))
                    }
                    className={`p-4 rounded-xl border text-center transition cursor-pointer ${
                      form.tipo_cuenta === "consumidor"
                        ? "border-indigo-600 bg-indigo-50 ring-2 ring-indigo-500/20"
                        : "border-slate-200 bg-white hover:border-indigo-300"
                    }`}
                  >
                    <span className="block text-sm font-bold text-indigo-950">
                      Contratista
                    </span>
                    <span className="block text-xs text-slate-600 mt-1">
                      Busco productos y servicios
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, tipo_cuenta: "oferente" }))
                    }
                    className={`p-4 rounded-xl border text-center transition cursor-pointer ${
                      form.tipo_cuenta === "oferente"
                        ? "border-indigo-600 bg-indigo-50 ring-2 ring-indigo-500/20"
                        : "border-slate-200 bg-white hover:border-indigo-300"
                    }`}
                  >
                    <span className="block text-sm font-bold text-indigo-950">
                      Oferente
                    </span>
                    <span className="block text-xs text-slate-600 mt-1">
                      Ofrezco productos y/o servicios
                    </span>
                  </button>
                </div>

                <Button
                  type="button"
                  onClick={avanzarPaso}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                >
                  Continuar
                </Button>
              </div>
            )}

            {/* SECCIÓN 2: DATOS PERSONALES */}
            {paso === 2 && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="nombres" className="text-slate-700">
                    Nombre(s) *
                  </Label>
                  <Input
                    id="nombres"
                    name="nombres"
                    required
                    value={form.nombres}
                    onChange={handleChange}
                    placeholder="Ej. Luis Ángel"
                    className="bg-white border-slate-300 text-slate-900 focus-visible:border-indigo-600 focus-visible:ring-indigo-500/20"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="apellido_paterno"
                      className="text-slate-700"
                    >
                      Apellido Paterno *
                    </Label>
                    <Input
                      id="apellido_paterno"
                      name="apellido_paterno"
                      required
                      value={form.apellido_paterno}
                      onChange={handleChange}
                      placeholder="Paterno"
                      className="bg-white border-slate-300 text-slate-900 focus-visible:border-indigo-600 focus-visible:ring-indigo-500/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="apellido_materno"
                      className="text-slate-700"
                    >
                      Apellido Materno
                    </Label>
                    <Input
                      id="apellido_materno"
                      name="apellido_materno"
                      value={form.apellido_materno}
                      onChange={handleChange}
                      placeholder="Opcional"
                      className="bg-white border-slate-300 text-slate-900 focus-visible:border-indigo-600 focus-visible:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="telefono" className="text-slate-700">
                      Teléfono (10 dígitos)
                    </Label>
                    <span className="text-[11px] text-slate-400">
                      {form.telefono.length}/10
                    </span>
                  </div>
                  <Input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={form.telefono}
                    onChange={handleChange}
                    placeholder="7221234567"
                    className="bg-white border-slate-300 text-slate-900 focus-visible:border-indigo-600 focus-visible:ring-indigo-500/20"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={retrocederPaso}
                    className="w-1/3 border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    Atrás
                  </Button>
                  <Button
                    type="button"
                    onClick={avanzarPaso}
                    className="w-2/3 bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                  >
                    Continuar
                  </Button>
                </div>
              </div>
            )}

            {/* SECCIÓN 3: CORREO, CONTRASEÑA Y TÉRMINOS */}
            {paso === 3 && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="correo_registro" className="text-slate-700">
                    Correo electrónico *
                  </Label>
                  <Input
                    id="correo_registro"
                    name="correo_registro"
                    type="email"
                    required
                    value={form.correo_registro}
                    onChange={handleChange}
                    placeholder="tu@correo.com"
                    className="bg-white border-slate-300 text-slate-900 focus-visible:border-indigo-600 focus-visible:ring-indigo-500/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="contrasena" className="text-slate-700">
                    Contraseña *
                  </Label>
                  <div className="relative">
                    <Input
                      id="contrasena"
                      name="contrasena"
                      type={verContrasena ? "text" : "password"}
                      required
                      minLength={8}
                      value={form.contrasena}
                      onChange={handleChange}
                      placeholder="Mínimo 8 caracteres"
                      className="pr-10 bg-white border-slate-300 text-slate-900 focus-visible:border-indigo-600 focus-visible:ring-indigo-500/20"
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

                <div className="space-y-1.5">
                  <Label
                    htmlFor="confirmar_contrasena"
                    className="text-slate-700"
                  >
                    Confirmar contraseña *
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmar_contrasena"
                      name="confirmar_contrasena"
                      type={verConfirmar ? "text" : "password"}
                      required
                      minLength={8}
                      value={form.confirmar_contrasena}
                      onChange={handleChange}
                      placeholder="Repite la contraseña"
                      className="pr-10 bg-white border-slate-300 text-slate-900 focus-visible:border-indigo-600 focus-visible:ring-indigo-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setVerConfirmar((prev) => !prev)}
                      tabIndex={-1}
                      className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-indigo-600 cursor-pointer"
                    >
                      {verConfirmar ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <Checkbox
                    id="acepta_terminos"
                    checked={form.acepta_terminos}
                    onCheckedChange={(checked) =>
                      setForm((prev) => ({
                        ...prev,
                        acepta_terminos: checked === true,
                      }))
                    }
                    className="border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                  />
                  <Label
                    htmlFor="acepta_terminos"
                    className="text-xs font-normal text-slate-600 cursor-pointer"
                  >
                    Acepto los{" "}
                    <a
                      href={URL_TERMINOS_DRIVE}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-indigo-600 font-semibold underline hover:text-indigo-800"
                    >
                      Términos y condiciones
                    </a>{" "}
                    *
                  </Label>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={retrocederPaso}
                    disabled={cargando}
                    className="w-1/3 border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    Atrás
                  </Button>
                  <Button
                    type="submit"
                    disabled={cargando || !form.acepta_terminos}
                    className="w-2/3 bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                  >
                    {cargando ? "Creando cuenta..." : "Registrarme"}
                  </Button>
                </div>
              </div>
            )}
          </form>

          <p className="text-center text-xs text-slate-500 mt-6">
            ¿Ya tienes cuenta?{" "}
            <Link
              to="/login"
              className="text-indigo-600 font-semibold hover:underline"
            >
              Inicia sesión aquí
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
