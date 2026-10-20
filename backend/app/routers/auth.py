from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr

from app.core.database import get_database
from app.core.security import hash_password, verify_password
from app.models.user import UserCreate, UserResponse

router = APIRouter(
    prefix="/auth",
    tags=["Autenticación"]
)


# Esquema simple de Pydantic para la petición de Login
class LoginRequest(BaseModel):
    correo: EmailStr
    contrasena: str


@router.post("/registro", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def registrar_usuario(usuario_in: UserCreate):
    """Registra un nuevo usuario en MongoDB y guarda la contraseña hasheada."""
    db = get_database()
    coleccion_usuarios = db["usuarios"]

    # 1. Validar que el correo no esté registrado previamente
    usuario_existente = await coleccion_usuarios.find_one(
        {"correo_registro": usuario_in.correo_registro}
    )
    if usuario_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo electrónico ya se encuentra registrado."
        )

    # 2. Convertir modelo Pydantic a diccionario
    documento_usuario = usuario_in.model_dump(by_alias=True)

    # 3. Aplicar Hashing a la contraseña
    documento_usuario["contrasena"] = hash_password(usuario_in.contrasena)

    # 4. Asignar estado inicial de verificación
    documento_usuario["correo_verificado"] = False

    # 5. Insertar en MongoDB
    resultado = await coleccion_usuarios.insert_one(documento_usuario)

    # 6. Recuperar y retornar el usuario formateado con UserResponse
    usuario_creado = await coleccion_usuarios.find_one({"_id": resultado.inserted_id})
    # Pydantic (UserResponse) se encarga de convertir _id (ObjectId) a string automáticamente
    return usuario_creado


@router.post("/login")
async def iniciar_sesion(credenciales: LoginRequest):
    """Verifica las credenciales del usuario usando verify_password."""
    db = get_database()
    coleccion_usuarios = db["usuarios"]

    # 1. Buscar el usuario por su correo
    usuario = await coleccion_usuarios.find_one(
        {"correo_registro": credenciales.correo}
    )
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas (correo o contraseña inváildos)."
        )

    # 2. Verificar la contraseña usando security.py
    es_valida = verify_password(credenciales.contrasena, usuario["contrasena"])
    if not es_valida:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas (correo o contraseña inválidos)."
        )

    # 3. Respuesta exitosa
    return {
        "status": "Autenticado",
        "mensaje": "Inicio de sesión exitoso",
        "usuario_id": str(usuario["_id"]),
        "correo_verificado": usuario.get("correo_verificado", False)
    }


@router.post("/verificar-correo")
async def verificar_correo(correo: EmailStr):
    """Simula la verificación cambiando el campo correo_verificado a True."""
    db = get_database()
    coleccion_usuarios = db["usuarios"]

    resultado = await coleccion_usuarios.update_one(
        {"correo_registro": correo},
        {"$set": {"correo_verificado": True}}
    )

    if resultado.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado."
        )

    return {"mensaje": "Correo verificado exitosamente."}