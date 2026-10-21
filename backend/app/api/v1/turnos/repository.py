from datetime import datetime, time, timedelta

from sqlalchemy.orm import Session

from app.models.turno import TurnoModel
from app.api.v1.turnos.schemas import TurnoCreate


def a_respuesta(t: TurnoModel) -> dict:
    """Convierte un TurnoModel al formato que usa el frontend."""
    return {
        "id": t.id,
        "salon_id": t.salon_id,
        "salon_nombre": t.salon.nombre if t.salon else None,
        "usuario_email": t.cliente.email if t.cliente else None,
        "fecha": t.fecha_inicio.date(),
        "hora_inicio": t.fecha_inicio.time(),
        "hora_fin": t.fecha_fin.time(),
        "tipo_evento": t.tipo_evento,
        "estado": t.estado,
    }


def hay_superposicion(db: Session, salon_id: int, inicio: datetime, fin: datetime) -> bool:
    return (
        db.query(TurnoModel)
        .filter(
            TurnoModel.salon_id == salon_id,
            TurnoModel.estado != "cancelado",
            TurnoModel.fecha_inicio < fin,
            TurnoModel.fecha_fin > inicio,
        )
        .first()
        is not None
    )


def crear_turno(db: Session, data: TurnoCreate, cliente_id: int) -> TurnoModel:
    turno = TurnoModel(
        cliente_id=cliente_id,
        salon_id=data.salon_id,
        fecha_inicio=datetime.combine(data.fecha, data.hora_inicio),
        fecha_fin=datetime.combine(data.fecha, data.hora_fin),
        tipo_evento=data.tipo_evento,
        estado="pendiente",
    )
    db.add(turno)
    db.commit()
    db.refresh(turno)
    return turno


def turnos_de_cliente(db: Session, cliente_id: int):
    return (
        db.query(TurnoModel)
        .filter(TurnoModel.cliente_id == cliente_id)
        .order_by(TurnoModel.fecha_inicio.desc())
        .all()
    )


def listar_todos(db: Session, salon_id=None, fecha=None, estado=None):
    q = db.query(TurnoModel)
    if salon_id:
        q = q.filter(TurnoModel.salon_id == salon_id)
    if fecha:
        desde = datetime.combine(fecha, time.min)
        q = q.filter(
            TurnoModel.fecha_inicio >= desde,
            TurnoModel.fecha_inicio < desde + timedelta(days=1),
        )
    if estado:
        q = q.filter(TurnoModel.estado == estado)
    return q.order_by(TurnoModel.fecha_inicio.desc()).all()