import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { registrarUsuario, loginUsuario } from '../services/api';

export const AuthPage = () => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const { login } = useAuth();
  const navigate = useNavigate();

  // Estados de Login
  const [loginCorreo, setLoginCorreo] = useState('');
  const [loginClave, setLoginClave] = useState('');



  const [detectandoGps, setDetectandoGps] = useState(false);


  // Estados de Registro ajustados al nuevo esquema
  const [registroData, setRegistroData] = useState({
    tipo_cuenta: 'consumidor', // 'consumidor' | 'proveedor' | 'estudiante'
    nombres: '',
    apellido_paterno: '',
    apellido_materno: '',
    correo_registro: '',
    contrasena: '',
    confirmar_contrasena: '',
    telefono: '',
    correo_recuperacion: '',
    direccion: {
      pais: 'México',
      estado: '',
      municipio: '',
      colonia: '',
      calle: '',
      numero_exterior: '',
      numero_interior: '',
      codigo_postal: '',
    },
    ubicacion_gps: {
      type: 'Point',
      coordinates: [-99.1332, 19.4326], // [Longitud, Latitud]
    },
    foto_perfil: 'https://placehold.co/150',
    acepta_terminos: false,
    recibe_avisos: false,
  });

  const [loading, setLoading] = useState(false);
  const [alerta, setAlerta] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  // Manejador genérico para campos directos
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegistroData((prev) => ({ ...prev, [name]: value }));
  };

  // Manejador para campos anidados de dirección
  const handleDireccionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegistroData((prev) => ({
      ...prev,
      direccion: { ...prev.direccion, [name]: value },
    }));
  };

  // Obtener geolocalización actual del navegador


// Captura automática mediante el navegador
const capturarUbicacion = () => {
  if (!navigator.geolocation) {
    setAlerta({ tipo: 'error', texto: 'Tu navegador no admite geolocalización.' });
    return;
  }

  setDetectandoGps(true);
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      setRegistroData((prev) => ({
        ...prev,
        ubicacion_gps: {
          type: 'Point',
          // GeoJSON: [Longitud, Latitud]
          coordinates: [
            parseFloat(pos.coords.longitude.toFixed(6)),
            parseFloat(pos.coords.latitude.toFixed(6)),
          ],
        },
      }));
      setDetectandoGps(false);
    },
    (err) => {
      console.warn('Error GPS:', err);
      setAlerta({
        tipo: 'error',
        texto: 'No se pudo obtener la ubicación automática. Ingrésala manualmente.',
      });
      setDetectandoGps(false);
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
};

