import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Package, Wrench } from "lucide-react";
import { crearOferta } from "../../services/publicacionService";
import { obtenerPerfilOferente } from "../../services/perfilService";
import type { PerfilOferente } from "../../types/offerer";
import TagsInput from "./TagsInput";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  userId: string;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
  onClearAlerts: () => void;
}

export default function PublicarOfertaSection({
  userId,
  onSuccess,
  onError,
  onClearAlerts,
}: Props) {
  const navigate = useNavigate();

  const [perfilOferente, setPerfilOferente] = useState<PerfilOferente | null>(
    null,
  );
  const [cargandoPerfil, setCargandoPerfil] = useState(true);
  const [modalRestriccion, setModalRestriccion] = useState(false);

  const [tipo, setTipo] = useState<"producto" | "servicio">("producto");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [fechaLimite, setFechaLimite] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!userId) return;
    obtenerPerfilOferente(userId)
      .then((perfil) => {
        setPerfilOferente(perfil);
        if (perfil?.productos_servicios === "servicios") {
          setTipo("servicio");
        } else if (perfil?.productos_servicios === "productos") {
          setTipo("producto");
        }
      })
      .catch(() => {})
      .finally(() => setCargandoPerfil(false));
  }, [userId]);

  const esTipoPermitido = (tipoSeleccionado: "producto" | "servicio") => {
    if (!perfilOferente) return false;
    if (perfilOferente.productos_servicios === "ambos") return true;
    if (
      tipoSeleccionado === "producto" &&
      perfilOferente.productos_servicios === "productos"
    ) {
      return true;
    }
    if (
      tipoSeleccionado === "servicio" &&
      perfilOferente.productos_servicios === "servicios"
    ) {
      return true;
    }
    return false;
  };

  const handleSeleccionarTipo = (nuevoTipo: "producto" | "servicio") => {
    onClearAlerts();
    if (!cargandoPerfil && !esTipoPermitido(nuevoTipo)) {
      setModalRestriccion(true);
      return;
    }
    setTipo(nuevoTipo);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onClearAlerts();

    if (!cargandoPerfil && !esTipoPermitido(tipo)) {
      setModalRestriccion(true);
      return;
    }

    const tagsFinales = [...tags];
    if (tagInput.trim()) {
      tagInput
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0 && !tagsFinales.includes(t))
        .forEach((t) => tagsFinales.push(t));
    }

    const precioNumerico = parseFloat(precio);
    if (
      !titulo.trim() ||
      !descripcion.trim() ||
      !fechaLimite.trim() ||
      Number.isNaN(precioNumerico) ||
      precioNumerico < 0
    ) {
      onError(
        "Completa todos los campos obligatorios y verifica que el precio sea válido.",
      );
      return;
    }

    if (tagsFinales.length === 0) {
      onError("Agrega al menos un tag para tu oferta.");
      return;
    }

    setEnviando(true);
    try {
      await crearOferta({
        tipo,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        categorias_tags: tagsFinales,
        precio: precioNumerico,
        fecha_plazo_aproximado: fechaLimite.trim(),
        publicado: true,
        usuario_id: userId,
      });

      setTitulo("");
      setDescripcion("");
      setPrecio("");
      setTags([]);
      setTagInput("");
      setFechaLimite("");
      onSuccess("Tu oferta se publicó correctamente.");
    } catch (err: any) {
      const detalle = err.response?.data?.detail;
      onError(
        typeof detalle === "string"
          ? detalle
          : "No se pudo publicar tu oferta. Verifica los datos.",
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-indigo-600" />
            <CardTitle className="text-base font-bold text-slate-900">
              Publicar Oferta
            </CardTitle>
          </div>
          <p className="text-xs text-slate-500">
            Publica un producto o servicio en el catálogo local de BizCerca.
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tipo: Producto o Servicio */}
            <div>
              <Label className="text-xs text-slate-700 block mb-1.5">
                ¿Qué vas a publicar? *
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSeleccionarTipo("producto")}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-semibold cursor-pointer ${
                    tipo === "producto"
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Package className="w-4 h-4" />
                  Producto
                </button>

                <button
                  type="button"
                  onClick={() => handleSeleccionarTipo("servicio")}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-semibold cursor-pointer ${
                    tipo === "servicio"
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Wrench className="w-4 h-4" />
                  Servicio
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs text-slate-700">Título *</Label>
                <Input
                  required
                  maxLength={120}
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder={
                    tipo === "producto"
                      ? "Ej. Calcetas de abejita"
                      : "Ej. Mantenimiento preventivo de laptops"
                  }
                  className="bg-white border-slate-300 text-sm text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-700">Precio (MXN) *</Label>
                <Input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  placeholder="85.50"
                  className="bg-white border-slate-300 text-sm text-slate-900"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-slate-700">Descripción *</Label>
              <textarea
                required
                rows={3}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder={
                  tipo === "producto"
                    ? "Describe materiales, tallas, estado o detalles del producto..."
                    : "Describe qué incluye tu servicio, herramientas y condiciones..."
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-600"
              />
            </div>

            {/* Tags y Fecha Límite compactos en 2 columnas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
              <TagsInput
                tags={tags}
                inputValue={tagInput}
                onInputChange={setTagInput}
                onChangeTags={setTags}
                placeholder={
                  tipo === "producto"
                    ? "Ej. ropa, accesorios"
                    : "Ej. soporte, reparación"
                }
              />

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-700 block">
                  Fecha Límite *
                </Label>
                <Input
                  required
                  value={fechaLimite}
                  onChange={(e) => setFechaLimite(e.target.value)}
                  placeholder="Ej. Entrega inmediata"
                  className="h-9 bg-white border-slate-300 text-xs text-slate-900"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button
                type="submit"
                size="sm"
                disabled={enviando}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
              >
                {enviando ? "Publicando..." : "Publicar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* MODAL RESTRICCIÓN DE TIPO DE PUBLICACIÓN */}
      <Dialog open={modalRestriccion} onOpenChange={setModalRestriccion}>
        <DialogContent className="bg-white text-slate-900 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-black flex items-center gap-2 pr-6">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              Tu cuenta no permite este tipo de publicación
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 pt-1 leading-relaxed">
              {perfilOferente
                ? `Tu perfil comercial está configurado actualmente solo para "${perfilOferente.productos_servicios}". Si deseas publicar otro tipo, actualiza esa opción en tu perfil.`
                : "Aún no has completado tu perfil comercial de oferente. Configúralo para habilitar tus publicaciones."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setModalRestriccion(false);
                navigate("/perfil");
              }}
              className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
            >
              Ajustar Perfil
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
