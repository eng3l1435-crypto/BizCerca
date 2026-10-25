from fastapi import APIRouter, HTTPException, status

from app.core.database import get_database
from app.models.contact import ContactCreate, ContactResponse, ContactStatusRequest
from app.crud import contact_crud

router = APIRouter(
    prefix="/contactos", 
    tags=["Peticiones de Contacto"]
    )

@router.post("/", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
async def enviar_peticion(contacto_in: ContactCreate):
    db = get_database()
    return await contact_crud.create_contact(db, contacto_in)

@router.get("/recibidos/{receptor_id}", response_model=list[ContactResponse])
async def ver_bandeja_entrada(receptor_id: str, limit: int = 50):
    db = get_database()
    return await contact_crud.get_pending_contacts(db, receptor_id, limit)

@router.get("/enviados/{emisor_id}", response_model=list[ContactResponse])
async def ver_bandeja_salida(emisor_id: str, limit: int = 50):
    db = get_database()
    return await contact_crud.get_sent_contacts(db, emisor_id, limit)

@router.patch("/{contact_id}/estado", response_model=ContactResponse)
async def responder_peticion(contact_id: str, estado_in: ContactStatusRequest):
    db = get_database()
    contacto = await contact_crud.update_contact_status(db, contact_id, estado_in.estado)
    if not contacto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Petición no encontrada.")
    return contacto