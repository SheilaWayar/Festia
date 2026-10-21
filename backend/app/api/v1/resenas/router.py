from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import get_current_user, require_admin
from app.models.salon import SalonModel
from app.api.v1.resenas.schemas import (
    EstadoResena,
    ResenaIn,
    ResenaOut,
    ResenasPagina,
    ResumenSalon,
)
from app.api.v1.resenas import repository as repo

router = APIRouter()          # main.py lo monta en /api/v1/salones
resumen_router = APIRouter()  # main.py lo monta en /api/v1/resenas

MSG_SIN_TURNO = "Solo podés reseñar un salón en el que tuviste un turno confirmado"
MSG_YA_RESENIO = "Ya reseñaste este salón. Podés editar tu reseña."


def _salon_o_404(db: Session, salon_id: int) -> None:
    if not db.get(SalonModel, salon_id):
        raise HTTPException(status_code=404, detail="Salón no encontrado")


# ---------- Públicas ----------

@router.get("/{salon_id}/resenas", response_model=ResenasPagina)
def listar_resenas(
    salon_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(3, ge=1, le=50),
    db: Session = Depends(get_db),
):
    _salon_o_404(db, salon_id)
    filas, total, paginas = repo.listar_pagina(db, salon_id, page, limit)
    promedio, cantidad = repo.resumen_de_salon(db, salon_id)
    return {
        "items": [repo.a_respuesta(r) for r in filas],
        "total": total,
        "page": page,
        "limit": limit,
        "paginas": paginas,
        "promedio": promedio,
        "cantidad": cantidad,
    }


@resumen_router.get("/resumen", response_model=list[ResumenSalon])
def resumen_todos(db: Session = Depends(get_db)):
    """Promedio y cantidad por salón (para mostrar estrellas en las cards).
    Solo trae los salones que tienen al menos una reseña."""
    return repo.resumen_de_todos(db)


# ---------- Usuario logueado ----------

@router.get("/{salon_id}/resenas/estado", response_model=EstadoResena)
def estado_para_resenar(
    salon_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Le dice al frontend si el usuario puede reseñar y si ya lo hizo."""
    _salon_o_404(db, salon_id)
    mia = repo.obtener_de_usuario(db, salon_id, user.id)
    if mia:
        return {"puede_resenar": False, "motivo": MSG_YA_RESENIO, "mi_resena": repo.a_respuesta(mia)}
    if not repo.tuvo_turno_confirmado(db, salon_id, user.id):
        return {"puede_resenar": False, "motivo": MSG_SIN_TURNO, "mi_resena": None}
    return {"puede_resenar": True, "motivo": None, "mi_resena": None}


@router.post("/{salon_id}/resenas", response_model=ResenaOut, status_code=201)
def crear_resena(
    salon_id: int,
    data: ResenaIn,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    _salon_o_404(db, salon_id)
    if repo.obtener_de_usuario(db, salon_id, user.id):
        raise HTTPException(status_code=409, detail=MSG_YA_RESENIO)
    if not repo.tuvo_turno_confirmado(db, salon_id, user.id):
        raise HTTPException(status_code=403, detail=MSG_SIN_TURNO)
    try:
        r = repo.crear(db, salon_id, user.id, data)
    except IntegrityError:  # dos clics a la vez
        db.rollback()
        raise HTTPException(status_code=409, detail=MSG_YA_RESENIO)
    return repo.a_respuesta(r)


@router.put("/{salon_id}/resenas/mia", response_model=ResenaOut)
def editar_mi_resena(
    salon_id: int,
    data: ResenaIn,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    _salon_o_404(db, salon_id)
    r = repo.obtener_de_usuario(db, salon_id, user.id)
    if not r:
        raise HTTPException(status_code=404, detail="Todavía no reseñaste este salón")
    return repo.a_respuesta(repo.actualizar(db, r, data))


# ---------- Solo admin ----------

@router.delete("/{salon_id}/resenas/{resena_id}", status_code=204)
def borrar_resena(
    salon_id: int,
    resena_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    """Borra una reseña inapropiada. Solo admin."""
    r = repo.obtener(db, resena_id)
    if not r or r.salon_id != salon_id:
        raise HTTPException(status_code=404, detail="Reseña no encontrada")
    repo.eliminar(db, r)