
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PerfilPage() {
    const { user } = useAuth();

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-5">
                <p className="text-gray-800 font-medium">
                    No hay información de usuario disponible.
                </p>
            </div>
        );
    }

    const nombreCompleto = [
        user.nombres,
        user.apellido_paterno,
        user.apellido_materno,
    ]
        .filter(Boolean)
        .join(" ");

    const perfil = user.perfil || {};
    const tipoCuenta = user.tipo_cuenta || user.tipo_cuenta_principal || "";
    const direccion = user.direccion || {};

    const texto = (valor: unknown) => {
        if (valor === undefined || valor === null || valor === "") {
            return "Sin información";
        }

        return String(valor);
    };

    const Campo = ({
        etiqueta,
        valor,
    }: {
        etiqueta: string;
        valor: unknown;
    }) => (
        <div className="min-w-0">
            <p className="text-sm font-medium text-gray-700 mb-1">
                {etiqueta}
            </p>
            <p className="text-base text-black font-semibold break-words">
                {texto(valor)}
            </p>
        </div>
    );

    return (
        <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6">
            <div className="max-w-5xl mx-auto">
                <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sm:p-8 text-black">
                    {/* CABECERA */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-5 mb-8">
                        {user.foto_perfil ? (
                            <img
                                src={user.foto_perfil}
                                alt="Foto de perfil"
                                className="w-20 h-20 rounded-full object-cover border border-gray-200"
                            />
                        ) : (
                            <div className="w-20 h-20 shrink-0 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-3xl font-bold">
                                {user.nombres?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                        )}

                        <div>
                            <h1 className="text-3xl font-bold text-black">
                                Mi perfil
                            </h1>

                            <p className="mt-2 text-gray-700">
                                Tipo de cuenta:{" "}
                                <span className="font-semibold text-blue-800 capitalize">
                                    {texto(tipoCuenta)}
                                </span>
                            </p>

                            <p className="text-sm text-gray-600 mt-1">
                                Consulta tu información personal y los datos de tu cuenta.
                            </p>
                        </div>
                    </div>

                    {/* INFORMACIÓN PERSONAL */}
                    <section className="border-t border-gray-200 pt-6">
                        <h2 className="text-xl font-bold text-black mb-5">
                            Información personal
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                            <Campo etiqueta="Nombre" valor={user.nombres} />

                            <Campo
                                etiqueta="Apellidos"
                                valor={[
                                    user.apellido_paterno,
                                    user.apellido_materno,
                                ]
                                    .filter(Boolean)
                                    .join(" ")}
                            />

                            <Campo
                                etiqueta="Correo electrónico"
                                valor={user.correo || user.correo_registro}
                            />

                            <Campo etiqueta="Teléfono" valor={user.telefono} />

                            <Campo
                                etiqueta="Correo verificado"
                                valor={
                                    user.correo_verificado
                                        ? "Sí"
                                        : "No"
                                }
                            />
                        </div>
                    </section>

                    {/* INFORMACIÓN DEL ESTUDIANTE */}
                    {tipoCuenta === "estudiante" && (
                        <section className="border-t border-gray-200 mt-8 pt-6">
                            <h2 className="text-xl font-bold text-black mb-5">
                                Información del estudiante
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                                <Campo
                                    etiqueta="Carrera"
                                    valor={perfil.carrera}
                                />

                                <Campo
                                    etiqueta="Semestre"
                                    valor={perfil.semestre}
                                />

                                <Campo
                                    etiqueta="Habilidades"
                                    valor={
                                        Array.isArray(perfil.habilidades)
                                            ? perfil.habilidades.join(", ")
                                            : perfil.habilidades
                                    }
                                />

                                <Campo
                                    etiqueta="Intereses"
                                    valor={
                                        Array.isArray(perfil.intereses)
                                            ? perfil.intereses.join(", ")
                                            : perfil.intereses
                                    }
                                />
                            </div>

                            <div className="mt-5">
                                <Campo
                                    etiqueta="Descripción"
                                    valor={perfil.descripcion}
                                />
                            </div>
                        </section>
                    )}

                    {/* INFORMACIÓN DE EMPRESA */}
                    {tipoCuenta === "proveedor" && (
                        <section className="border-t border-gray-200 mt-8 pt-6">
                            <h2 className="text-xl font-bold text-black mb-5">
                                Información de la empresa o negocio
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                                <Campo
                                    etiqueta="Nombre de empresa"
                                    valor={perfil.nombre_empresa}
                                />

                                <Campo
                                    etiqueta="Categoría"
                                    valor={perfil.categoria}
                                />

                                <Campo
                                    etiqueta="Servicios"
                                    valor={perfil.servicios}
                                />

                                <Campo
                                    etiqueta="Teléfono de empresa"
                                    valor={perfil.telefono_empresa}
                                />
                            </div>

                            <div className="mt-5">
                                <Campo
                                    etiqueta="Descripción"
                                    valor={
                                        perfil.descripcion_empresa ||
                                        perfil.descripcion
                                    }
                                />
                            </div>
                        </section>
                    )}

                    {/* DIRECCIÓN */}
                    {user.direccion && (
                        <section className="border-t border-gray-200 mt-8 pt-6">
                            <h2 className="text-xl font-bold text-black mb-5">
                                Dirección
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                                <Campo
                                    etiqueta="País"
                                    valor={direccion.pais}
                                />

                                <Campo
                                    etiqueta="Estado"
                                    valor={direccion.estado}
                                />

                                <Campo
                                    etiqueta="Municipio"
                                    valor={direccion.municipio}
                                />

                                <Campo
                                    etiqueta="Colonia"
                                    valor={direccion.colonia}
                                />

                                <Campo
                                    etiqueta="Calle"
                                    valor={direccion.calle}
                                />

                                <Campo
                                    etiqueta="Número exterior"
                                    valor={direccion.numero_exterior}
                                />

                                <Campo
                                    etiqueta="Número interior"
                                    valor={direccion.numero_interior}
                                />

                                <Campo
                                    etiqueta="Código postal"
                                    valor={direccion.codigo_postal}
                                />
                            </div>
                        </section>
                    )}

                    {/* BOTÓN */}
                    <div className="border-t border-gray-200 mt-8 pt-6">
                        <Link
                            to="/editar-perfil"
                            className="inline-flex items-center justify-center bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-3 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Editar perfil
                        </Link>
                    </div>
                </section>
            </div>
        </main>
    );
}
