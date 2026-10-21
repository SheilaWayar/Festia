import calendar
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import require_admin
from app.models.salon import TipoEvento
from app.models.turno import TurnoModel
from app.api.v1.salones.schemas import SalonCreate, SalonResponse
from app.api.v1.salones import repository as repo

router = APIRouter()        # main.py lo monta en /api/v1/salones
tipos_router = APIRouter()  # main.py lo monta en /api/v1/tipos-evento


# ---------- Públicas ----------

@router.get("", response_model=list[SalonResponse])
def listar_salones(
    capacidad_min: int = 0,
    tipo_evento: str | None = None,
    q: str | None = None,
    db: Session = Depends(get_db),
):
    return repo.obtener_salones(db, capacidad_min, tipo_evento, q)


@router.get("/{salon_id}", response_model=SalonResponse)
def detalle_salon(salon_id: int, db: Session = Depends(get_db)):
    salon = repo.obtener_salon(db, salon_id)
    if not salon:
        raise HTTPException(status_code=404, detail="Salón no encontrado")
    return salon


@router.get("/{salon_id}/disponibilidad")
def disponibilidad(
    salon_id: int,
    mes: str = Query(..., pattern=r"^\d{4}-\d{2}$"),
    db: Session = Depends(get_db),
):
    if not repo.obtener_salon(db, salon_id):
        raise HTTPException(status_code=404, detail="Salón no encontrado")

    anio, nro_mes = int(mes[:4]), int(mes[5:])
    if not 1 <= nro_mes <= 12:
        raise HTTPException(status_code=400, detail="Mes inválido")

    desde = datetime(anio, nro_mes, 1)
    ultimo_dia = calendar.monthrange(anio, nro_mes)[1]
    hasta = datetime(anio, nro_mes, ultimo_dia) + timedelta(days=1)

    turnos = (
        db.query(TurnoModel)
        .filter(
            TurnoModel.salon_id == salon_id,
            TurnoModel.estado != "cancelado",
            TurnoModel.fecha_inicio >= desde,
            TurnoModel.fecha_inicio < hasta,
        )
        .order_by(TurnoModel.fecha_inicio)
        .all()
    )

    return {
        "salon_id": salon_id,
        "mes": mes,
        "ocupados": [
            {
                "fecha": t.fecha_inicio.date().isoformat(),
                "hora_inicio": t.fecha_inicio.strftime("%H:%M"),
                "hora_fin": t.fecha_fin.strftime("%H:%M"),
            }
            for t in turnos
        ],
    }


@tipos_router.get("", response_model=list[str])
def listar_tipos(db: Session = Depends(get_db)):
    return [t.nombre for t in db.query(TipoEvento).order_by(TipoEvento.nombre)]


# ---------- Solo admin ----------

@router.post("", response_model=SalonResponse, status_code=201)
def crear_salon_endpoint(
    salon: SalonCreate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    return repo.crear_salon(db, salon)


@router.put("/{salon_id}", response_model=SalonResponse)
def actualizar_salon_endpoint(
    salon_id: int,
    data: SalonCreate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    salon = repo.obtener_salon(db, salon_id)
    if not salon:
        raise HTTPException(status_code=404, detail="Salón no encontrado")
    return repo.actualizar_salon(db, salon, data)


@router.delete("/{salon_id}", status_code=204)
def eliminar_salon_endpoint(
    salon_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    salon = repo.obtener_salon(db, salon_id)
    if not salon:
        raise HTTPException(status_code=404, detail="Salón no encontrado")
    repo.eliminar_salon(db, salon)
