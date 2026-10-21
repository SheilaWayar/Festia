from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import get_current_user, require_admin
from app.models.salon import SalonModel
from app.models.turno import TurnoModel
from app.api.v1.turnos.schemas import TurnoCreate, TurnoResponse, EstadoIn
from app.api.v1.turnos import repository as repo

router = APIRouter()  # main.py lo monta en /api/v1/turnos


@router.post("", response_model=TurnoResponse, status_code=201)
def reservar(
    data: TurnoCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    if not db.get(SalonModel, data.salon_id):
        raise HTTPException(status_code=404, detail="Salón no encontrado")

    if data.fecha < date.today():
        raise HTTPException(status_code=400, detail="No se puede reservar en el pasado")

    inicio = datetime.combine(data.fecha, data.hora_inicio)
    fin = datetime.combine(data.fecha, data.hora_fin)

    if fin <= inicio:
        raise HTTPException(status_code=400, detail="hora_fin debe ser mayor que hora_inicio")

    if repo.hay_superposicion(db, data.salon_id, inicio, fin):
        raise HTTPException(status_code=409, detail="Ese horario ya está ocupado")

    return repo.a_respuesta(repo.crear_turno(db, data, user.id))


@router.get("", response_model=list[TurnoResponse])
def listar_todos(
    salon_id: int | None = None,
    fecha: date | None = None,
    estado: str | None = None,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    """Todos los turnos, con filtros. Solo admin."""
    return [repo.a_respuesta(t) for t in repo.listar_todos(db, salon_id, fecha, estado)]


@router.get("/mios", response_model=list[TurnoResponse])
def mis_turnos(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return [repo.a_respuesta(t) for t in repo.turnos_de_cliente(db, user.id)]


@router.patch("/{turno_id}/estado", response_model=TurnoResponse)
def cambiar_estado(
    turno_id: int,
    data: EstadoIn,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    """Confirmar, cancelar o volver a dejar pendiente un turno. Solo admin."""
    if data.estado not in ("pendiente", "confirmado", "cancelado"):
        raise HTTPException(status_code=400, detail="Estado inválido")
    turno = db.get(TurnoModel, turno_id)
    if not turno:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    turno.estado = data.estado
    db.commit()
    db.refresh(turno)
    return repo.a_respuesta(turno)


@router.delete("/{turno_id}", status_code=204)
def cancelar(
    turno_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    turno = db.get(TurnoModel, turno_id)
    if not turno:
        raise HTTPException(status_code=404, detail="Turno no encontrado")

    if turno.cliente_id != user.id and getattr(user, "rol", None) != "admin":
        raise HTTPException(status_code=403, detail="No podés cancelar este turno")

    # Cancelación lógica: libera el horario y deja historial
    turno.estado = "cancelado"
    db.commit()
