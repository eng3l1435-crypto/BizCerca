import React, { useState } from 'react';
import { registrarUsuario } from '../services/api';
import { UsuarioCreatePayload } from '../types/auth';

export const RegisterForm = () => {
  // Estado para controlar la rama principal: 'consumidor' u 'oferente'
  const [esOferente, setEsOferente] = useState(false);

  const [formData, setFormData] = useState<UsuarioCreatePayload>({
    tipo_cuenta: 'consumidor', // 'consumidor' | 'estudiante' | 'proveedor'
    nombres: '',
    apellidos: '',
    correo: '',
    contrasena: '',
    confirmar_contrasena: '',
    telefono: '',
    pais_ciudad: '',
    foto_perfil: 'https://placehold.co/150',
    acepta_terminos: false,
    recibe_avisos: false,
    correo_verificado: false,
    correo_recuperacion: '',
  });

  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  // Manejo del cambio entre Consumidor y Oferente
  const handleCambioRolPrincipal = (oferente: boolean) => {
    setEsOferente(oferente);
    setFormData((prev) => ({
      ...prev,
      // Si es oferente arranca por defecto como estudiante, si no consumidor
      tipo_cuenta: oferente ? 'estudiante' : 'consumidor',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje(null);

    if (formData.contrasena !== formData.confirmar_contrasena) {
      setMensaje({ tipo: 'error', texto: 'Las contraseñas no coinciden' });
      return;
    }

    setLoading(true);

    try {
      // Separamos confirmar_contrasena para no enviar campos ajenos al schema de FastAPI
      const { confirmar_contrasena, ...payload } = formData;
      const usuario = await registrarUsuario(payload);

      setMensaje({
        tipo: 'ok',
        texto: `¡Cuenta creada con éxito! ID asignado: ${usuario.id || usuario._id}`,
      });

      // Limpiar formulario opcionalmente tras éxito
    } catch (err: any) {
      const detalle = err.response?.data?.detail;
      const textoError = Array.isArray(detalle)
        ? detalle.map((d: any) => `${d.loc ? d.loc.slice(-1) + ': ' : ''}${d.msg}`).join(', ')
        : detalle || 'Error al procesar la solicitud';
      setMensaje({ tipo: 'error', texto: textoError });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200/80 shadow-xl p-6 sm:p-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Crear Cuenta</h2>
        <p className="text-xs text-slate-500 mt-1">
          Elige cómo deseas participar dentro de la plataforma
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {/* Selector Principal: Consumidor vs Oferente */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Tipo de perfil <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleCambioRolPrincipal(false)}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                !esOferente
                  ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">🛒</span>
                <span className="text-xs font-bold text-slate-900">Consumidor</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Busco contratar servicios y publicar requerimientos.
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleCambioRolPrincipal(true)}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                esOferente
                  ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">💼</span>
                <span className="text-xs font-bold text-slate-900">Oferente</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Quiero ofrecer servicios, catálogo de productos y propuestas.
              </p>
            </button>
          </div>
        </div>

        {/* Sub-clasificación exclusiva para Oferentes */}
        {esOferente && (
          <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-3 animate-in fade-in duration-150">
            <span className="block text-[11px] font-semibold text-emerald-900 mb-1.5">
              ¿Cómo prestarás tus servicios?
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, tipo_cuenta: 'estudiante' })}
                className={`py-2 px-2 text-xs font-medium rounded-xl border text-center transition cursor-pointer ${
                  formData.tipo_cuenta === 'estudiante'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-emerald-200 hover:bg-emerald-50'
                }`}
              >
                Estudiante / Residente
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, tipo_cuenta: 'proveedor' })}
                className={`py-2 px-2 text-xs font-medium rounded-xl border text-center transition cursor-pointer ${
                  formData.tipo_cuenta === 'proveedor'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-emerald-200 hover:bg-emerald-50'
                }`}
              >
                Empresa / Profesional
              </button>
            </div>
          </div>
        )}

        {/* Campos de Nombre y Apellidos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Nombres</label>
            <input
              type="text"
              required
              placeholder="Ej. Julian"
              value={formData.nombres}
              onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-indigo-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Apellidos</label>
            <input
              type="text"
              required
              placeholder="Ej. Cruz"
              value={formData.apellidos}
              onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-indigo-600"
            />
          </div>
        </div>

        {/* Correo y Teléfono */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Correo electrónico</label>
            <input
              type="email"
              required
              placeholder="tu@correo.com"
              value={formData.correo}
              onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-indigo-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Teléfono</label>
            <input
              type="tel"
              required
              placeholder="7221234567"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-indigo-600"
            />
          </div>
        </div>

        {/* Contraseñas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Contraseña</label>
            <input
              type="password"
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              value={formData.contrasena}
              onChange={(e) => setFormData({ ...formData, contrasena: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-indigo-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Confirmar contraseña</label>
            <input
              type="password"
              required
              placeholder="Repite la contraseña"
              value={formData.confirmar_contrasena}
              onChange={(e) => setFormData({ ...formData, confirmar_contrasena: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-indigo-600"
            />
          </div>
        </div>

        {/* Ubicación y Respaldo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">País / Ciudad</label>
            <input
              type="text"
              required
              placeholder="Toluca, México"
              value={formData.pais_ciudad}
              onChange={(e) => setFormData({ ...formData, pais_ciudad: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-indigo-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Correo de recuperación</label>
            <input
              type="email"
              required
              placeholder="respaldo@ejemplo.com"
              value={formData.correo_recuperacion}
              onChange={(e) => setFormData({ ...formData, correo_recuperacion: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-indigo-600"
            />
          </div>
        </div>

        {/* Términos y Condiciones */}
        <div className="pt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              required
              checked={formData.acepta_terminos}
              onChange={(e) => setFormData({ ...formData, acepta_terminos: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 accent-indigo-600"
            />
            <span className="text-xs text-slate-600">Acepto los términos y condiciones</span>
          </label>
        </div>

        {/* Alertas */}
        {mensaje && (
          <div
            className={`p-3 rounded-xl text-xs font-medium ${
              mensaje.tipo === 'ok'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {mensaje.texto}
          </div>
        )}

        {/* Botón Submit */}
        <button
          type="submit"
          disabled={loading || !formData.acepta_terminos}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-xl transition text-xs shadow-md disabled:opacity-50 cursor-pointer"
        >
          {loading ? 'Creando cuenta...' : `Registrarse como ${esOferente ? 'Oferente' : 'Consumidor'}`}
        </button>
      </form>
    </div>
  );
};