// Edición manual de coordenadas
const handleCoordenadaManual = (tipo: 'lat' | 'lng', valorStr: string) => {
  const valor = valorStr === '' ? '' : parseFloat(valorStr);
  
  setRegistroData((prev) => {
    const coordsActuales = [...prev.ubicacion_gps.coordinates];
    if (tipo === 'lng') {
      coordsActuales[0] = valor === '' ? 0 : valor;
    } else {
      coordsActuales[1] = valor === '' ? 0 : valor;
    }

    return {
      ...prev,
      ubicacion_gps: {
        ...prev.ubicacion_gps,
        coordinates: coordsActuales,
      },
    };
  });
};

  // Manejo de Inicio de Sesión
 const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlerta(null);
    setLoading(true);

    try {
      // Envía { correo, contrasena } al backend
      const dataRespuesta = await loginUsuario(loginCorreo, loginClave);
      
      // Guarda en el contexto con ID válido y rol visible
      login(dataRespuesta);
      navigate('/solicitudes');
    } catch (err: any) {
      console.error('Error detallado de login:', err);

      const detalle = err.response?.data?.detail;
      let mensaje = 'Credenciales inválidas o error de conexión';

      if (typeof detalle === 'string') {
        mensaje = detalle;
      } else if (Array.isArray(detalle)) {
        mensaje = detalle
          .map((d: any) => `${d.loc ? d.loc.slice(1).join('.') + ': ' : ''}${d.msg}`)
          .join(' | ');
      }

      setAlerta({ tipo: 'error', texto: mensaje });
    } finally {
      setLoading(false);
    }
  };
  // Manejo de Registro
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlerta(null);

    if (registroData.contrasena !== registroData.confirmar_contrasena) {
      setAlerta({ tipo: 'error', texto: 'Las contraseñas no coinciden' });
      return;
    }

    setLoading(true);

    // Separamos confirmar_contrasena para no enviarla al backend
    const { confirmar_contrasena, ...payload } = registroData;

    try {
      await registrarUsuario(payload);
      setAlerta({ tipo: 'ok', texto: '¡Cuenta creada! Ya puedes iniciar sesión' });
      setTab('login');
      setLoginCorreo(registroData.correo_registro);
    } catch (err: any) {
      const detalle = err.response?.data?.detail;
      const texto = Array.isArray(detalle)
        ? detalle.map((d: any) => `${d.loc?.slice(-1)}: ${d.msg}`).join(', ')
        : detalle || 'Error al crear la cuenta';
      setAlerta({ tipo: 'error', texto });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-6 sm:p-8 my-6">
        {/* Cabecera */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900" style={{ color: '#0f172a' }}>
            {tab === 'login' ? 'Bienvenido de nuevo' : 'Únete a BizCerca'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {tab === 'login'
              ? 'Ingresa tus credenciales para administrar tus solicitudes'
              : 'Conecta con empresas y estudiantes en una sola plataforma'}
          </p>
        </div>

        {/* Pestañas Login / Registro */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => { setTab('login'); setAlerta(null); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              tab === 'login'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setAlerta(null); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              tab === 'register'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Crear Cuenta
          </button>
        </div>

        {/* Notificaciones */}
        {alerta && (
          <div
            className={`p-3.5 rounded-xl mb-5 text-xs font-medium flex items-center gap-2 ${
              alerta.tipo === 'ok'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            <span>{alerta.tipo === 'ok' ? '✓' : '⚠'}</span>
            <span>{alerta.texto}</span>
          </div>
        )}

        {/* FORMULARIO LOGIN */}
        {tab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Correo electrónico</label>
              <input
                type="email"
                required
                value={loginCorreo}
                onChange={(e) => setLoginCorreo(e.target.value)}
                className="w-full text-sm rounded-xl border border-slate-300 px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition"
                placeholder="tu@correo.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Contraseña</label>
              <input
                type="password"
                required
                value={loginClave}
                onChange={(e) => setLoginClave(e.target.value)}
                className="w-full text-sm rounded-xl border border-slate-300 px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 text-sm mt-2"
            >
              {loading ? 'Ingresando...' : 'Iniciar Sesión'}
            </button>
          </form>
        )}

        {/* FORMULARIO REGISTRO */}
        {tab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4 text-left">
            {/* Selector de Tipo de Usuario */}
            {/* <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Tipo de usuario</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'estudiante', label: 'Estudiante' },
                  { id: 'proveedor', label: 'Empresa' },
                  { id: 'consumidor', label: 'Usuario General' },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setRegistroData({ ...registroData, tipo_cuenta: item.id })}
                    className={`py-2 px-2 text-xs font-semibold rounded-xl border transition ${
                      registroData.tipo_cuenta === item.id
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div> */}

            {/* Nombres y Apellidos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">Nombres</label>
                <input
                  type="text"
                  name="nombres"
                  required
                  value={registroData.nombres}
                  onChange={handleChange}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-indigo-600"
                  placeholder="Ej. Juan Carlos"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Apellido Paterno</label>
                <input
                  type="text"
                  name="apellido_paterno"
                  required
                  value={registroData.apellido_paterno}
                  onChange={handleChange}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-indigo-600"
                  placeholder="Paterno"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Apellido Materno</label>
                <input
                  type="text"
                  name="apellido_materno"
                  required
                  value={registroData.apellido_materno}
                  onChange={handleChange}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-indigo-600"
                  placeholder="Materno"
                />
              </div>
            </div>

            {/* Contacto */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Correo de registro</label>
                <input
                  type="email"
                  name="correo_registro"
                  required
                  value={registroData.correo_registro}
                  onChange={handleChange}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-indigo-600"
                  placeholder="usuario@gmail.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  name="telefono"
                  required
                  value={registroData.telefono}
                  onChange={handleChange}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-indigo-600"
                  placeholder="7221234567"
                />
              </div>
            </div>

            {/* Contraseñas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Contraseña</label>
                <input
                  type="password"
                  name="contrasena"
                  required
                  minLength={8}
                  value={registroData.contrasena}
                  onChange={handleChange}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-indigo-600"
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Confirmar contraseña</label>
                <input
                  type="password"
                  name="confirmar_contrasena"
                  required
                  value={registroData.confirmar_contrasena}
                  onChange={handleChange}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-indigo-600"
                  placeholder="Repite la contraseña"
                />
              </div>
            </div>

            {/* Correo de recuperación */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Correo de recuperación / respaldo</label>
              <input
                type="email"
                name="correo_recuperacion"
                required
                value={registroData.correo_recuperacion}
                onChange={handleChange}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-indigo-600"
                placeholder="respaldo@ejemplo.com"
              />
            </div>

            {/* Sección de Dirección Anidada */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-3">
              <span className="block text-xs font-semibold text-slate-700">Dirección</span>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <input
                    type="text"
                    name="calle"
                    placeholder="Calle"
                    required
                    value={registroData.direccion.calle}
                    onChange={handleDireccionChange}
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="numero_exterior"
                    placeholder="No. Ext"
                    required
                    value={registroData.direccion.numero_exterior}
                    onChange={handleDireccionChange}
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  name="numero_interior"
                  placeholder="No. Int (Opcional)"
                  value={registroData.direccion.numero_interior}
                  onChange={handleDireccionChange}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white outline-none focus:border-indigo-600"
                />
                <input
                  type="text"
                  name="codigo_postal"
                  placeholder="Código Postal"
                  required
                  value={registroData.direccion.codigo_postal}
                  onChange={handleDireccionChange}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  name="colonia"
                  placeholder="Colonia"
                  required
                  value={registroData.direccion.colonia}
                  onChange={handleDireccionChange}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white outline-none focus:border-indigo-600"
                />
                <input
                  type="text"
                  name="municipio"
                  placeholder="Municipio"
                  required
                  value={registroData.direccion.municipio}
                  onChange={handleDireccionChange}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white outline-none focus:border-indigo-600"
                />
                <input
                  type="text"
                  name="estado"
                  placeholder="Estado"
                  required
                  value={registroData.direccion.estado}
                  onChange={handleDireccionChange}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            {/* Sección de Coordenadas GPS (Manual + Detección Automática) */}
<div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
    <div>
      <span className="block text-xs font-bold text-slate-900">
        Ubicación Geográfica (GPS)
      </span>
      <p className="text-[11px] text-slate-500">
        Detecta tu posición o escribe las coordenadas directamente.
      </p>
    </div>

    <button
      type="button"
      onClick={capturarUbicacion}
      disabled={detectandoGps}
      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-xs self-start sm:self-auto"
    >
    
      <span>{detectandoGps ? 'Detectando...' : 'Detectar automáticamente'}</span>
    </button>
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
    {/* Campo Latitud */}
    <div>
      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
        Latitud
      </label>
      <input
        type="number"
        step="any"
        required
        placeholder="Ej. 19.4326"
        value={registroData.ubicacion_gps.coordinates[1] ?? ''}
        onChange={(e) => handleCoordenadaManual('lat', e.target.value)}
        className="w-full text-xs font-medium rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
      />
      <span className="text-[10px] text-slate-400 mt-0.5 block">
        Rango: -90 a 90
      </span>
    </div>

    {/* Campo Longitud */}
    <div>
      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
        Longitud
      </label>
      <input
        type="number"
        step="any"
        required
        placeholder="Ej. -99.1332"
        value={registroData.ubicacion_gps.coordinates[0] ?? ''}
        onChange={(e) => handleCoordenadaManual('lng', e.target.value)}
        className="w-full text-xs font-medium rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
      />
      <span className="text-[10px] text-slate-400 mt-0.5 block">
        Rango: -180 a 180
      </span>
    </div>
  </div>
</div>
            {/* Checkboxes de Términos y Avisos */}
            <div className="space-y-1 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={registroData.recibe_avisos}
                  onChange={(e) => setRegistroData({ ...registroData, recibe_avisos: e.target.checked })}
                  className="w-3.5 h-3.5 rounded text-indigo-600 accent-indigo-600"
                />
                <span className="text-[11px] text-slate-600">Deseo recibir avisos y novedades por correo</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={registroData.acepta_terminos}
                  onChange={(e) => setRegistroData({ ...registroData, acepta_terminos: e.target.checked })}
                  className="w-3.5 h-3.5 rounded text-indigo-600 accent-indigo-600"
                />
                <span className="text-[11px] text-slate-600">Acepto los términos y condiciones</span>
              </label>
            </div>

            {/* Botón Submit */}
            <button
              type="submit"
              disabled={loading || !registroData.acepta_terminos}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl transition shadow-md shadow-indigo-600/20 text-xs mt-3 disabled:opacity-50"
            >
              {loading ? 'Creando...' : 'Completar Registro'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};