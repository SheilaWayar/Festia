from sqlalchemy import Column, Integer, String, Float, JSON, ForeignKey, Table
from sqlalchemy.orm import relationship

from app.core.db import Base

# Tabla intermedia salón <-> tipo de evento (muchos a muchos)
salon_tipo = Table(
    "salon_tipo_evento",
    Base.metadata,
    Column("salon_id", ForeignKey("salones.id"), primary_key=True),
    Column("tipo_id", ForeignKey("tipos_evento.id"), primary_key=True),
)


class TipoEvento(Base):
    __tablename__ = "tipos_evento"

    id = Column(Integer, primary_key=True)
    nombre = Column(String, unique=True, nullable=False)


class SalonModel(Base):
    __tablename__ = "salones"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    direccion = Column(String, nullable=False)
    capacidad = Column(Integer, nullable=False)
    precio_por_hora = Column(Float, nullable=False)

    # Campos nuevos
    descripcion = Column(String, nullable=True)
    servicios = Column(JSON, default=list)   # ["catering", "sonido"]
    imagenes = Column(JSON, default=list)    # ["https://..."]
    tipos = relationship("TipoEvento", secondary=salon_tipo)

    @property
    def tipos_evento(self) -> list[str]:
        """Lista de nombres, para que el schema la serialice directo."""
        return [t.nombre for t in self.tipos]

# El modelo de turnos NO va acá: vive en app/models/turno.py (TurnoModel).
