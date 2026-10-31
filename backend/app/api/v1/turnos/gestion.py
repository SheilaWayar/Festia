from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.api.v1.turnos.reglas import ahora_ar
from app.core.db import get_db
from app.core.deps import require_admin, verificar_admin_de_salon
from app.core.notificaciones import notificar
from app.models.salon_admin import SalonAdminModel
from app.models.turno import TurnoModel
from app.models.user import UserModel

router = APIRouter()  # main.py lo monta en /api/v1/turnos

class RechazoIn(BaseModel):
    motivo: str = Field(min_length=3)

class FinalizarIn(BaseModel):
    deposito: str = Field(pattern="^(liberado|retenido)$")
    comentario: str | None = None

def _cargar(db: Session, turno_id: int, usuario: UserModel) -> TurnoModel:
    turno = db.get(TurnoModel, turno_id)
    if not turno:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    
    asignado = db.query(SalonAdminModel).filter(SalonAdminModel.admin_id == usuario.id).first()
    if usuario.rol == "superadmin" or asignado:
        verificar_admin_de_salon(db, usuario, turno.salon_id)
    return turno

def _resumen(t: TurnoModel) -> dict:
    return {
        "id": t.id,
        "estado": t.estado,
        "estado_pago": getattr(t, "estado_pago", "pendiente"),
        "estado_deposito": t.estado_deposito,
        "comentario_deposito": t.comentario_deposito,
        "motivo_rechazo": t.motivo_rechazo,
    }

@router.patch("/{turno_id}/confirmar")
def confirmar(turno_id: int, db: Session = Depends(get_db), admin: UserModel = Depends(require_admin)):
    t = _cargar(db, turno_id, admin)
    if t.estado != "pendiente":
        raise HTTPException(status_code=400, detail="Solo se confirman pedidos pendientes")
    
    t.estado = "confirmado"
    notificar(db, t.cliente_id, "confirmado", f"Tu reserva fue confirmada. Ya podés pagar el anticipo de ${t.monto_anticipo:,.0f}.", t.id)
    db.commit()
    return _resumen(t)

@router.patch("/{turno_id}/rechazar")
def rechazar(turno_id: int, datos: RechazoIn, db: Session = Depends(get_db), admin: UserModel = Depends(require_admin)):
    t = _cargar(db, turno_id, admin)
    if t.estado != "pendiente":
        raise HTTPException(status_code=400, detail="Solo se rechazan pedidos pendientes")
    
    t.estado = "rechazado"
    t.motivo_rechazo = datos.motivo.strip()
    notificar(db, t.cliente_id, "rechazado", f"Tu pedido fue rechazado: {t.motivo_rechazo}", t.id)
    db.commit()
    return _resumen(t)

@router.patch("/{turno_id}/finalizar")
def finalizar(turno_id: int, datos: FinalizarIn, db: Session = Depends(get_db), admin: UserModel = Depends(require_admin)):
    t = _cargar(db, turno_id, admin)
    if t.estado != "confirmado":
        raise HTTPException(status_code=400, detail="Solo se finalizan reservas confirmadas")
    
    if t.fecha_fin > ahora_ar():
        raise HTTPException(status_code=400, detail="El evento todavía no terminó")
    
    comentario = (datos.comentario or "").strip()
    if datos.deposito == "retenido" and len(comentario) < 10:
        raise HTTPException(status_code=400, detail="Para no liberar el depósito explicá el motivo (mínimo 10 caracteres)")
    
    t.estado = "finalizado"
    t.estado_deposito = datos.deposito
    t.comentario_deposito = comentario or None
    t.finalizado_at = ahora_ar()
    
    if datos.deposito == "liberado":
        mensaje = "El salón liberó tu depósito."
    else:
        mensaje = f"El salón no liberó tu depósito. Motivo: {comentario}"
    
    notificar(db, t.cliente_id, "deposito_" + datos.deposito, mensaje, t.id)
    db.commit()
    return _resumen(t)