from sqlalchemy.orm import Session

from app.models.salon import SalonModel, TipoEvento
from app.models.turno import TurnoModel
from app.api.v1.salones.schemas import SalonCreate


def obtener_salones(db: Session, capacidad_min: int = 0,
                    tipo_evento: str | None = None, q: str | None = None):
    query = db.query(SalonModel)
    if capacidad_min:
        query = query.filter(SalonModel.capacidad >= capacidad_min)
    if tipo_evento:
        query = query.filter(SalonModel.tipos.any(TipoEvento.nombre == tipo_evento))
    if q:
        like = f"%{q}%"
        query = query.filter(
            SalonModel.nombre.ilike(like)
            | SalonModel.descripcion.ilike(like)
            | SalonModel.direccion.ilike(like)
        )
    return query.order_by(SalonModel.nombre).all()


def obtener_salon(db: Session, salon_id: int):
    return db.get(SalonModel, salon_id)


def tipos_por_nombre(db: Session, nombres: list[str]):
    """Devuelve los TipoEvento con esos nombres y crea los que no existan."""
    tipos = []
    for nombre in dict.fromkeys(nombres):  # saca repetidos y mantiene el orden
        t = db.query(TipoEvento).filter(TipoEvento.nombre == nombre).first()
        if not t:
            t = TipoEvento(nombre=nombre)
            db.add(t)
        tipos.append(t)
    return tipos


def crear_salon(db: Session, data: SalonCreate):
    campos = data.model_dump(exclude={"tipos_evento"})
    salon = SalonModel(**campos, tipos=tipos_por_nombre(db, data.tipos_evento))
    db.add(salon)
    db.commit()
    db.refresh(salon)
    return salon


def actualizar_salon(db: Session, salon: SalonModel, data: SalonCreate):
    for campo, valor in data.model_dump(exclude={"tipos_evento"}).items():
        setattr(salon, campo, valor)
    salon.tipos = tipos_por_nombre(db, data.tipos_evento)
    db.commit()
    db.refresh(salon)
    return salon


def eliminar_salon(db: Session, salon: SalonModel):
    db.query(TurnoModel).filter(TurnoModel.salon_id == salon.id).delete()
    db.delete(salon)
    db.commit()