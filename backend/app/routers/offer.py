from fastapi import APIRouter, HTTPException, status
from app.core.database import get_database
from app.models.offer import (
    OfferCreate,
    OfferResponse,
    OfferUpdate,
    StatusUpdateRequest,
)
from app.crud import offer_crud

router = APIRouter(
    prefix="/ofertas",
    tags=["Ofertas (Productos y Servicios)"],
)


@router.post("/", response_model=OfferResponse, status_code=status.HTTP_201_CREATED)
async def crear_oferta(oferta_in: OfferCreate): 
    db = get_database()
    return await offer_crud.create_offer(db, oferta_in)


@router.get("/", response_model=list[OfferResponse])
async def obtener_feed_ofertas(limit: int = 100):
    db = get_database()
    return await offer_crud.get_all_active_offers(db, limit)


@router.get("/usuario/{usuario_id}", response_model=list[OfferResponse])
async def obtener_historial_ofertas(usuario_id: str, limit: int = 50):
    db = get_database()
    return await offer_crud.get_offers_by_user(db, usuario_id, limit)


@router.patch("/{offer_id}", response_model=OfferResponse)
async def editar_oferta(offer_id: str, datos_in: OfferUpdate):
    db = get_database()
    oferta = await offer_crud.update_offer(
        db, offer_id, datos_in.model_dump(exclude_unset=True)
    )
    if not oferta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Oferta no encontrada."
        )
    return oferta


@router.patch("/{offer_id}/estado", response_model=OfferResponse)
async def cambiar_estado_oferta(offer_id: str, estado_in: StatusUpdateRequest):
    db = get_database()
    oferta = await offer_crud.toggle_offer_status(db, offer_id, estado_in.publicado)
    if not oferta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Oferta no encontrada."
        )
    return oferta


@router.patch("/{offer_id}/eliminar", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_oferta(offer_id: str):
    db = get_database()
    eliminado = await offer_crud.soft_delete_offer(db, offer_id)
    if not eliminado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Oferta no encontrada."
        )