import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { registrarPerfilEstudiante, registrarPerfilEmpresa } from '../services/api';
import { useNavigate } from 'react-router-dom';

export const CompletarPerfil = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  // Estado para Estudiantes
  const [carrera, setCarrera] = useState('');
  const [institucion, setInstitucion] = useState('');
  const [modalidadPresencial, setModalidadPresencial] = useState(true);

  // Estado para Empresas
  const [nombreEmpresa, setNombreEmpresa] = useState('');
  const [sector, setSector] = useState('');

  if (!user) {
    return <p>Debes iniciar sesión para vincular tu perfil.</p>;
  }

  const handleGuardarEstudiante = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await registrarPerfilEstudiante({
        usuario_id: user.id,
        edad: 21,
        institucion_educativa: institucion,
        correo_institucional: user.correo,
        programa_carrera: carrera,
        habilidades_servicios_intereses: 'Desarrollo web',
        portafolio_url: 'https://github.com',
        catalogo_url: 'https://miportafolio.com',
        Modalidad: modalidadPresencial,
        disponibilidad_horarios: 'Tardes',
      });
      navigate('/solicitudes');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al guardar perfil');
    }
  };

  const handleGuardarEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await registrarPerfilEmpresa({
        usuario_id: user.id,
        nombre_publico: nombreEmpresa,
        tipo_actividad_sector: sector,
        descripcion: 'Servicios profesionales',
        productos_servicios: 'Software a medida',
        catalogo_sitio_web_tienda_portafolio: 'https://miempresa.com',
        red_social_tipo: 'LinkedIn',
        red_social_url: 'https://linkedin.com/company/empresa',
        correo_contacto_publico: user.correo,
        telefono_mensajeria: '5551234567',
        ubicacion_atencion: 'Oficina Central',
        horario: '9am - 6pm',
        modalidad: 'Híbrida',
        representacion_legitimidad: true,
        nombre_representante: `${user.nombres} ${user.apellidos}`,
      });
      navigate('/solicitudes');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al guardar perfil');
    }
  };

  return (
    <div style={{ maxWidth: '480px', margin: '2rem auto' }}>
      <h2>Completar perfil de {user.tipo_cuenta}</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {user.tipo_cuenta === 'estudiante' && (
        <form onSubmit={handleGuardarEstudiante}>
          <input
            type="text"
            placeholder="Carrera o programa"
            value={carrera}
            required
            onChange={(e) => setCarrera(e.target.value)}
          />
          <input
            type="text"
            placeholder="Institución educativa"
            value={institucion}
            required
            onChange={(e) => setInstitucion(e.target.value)}
          />
          <label>
            <input
              type="checkbox"
              checked={modalidadPresencial}
              onChange={(e) => setModalidadPresencial(e.target.checked)}
            />
            Modalidad presencial
          </label>
          <button type="submit">Guardar perfil de estudiante</button>
        </form>
      )}

      {user.tipo_cuenta === 'empresa' && (
        <form onSubmit={handleGuardarEmpresa}>
          <input
            type="text"
            placeholder="Nombre comercial / público"
            value={nombreEmpresa}
            required
            onChange={(e) => setNombreEmpresa(e.target.value)}
          />
          <input
            type="text"
            placeholder="Sector o actividad"
            value={sector}
            required
            onChange={(e) => setSector(e.target.value)}
          />
          <button type="submit">Guardar perfil de empresa</button>
        </form>
      )}
    </div>
  );
};