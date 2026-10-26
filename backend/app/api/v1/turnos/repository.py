from datetime import datetime, time, timedelta

from sqlalchemy.orm import Session

from app.models.turno import TurnoModel
from app.api.v1.turnos.schemas import TurnoCreate

from app.api.v1.turnos.reglas import calcular_montos, verificar_limite, verificar_disponibilidad
from app.core.notificaciones import notificar_admins_de_salon

from app.models.salon import SalonModel


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
        # Nuevos campos de montos y estados requeridos:
        "monto_total": t.monto_total,
        "anticipo_porcentaje": t.anticipo_porcentaje,
        "monto_anticipo": t.monto_anticipo,
        "monto_pagado": t.monto_pagado,
        "estado_pago": t.estado_pago,
        "estado_deposito": t.estado_deposito,
        "comentario_deposito": t.comentario_deposito,
        "motivo_rechazo": t.motivo_rechazo,
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
    # 1. Validar límite de 3 reservas activas y disponibilidad del salón
    verificar_limite(db, cliente_id)
    
    inicio = datetime.combine(data.fecha, data.hora_inicio)
    fin = datetime.combine(data.fecha, data.hora_fin)
    
    verificar_disponibilidad(db, data.salon_id, inicio, fin)

    # 2. Buscar el salón para calcular los montos según su anticipo (20% o 50%)
    salon = db.get(SalonModel, data.salon_id)
    if not salon:
        raise HTTPException(status_code=404, detail="Salón no encontrado")
        
    montos = calcular_montos(salon, inicio, fin)

    # 3. Crear el turno sumando los montos calculados
    turno = TurnoModel(
        cliente_id=cliente_id,
        salon_id=data.salon_id,
        fecha_inicio=inicio,
        fecha_fin=fin,
        tipo_evento=data.tipo_evento,
        estado="pendiente",
        **montos  # Inyecta monto_total, anticipo_porcentaje y monto_anticipo
    )
    db.add(turno)
    db.commit()
    db.refresh(turno)

    # 4. Notificar a los administradores del salón
    notificar_admins_de_salon(db, salon.id, "nueva_solicitud", "Hay un nuevo pedido de reserva", turno.id)
    db.commit()

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