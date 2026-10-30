
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import {
    obtenerPerfilCompleto,
    actualizarPerfil,
    actualizarPerfilEstudiante,
    actualizarPerfilEmpresa,
} from "../services/api";

const inputClass =
    "w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-black placeholder:text-gray-500 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

const labelClass =
    "block text-sm font-semibold text-gray-800 mb-1.5";

const tituloSeccion =
    "text-lg font-bold text-black border-b border-gray-200 pb-3 mb-5";

const camposDireccion: { nombre: string; etiqueta: string }[] = [
    { nombre: "pais", etiqueta: "País" },
    { nombre: "estado", etiqueta: "Estado" },
    { nombre: "municipio", etiqueta: "Municipio" },
    { nombre: "colonia", etiqueta: "Colonia" },
    { nombre: "calle", etiqueta: "Calle" },
    { nombre: "numero_exterior", etiqueta: "Número exterior" },
    { nombre: "numero_interior", etiqueta: "Número interior" },
    { nombre: "codigo_postal", etiqueta: "Código postal" },
];

export default function EditarPerfil() {
    const { user, recargarPerfil } = useAuth();
    const navigate = useNavigate();

    const tipoCuenta =
        user?.tipo_cuenta || user?.tipo_cuenta_principal || "";

    const [form, setForm] = useState<any>({
        nombres: "",
        apellido_paterno: "",
        apellido_materno: "",
        telefono: "",
        foto_perfil: "",

        direccion: {
            pais: "México",
            estado: "",
            municipio: "",
            colonia: "",
            calle: "",
            numero_exterior: "",
            numero_interior: "",
            codigo_postal: "",
        },

        carrera: "",
        semestre: "",
        habilidades: [],
        intereses: [],
        descripcion: "",

        nombre_empresa: "",
        categoria: "",
        servicios: "",
        descripcion_empresa: "",
        telefono_empresa: "",
    });

    const [cargando, setCargando] = useState(false);
    const [cargandoPerfil, setCargandoPerfil] = useState(true);
    const [mensaje, setMensaje] = useState("");
    const [errorCarga, setErrorCarga] = useState("");

    useEffect(() => {
        let activo = true;

        const cargar = async () => {
            const userId = user?.id || user?._id;

            if (!userId) {
                setCargandoPerfil(false);
                return;
            }

            try {
                setCargandoPerfil(true);
                setErrorCarga("");

                const data = await obtenerPerfilCompleto(userId);

                if (!activo) return;

                const usuario = data?.usuario || {};
                const perfil = data?.perfil_especifico || {};
                const direccion = usuario.direccion || {};

                setForm({
                    nombres: usuario.nombres || "",
                    apellido_paterno: usuario.apellido_paterno || "",
                    apellido_materno: usuario.apellido_materno || "",
                    telefono: usuario.telefono || "",
                    foto_perfil: usuario.foto_perfil || "",

                    direccion: {
                        pais: direccion.pais || "México",
                        estado: direccion.estado || "",
                        municipio: direccion.municipio || "",
                        colonia: direccion.colonia || "",
                        calle: direccion.calle || "",
                        numero_exterior: direccion.numero_exterior || "",
                        numero_interior: direccion.numero_interior || "",
                        codigo_postal: direccion.codigo_postal || "",
                    },

                    carrera: perfil.carrera || "",
                    semestre: perfil.semestre || "",
                    habilidades: Array.isArray(perfil.habilidades)
                        ? perfil.habilidades
                        : [],
                    intereses: Array.isArray(perfil.intereses)
                        ? perfil.intereses
                        : [],
                    descripcion: perfil.descripcion || "",

                    nombre_empresa: perfil.nombre_empresa || "",
                    categoria: perfil.categoria || "",
                    servicios: perfil.servicios || "",
                    descripcion_empresa:
                        perfil.descripcion_empresa ||
                        perfil.descripcion ||
                        "",
                    telefono_empresa: perfil.telefono_empresa || "",
                });
            } catch (error) {
                console.error("Error cargando perfil:", error);

                if (activo) {
                    setErrorCarga(
                        "No se pudo cargar el perfil. Verifica la conexión con el servicio."
                    );
                }
            } finally {
                if (activo) setCargandoPerfil(false);
            }
        };

        cargar();

        return () => {
            activo = false;
        };
    }, [user]);

    const cambiarDato = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;

        setForm((anterior: any) => ({
            ...anterior,
            [name]: value,
        }));
    };

    const cambiarDireccion = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const { name, value } = e.target;

        setForm((anterior: any) => ({
            ...anterior,
            direccion: {
                ...anterior.direccion,
                [name]: value,
            },
        }));
    };

    const cambiarLista = (campo: string, valor: string) => {
        setForm((anterior: any) => ({
            ...anterior,
            [campo]: valor
                .split(",")
                .map((elemento) => elemento.trim())
                .filter(Boolean),
        }));
    };

    const guardarCambios = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();

        const userId = user?.id || user?._id;

        if (!userId) {
            setMensaje("No se encontró el identificador del usuario.");
            return;
        }

        try {
            setCargando(true);
            setMensaje("");

            // ACTUALIZAR INFORMACIÓN PERSONAL
            await actualizarPerfil(userId, {
                nombres: form.nombres,
                apellido_paterno: form.apellido_paterno,
                apellido_materno: form.apellido_materno,
                telefono: form.telefono,
                foto_perfil: form.foto_perfil,
                direccion: form.direccion,
            });

            // ACTUALIZAR PERFIL DEL ESTUDIANTE
            if (tipoCuenta === "estudiante") {
                await actualizarPerfilEstudiante(userId, {
                    carrera: form.carrera,
                    semestre: form.semestre,
                    habilidades: form.habilidades,
                    intereses: form.intereses,
                    descripcion: form.descripcion,
                });
            }

            // ACTUALIZAR PERFIL DEL NEGOCIO
            if (tipoCuenta === "proveedor") {
                await actualizarPerfilEmpresa(userId, {
                    nombre_empresa: form.nombre_empresa,
                    categoria: form.categoria,
                    servicios: form.servicios,
                    descripcion: form.descripcion_empresa,
                    telefono_empresa: form.telefono_empresa,
                });
            }

            await recargarPerfil(userId);

            setMensaje("Perfil actualizado correctamente.");

            window.setTimeout(() => {
                navigate("/perfil");
            }, 1200);
        } catch (error) {
            console.error("Error al actualizar el perfil:", error);
            setMensaje(
                "No se pudo actualizar el perfil. Verifica los datos y la conexión con el servicio."
            );
        } finally {
            setCargando(false);
        }
    };

    if (!user) {
        return (
            <main className="min-h-screen bg-gray-50 flex items-center justify-center p-5">
                <p className="text-black">
                    No hay una sesión de usuario disponible.
                </p>
            </main>
        );
    }

    if (cargandoPerfil) {
        return (
            <main className="min-h-screen bg-gray-50 flex items-center justify-center p-5">
                <p className="text-gray-800 font-medium">
                    Cargando información del perfil...
                </p>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6">
            <div className="max-w-4xl mx-auto">
                <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sm:p-8 text-black">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-black">
                            Editar perfil
                        </h1>

                        <p className="mt-2 text-gray-700">
                            Actualiza tus datos para mantener tu perfil de
                            BizCerca al día.
                        </p>

                        <p className="mt-4 text-sm text-gray-800">
                            Tipo de cuenta:{" "}
                            <span className="font-bold text-blue-800 capitalize">
                                {tipoCuenta || "Sin información"}
                            </span>
                        </p>
                    </div>

                    {errorCarga && (
                        <div
                            role="alert"
                            className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 text-red-800"
                        >
                            {errorCarga}
                        </div>
                    )}

                    <form onSubmit={guardarCambios} className="space-y-8">
                        {/* INFORMACIÓN PERSONAL */}
                        <section>
                            <h2 className={tituloSeccion}>
                                Información personal
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label
                                        htmlFor="nombres"
                                        className={labelClass}
                                    >
                                        Nombre(s)
                                    </label>
                                    <input
                                        id="nombres"
                                        name="nombres"
                                        value={form.nombres}
                                        onChange={cambiarDato}
                                        placeholder="Escribe tu nombre"
                                        className={inputClass}
                                        required
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="apellido_paterno"
                                        className={labelClass}
                                    >
                                        Apellido paterno
                                    </label>
                                    <input
                                        id="apellido_paterno"
                                        name="apellido_paterno"
                                        value={form.apellido_paterno}
                                        onChange={cambiarDato}
                                        placeholder="Apellido paterno"
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="apellido_materno"
                                        className={labelClass}
                                    >
                                        Apellido materno
                                    </label>
                                    <input
                                        id="apellido_materno"
                                        name="apellido_materno"
                                        value={form.apellido_materno}
                                        onChange={cambiarDato}
                                        placeholder="Apellido materno"
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="telefono"
                                        className={labelClass}
                                    >
                                        Teléfono
                                    </label>
                                    <input
                                        id="telefono"
                                        name="telefono"
                                        type="tel"
                                        value={form.telefono}
                                        onChange={cambiarDato}
                                        placeholder="Tu número de teléfono"
                                        className={inputClass}
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label
                                        htmlFor="foto_perfil"
                                        className={labelClass}
                                    >
                                        URL de foto de perfil
                                    </label>
                                    <input
                                        id="foto_perfil"
                                        name="foto_perfil"
                                        type="url"
                                        value={form.foto_perfil}
                                        onChange={cambiarDato}
                                        placeholder="https://ejemplo.com/foto.jpg"
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                        </section>

                        {/* DIRECCIÓN */}
                        <section>
                            <h2 className={tituloSeccion}>Dirección</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {camposDireccion.map((campo) => (
                                    <div key={campo.nombre}>
                                        <label
                                            htmlFor={`direccion-${campo.nombre}`}
                                            className={labelClass}
                                        >
                                            {campo.etiqueta}
                                        </label>

                                        <input
                                            id={`direccion-${campo.nombre}`}
                                            name={campo.nombre}
                                            value={
                                                form.direccion[campo.nombre] || ""
                                            }
                                            onChange={cambiarDireccion}
                                            placeholder={campo.etiqueta}
                                            className={inputClass}
                                        />
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* DATOS DEL ESTUDIANTE */}
                        {tipoCuenta === "estudiante" && (
                            <section>
                                <h2 className={tituloSeccion}>
                                    Información del estudiante
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label
                                            htmlFor="carrera"
                                            className={labelClass}
                                        >
                                            Carrera
                                        </label>
                                        <input
                                            id="carrera"
                                            name="carrera"
                                            value={form.carrera}
                                            onChange={cambiarDato}
                                            placeholder="Tu carrera"
                                            className={inputClass}
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="semestre"
                                            className={labelClass}
                                        >
                                            Semestre
                                        </label>
                                        <input
                                            id="semestre"
                                            name="semestre"
                                            value={form.semestre}
                                            onChange={cambiarDato}
                                            placeholder="Tu semestre"
                                            className={inputClass}
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="habilidades"
                                            className={labelClass}
                                        >
                                            Habilidades
                                        </label>
                                        <input
                                            id="habilidades"
                                            value={form.habilidades.join(", ")}
                                            onChange={(e) =>
                                                cambiarLista(
                                                    "habilidades",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Ej. programación, diseño"
                                            className={inputClass}
                                        />
                                        <p className="mt-1 text-sm text-gray-600">
                                            Separa cada habilidad con una coma.
                                        </p>
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="intereses"
                                            className={labelClass}
                                        >
                                            Intereses
                                        </label>
                                        <input
                                            id="intereses"
                                            value={form.intereses.join(", ")}
                                            onChange={(e) =>
                                                cambiarLista(
                                                    "intereses",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Tus intereses"
                                            className={inputClass}
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label
                                            htmlFor="descripcion"
                                            className={labelClass}
                                        >
                                            Descripción
                                        </label>
                                        <textarea
                                            id="descripcion"
                                            name="descripcion"
                                            value={form.descripcion}
                                            onChange={cambiarDato}
                                            placeholder="Cuéntanos sobre ti"
                                            rows={4}
                                            className={inputClass}
                                        />
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* DATOS DE EMPRESA */}
                        {tipoCuenta === "proveedor" && (
                            <section>
                                <h2 className={tituloSeccion}>
                                    Información de la empresa o negocio
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label
                                            htmlFor="nombre_empresa"
                                            className={labelClass}
                                        >
                                            Nombre de empresa o negocio
                                        </label>
                                        <input
                                            id="nombre_empresa"
                                            name="nombre_empresa"
                                            value={form.nombre_empresa}
                                            onChange={cambiarDato}
                                            placeholder="Nombre del negocio"
                                            className={inputClass}
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="categoria"
                                            className={labelClass}
                                        >
                                            Categoría
                                        </label>
                                        <input
                                            id="categoria"
                                            name="categoria"
                                            value={form.categoria}
                                            onChange={cambiarDato}
                                            placeholder="Categoría del negocio"
                                            className={inputClass}
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="servicios"
                                            className={labelClass}
                                        >
                                            Servicios o productos
                                        </label>
                                        <input
                                            id="servicios"
                                            name="servicios"
                                            value={form.servicios}
                                            onChange={cambiarDato}
                                            placeholder="Servicios que ofreces"
                                            className={inputClass}
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="telefono_empresa"
                                            className={labelClass}
                                        >
                                            Teléfono de empresa
                                        </label>
                                        <input
                                            id="telefono_empresa"
                                            name="telefono_empresa"
                                            type="tel"
                                            value={form.telefono_empresa}
                                            onChange={cambiarDato}
                                            placeholder="Teléfono del negocio"
                                            className={inputClass}
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label
                                            htmlFor="descripcion_empresa"
                                            className={labelClass}
                                        >
                                            Descripción
                                        </label>
                                        <textarea
                                            id="descripcion_empresa"
                                            name="descripcion_empresa"
                                            value={form.descripcion_empresa}
                                            onChange={cambiarDato}
                                            placeholder="Describe tu negocio y lo que ofreces"
                                            rows={4}
                                            className={inputClass}
                                        />
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* MENSAJE */}
                        {mensaje && (
                            <div
                                role="status"
                                className={`rounded-lg border p-4 text-sm font-medium ${
                                    mensaje.includes("correctamente")
                                        ? "border-green-300 bg-green-50 text-green-800"
                                        : "border-red-300 bg-red-50 text-red-800"
                                }`}
                            >
                                {mensaje}
                            </div>
                        )}

                        {/* ACCIONES */}
                        <div className="flex flex-col-reverse sm:flex-row gap-3 border-t border-gray-200 pt-6">
                            <Link
                                to="/perfil"
                                className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-800 hover:bg-gray-100 transition-colors"
                            >
                                Cancelar
                            </Link>

                            <button
                                type="submit"
                                disabled={cargando || Boolean(errorCarga)}
                                className="inline-flex items-center justify-center rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
                            >
                                {cargando
                                    ? "Guardando cambios..."
                                    : "Guardar cambios"}
                            </button>
                        </div>
                    </form>
                </section>
            </div>
        </main>
    );
}
