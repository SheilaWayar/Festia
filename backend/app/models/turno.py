from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.core.db import Base


class TurnoModel(Base):
    __tablename__ = "turnos"

    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    salon_id = Column(Integer, ForeignKey("salones.id"), nullable=False)
    fecha_inicio = Column(DateTime, nullable=False)
    fecha_fin = Column(DateTime, nullable=False)
    tipo_evento = Column(String, nullable=True)
    estado = Column(String, default="pendiente")  # pendiente | confirmado | cancelado

    salon = relationship("SalonModel")
    cliente = relationship("UserModel")