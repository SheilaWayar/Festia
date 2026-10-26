from datetime import datetime
from zoneinfo import ZoneInfo
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.salon import SalonModel
from app.models.turno import TurnoModel

MAX_ACTIVAS = 3
ESTADOS_ACTIVOS = ("pendiente", "confirmado")

def ahora_ar() -> datetime:
    """Hora actual de Argentina, sin zona (igual que se guardan los turnos)."""
    return datetime.now(ZoneInfo("America/Argentina/Buenos_Aires")).replace(tzinfo=None)

def calcular_montos(salon: SalonModel, inicio: datetime, fin: datetime) -> dict:
    horas = (fin - inicio).total_seconds() / 3600
    if horas <= 0:
        raise HTTPException(status_code=400, detail="La hora de fin debe ser posterior a la de inicio")
    total = round(salon.precio_por_hora * horas, 2)
    porcentaje = salon.anticipo_porcentaje or 20
    return {
        "monto_total": total,
        "anticipo_porcentaje": porcentaje,
        "monto_anticipo": round(total * porcentaje / 100, 2),
    }

def verificar_limite(db: Session, cliente_id: int) -> None:
    activas = (
        db.query(TurnoModel)
        .filter(
            TurnoModel.cliente_id == cliente_id,
            TurnoModel.estado.in_(ESTADOS_ACTIVOS),
            TurnoModel.fecha_fin > ahora_ar(),
        )
        .count()
    )
    if activas >= MAX_ACTIVAS:
        raise HTTPException(
            status_code=400,
            detail=f"Ya tenés {MAX_ACTIVAS} reservas activas. Esperá a que termine o cancelá una.",
        )

def verificar_disponibilidad(db: Session, salon_id: int, inicio: datetime, fin: datetime) -> None:
    choque = (
        db.query(TurnoModel)
        .filter(
            TurnoModel.salon_id == salon_id,
            TurnoModel.estado.in_(ESTADOS_ACTIVOS),
            TurnoModel.fecha_inicio < fin,
            TurnoModel.fecha_fin > inicio,
        )
        .first()
    )
    if choque:
        raise HTTPException(status_code=409, detail="El salón ya está reservado en ese horario")