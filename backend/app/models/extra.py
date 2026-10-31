from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.db import Base  

class PagoTurnoModel(Base):
    __tablename__ = "pagos_turnos"

    id = Column(Integer, primary_key=True, index=True)
    turno_id = Column(Integer, ForeignKey("turnos.id", ondelete="CASCADE"), nullable=False)
    monto_total = Column(Float, nullable=False)
    monto_anticipo = Column(Float, nullable=False)
    porcentaje_anticipo = Column(Integer, nullable=False)  # 20 o 50
    estado_pago = Column(String, default="pendiente", nullable=False)  # 'pendiente', 'anticipo_pagado', 'pagado_total'
    estado_deposito = Column(String, default="pendiente", nullable=False)  # 'pendiente', 'liberado', 'retenido'
    comentario_deposito = Column(Text, nullable=True)
    fecha_actualizacion = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)




class CalificacionUsuarioModel(Base):
    __tablename__ = "calificaciones_usuarios"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    salon_id = Column(Integer, ForeignKey("salones.id", ondelete="CASCADE"), nullable=False)
    turno_id = Column(Integer, ForeignKey("turnos.id", ondelete="CASCADE"), nullable=False)
    puntuacion = Column(Integer, nullable=False)  # 1 a 5
    comentario = Column(Text, nullable=True)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)


class NotificacionModel(Base):
    __tablename__ = "notificaciones"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    titulo = Column(String, nullable=True)  # Se cambió a nullable=True por si no viene título
    mensaje = Column(Text, nullable=False)
    leida = Column(Boolean, default=False, nullable=False)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)
    tipo_notificacion = Column(String, nullable=False)
    turno_id = Column(Integer, ForeignKey("turnos.id", ondelete="SET NULL"), nullable=True)