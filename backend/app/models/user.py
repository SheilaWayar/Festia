from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db import Base  

class UserModel(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    rol = Column(String, default="usuario", nullable=False)  # 'usuario', 'admin', 'superadmin'
    activo = Column(Boolean, default=True, nullable=False)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)

    # Relación con salones administrados
    salones_administrados = relationship("SalonAdminModel", back_populates="usuario", cascade="all, delete-orphan")


class SalonAdminModel(Base):
    __tablename__ = "salon_admins"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    salon_id = Column(Integer, ForeignKey("salones.id", ondelete="CASCADE"), nullable=False)

    # Relación hacia el usuario
    usuario = relationship("UserModel", back_populates="salones_administrados")