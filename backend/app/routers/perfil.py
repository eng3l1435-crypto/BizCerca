# app/routers/perfil.py

from fastapi import APIRouter, HTTPException

from app.core.database import get_database

from app.crud import user_crud

from bson import ObjectId



router = APIRouter(

    prefix="/perfil",

    tags=["Perfil"]

)





# ==================================================
# OBTENER PERFIL COMPLETO
# ==================================================


@router.get("/{usuario_id}")

async def obtener_perfil_completo(

    usuario_id:str

):


    db = get_database()



    usuario = await user_crud.get_user_by_id(

        db,

        usuario_id

    )



    if not usuario:


        raise HTTPException(

            status_code=404,

            detail="Usuario no encontrado"

        )





    respuesta = {


        "usuario":{


            "id":

            str(usuario["_id"]),



            "tipo_cuenta":

            usuario.get(
                "tipo_cuenta",
                ""
            ),



            "nombres":

            usuario.get(
                "nombres",
                ""
            ),



            "apellido_paterno":

            usuario.get(
                "apellido_paterno",
                ""
            ),



            "apellido_materno":

            usuario.get(
                "apellido_materno",
                ""
            ),



            "correo":

            usuario.get(
                "correo_registro",
                ""
            ),



            "telefono":

            usuario.get(
                "telefono",
                ""
            ),



            "foto_perfil":

            usuario.get(
                "foto_perfil",
                ""
            ),



            "direccion":

            usuario.get(
                "direccion",
                None
            )

        },



        "perfil_especifico":None

    }





    tipo = usuario.get(
        "tipo_cuenta"
    )






    # ==========================================
    # ESTUDIANTE
    # ==========================================


    if tipo=="estudiante":



        perfil = await db[
            "estudiantes"
        ].find_one(

            {

            "usuario_id":

            usuario["_id"]

            }

        )



        if perfil:


            perfil["_id"] = str(
                perfil["_id"]
            )


            perfil.pop(
                "usuario_id",
                None
            )


            respuesta["perfil_especifico"] = perfil







    # ==========================================
    # PROVEEDOR
    # ==========================================


    if tipo=="proveedor":



        perfil = await db[
            "empresas_micro_negocios"
        ].find_one(

            {

            "usuario_id":

            usuario["_id"]

            }

        )



        if perfil:


            perfil["_id"] = str(
                perfil["_id"]
            )


            perfil.pop(
                "usuario_id",
                None
            )


            respuesta["perfil_especifico"] = perfil





    return respuesta











# ==================================================
# ACTUALIZAR PERFIL ESTUDIANTE
# ==================================================


@router.patch("/estudiante/{usuario_id}")

async def actualizar_estudiante(

    usuario_id:str,

    datos:dict

):


    db = get_database()



    usuario = await user_crud.get_user_by_id(

        db,

        usuario_id

    )



    if not usuario:


        raise HTTPException(

            status_code=404,

            detail="Usuario no encontrado"

        )




    if usuario.get(
        "tipo_cuenta"
    )!="estudiante":


        raise HTTPException(

            status_code=400,

            detail="El usuario no es estudiante"

        )






    resultado = await db[
        "estudiantes"
    ].update_one(

        {

        "usuario_id":

        usuario["_id"]

        },


        {

        "$set":

        datos

        }

    )





    # si no existe perfil estudiante lo crea


    if resultado.matched_count==0:


        await db[
            "estudiantes"
        ].insert_one(

            {

            "usuario_id":

            usuario["_id"],


            **datos

            }

        )





    return {


        "mensaje":

        "Perfil estudiante actualizado"

    }









# ==================================================
# ACTUALIZAR PERFIL EMPRESA
# ==================================================


@router.patch("/proveedor/{usuario_id}")

async def actualizar_proveedor(

    usuario_id:str,

    datos:dict

):


    db = get_database()



    usuario = await user_crud.get_user_by_id(

        db,

        usuario_id

    )



    if not usuario:


        raise HTTPException(

            status_code=404,

            detail="Usuario no encontrado"

        )





    if usuario.get(
        "tipo_cuenta"
    )!="proveedor":


        raise HTTPException(

            status_code=400,

            detail="El usuario no es proveedor"

        )





    resultado = await db[

        "empresas_micro_negocios"

    ].update_one(


        {

        "usuario_id":

        usuario["_id"]

        },


        {

        "$set":

        datos

        }

    )





    if resultado.matched_count==0:


        await db[

            "empresas_micro_negocios"

        ].insert_one(

            {


            "usuario_id":

            usuario["_id"],


            **datos


            }

        )





    return {


        "mensaje":

        "Perfil empresa actualizado"

    }