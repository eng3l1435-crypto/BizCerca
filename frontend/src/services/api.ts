import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Registra un nuevo usuario en POST /auth/usuarios
 * Retorna el documento serializado con id (sin contraseñas)
 */
export const registrarUsuario = async (datos) => {
  const { data } = await api.post('/auth/registro', datos);
  return data;
};

/**
 * Obtiene la lista de usuarios en GET /usuarios?limit=100
 */
export const listarUsuarios = async (limit = 100) => {
  const { data } = await api.get('/usuarios', {
    params: { limit },
  });
  return data;
};

/**
 * Obtiene un usuario específico por su ObjectId en GET /api/usuarios/{item_id}
 */
export const obtenerUsuario = async (itemId) => {
  const { data } = await api.get(`/usuarios/${itemId}`);
  return data;
};

/**
 * Actualiza parcialmente un usuario en PATCH /api/usuarios/{item_id}
 */
export const actualizarUsuario = async (itemId, cambios) => {
  const { data } = await api.patch(`/usuarios/${itemId}`, cambios);
  return data;
};

/** PENDIENTE
 * Elimina un usuario por su ObjectId en DELETE /api/usuarios/{item_id}
 */
export const eliminarUsuario = async (itemId) => {
  const { data } = await api.delete(`/usuarios/${itemId}`);
  return data;
};

/**
 * Inicio de sesión.
 */
// src/services/api.ts

export const loginUsuario = async (correo: string, contrasena: string) => {
  // 1. Autenticar credenciales
  const { data: respuestaLogin } = await api.post('/auth/login', {
    correo: correo.trim(),
    contrasena: contrasena,
  });

  const userId = respuestaLogin.usuario_id || respuestaLogin.id || respuestaLogin._id;

  // 2. Si el login no entregó los nombres, consultar el perfil del usuario
  if (userId) {
    try {
      const { data: perfil } = await api.get(`/usuarios/${userId}`);
      return {
        ...respuestaLogin,
        ...perfil,
        id: String(userId),
      };
    } catch (err) {
      console.warn('No se pudo consultar el detalle en /usuarios/, usando datos base:', err);
    }
  }

  return respuestaLogin;
};

  // Retornar el objeto del usuario o extraerlo de la respuesta


export const registrarPerfilEstudiante = async (datos) => {
  const { data } = await api.post('/api/estudiantes', datos);
  return data;
};

export const registrarPerfilEmpresa = async (datos) => {
  const { data } = await api.post('/api/empresas', datos);
  return data;
};

///////////////////////////////////////////// ------- NECESIDADES ------ /////////////////////////////////////////////////////////////
// 1. Listar el feed de requerimientos/necesidades
export const listarSolicitudes = async () => {
  const { data } = await api.get('/necesidades/');
// Extraer el arreglo independientemente de si viene empaquetado o directo
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.necesidades)) return data.necesidades;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  
  return [];
};

// 2. Publicar un nuevo requerimiento
export const crearSolicitud = async (datos) => {
  const { data } = await api.post('/necesidades/', datos);
  return data;
};

// 3. Cambiar estado o cerrar requerimiento
export const cambiarEstadoSolicitud = async (needId, publicado = false) => {
  // El backend espera: { "publicado": false } para pausar/cerrar
  const { data } = await api.patch(`/necesidades/${needId}/estado`, {
    publicado: Boolean(publicado),
  });
  return data;
};


// 4. Ver detalle individual
export const obtenerDetalleSolicitud = async (needId) => {
  const { data } = await api.get(`/necesidades/${needId}`);
  return data;
};

// export const actualizarSolicitud = async (itemId, cambios) => {+
//   const { data } = await api.patch(`/api/necesidades/${itemId}`, cambios);
//   return data;
// };                  PENDIENTE

export const eliminarSolicitud = async (itemId) => {
   const { data } = await api.delete(`/necesidades/${itemId}`);
   return data;
 };




 ////////////////////////////////////////////// ------ OFERTAS -------- //////////////////////////////////////////

// 1. Obtener el catálogo / feed de ofertas activas
export const listarOfertas = async () => {
  const { data } = await api.get('/ofertas/');
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.ofertas)) return data.ofertas;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

// 2. Publicar una nueva oferta (producto o servicio)
export const crearOferta = async (payload: any) => {
  const { data } = await api.post('/ofertas/', payload);
  return data;
};

// 3. Activar, pausar o cambiar estado de una oferta
export const cambiarEstadoOferta = async (offerId: string, activo: boolean) => {
  const { data } = await api.patch(`/ofertas/${offerId}/estado`, {
    activo: Boolean(activo),
  });
  return data;
};














////////////////////////////////////////////// PENDIENTE

export const obtenerRecomendaciones = async (preferencias, metodo = 'euclidiana') => {
  // Ajusta la ruta a '/recomendaciones' o '/api/recomendaciones' según tu router
  const { data } = await api.post('/api/recomendaciones', {
    preferencias,
    metodo,
  });
  return data.recomendaciones;
};
