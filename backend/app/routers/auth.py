from fastapi import APIRouter, HTTPException, status

from app.core.database import get_database
from app.core.security import verify_password
from app.models.user import UserCreate, UserResponse, LoginRequest, VerificarCorreoRequest
from app.crud import user_crud

router = APIRouter(
    prefix="/auth", 
    tags=["Autenticación"]
    )

@router.post("/registro", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def registrar_usuario(usuario_in: UserCreate):
    db = get_database()
    return await user_crud.create_user(db, usuario_in)

@router.post("/login")
async def iniciar_sesion(credenciales: LoginRequest):
    db = get_database()
    usuario = await user_crud.get_user_by_email(db, credenciales.correo)
    
    if not usuario or not verify_password(credenciales.contrasena, usuario["contrasena"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas."
        )

    return {
        "status": "Autenticado",
        "usuario_id": str(usuario["_id"]),
        "correo_verificado": usuario.get("correo_verificado", False)
    }

@router.post("/verificar-correo")
async def verificar_correo(datos: VerificarCorreoRequest):
    db = get_database()
    resultado = await user_crud.verify_user_email(db, datos.correo)

    if resultado.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado.")
    return {"mensaje": "Correo verificado exitosamente."}