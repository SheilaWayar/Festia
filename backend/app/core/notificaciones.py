from sqlalchemy.orm import Session
from app.models.notificacion import NotificacionModel
from app.models.salon_admin import SalonAdminModel

def notificar(db: Session, usuario_id: int, tipo: str, mensaje: str, turno_id: int | None = None) -> None:
    """Agrega la notificación a la sesión; la guarda quien hace commit."""
    db.add(NotificacionModel(usuario_id=usuario_id, tipo=tipo, mensaje=mensaje, turno_id=turno_id))

def notificar_admins_de_salon(db: Session, salon_id: int, tipo: str, mensaje: str, turno_id: int | None = None) -> None:
    filas = db.query(SalonAdminModel).filter(SalonAdminModel.salon_id == salon_id).all()
    for f in filas:
        notificar(db, f.admin_id, tipo, mensaje, turno_id)