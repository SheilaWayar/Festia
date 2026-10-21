from datetime import datetime, timezone

from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import backref, relationship

from app.core.db import Base


def _ahora() -> datetime:
    # Fecha/hora UTC sin zona (igual que los turnos, que también son "naive")
    return datetime.now(timezone.utc).replace(tzinfo=None)


class ResenaModel(Base):
    """Reseña de un usuario sobre un salón. Una sola por usuario y salón."""

    __tablename__ = "resenas_salon"
    __table_args__ = (
        UniqueConstraint("salon_id", "usuario_id", name="uq_resena_salon_usuario"),
        CheckConstraint("puntaje >= 1 AND puntaje <= 5", name="ck_resena_puntaje"),
    )

    id = Column(Integer, primary_key=True, index=True)
    salon_id = Column(
        Integer, ForeignKey("salones.id", ondelete="CASCADE"), nullable=False, index=True
    )
    usuario_id = Column(
        Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True
    )
    puntaje = Column(Integer, nullable=False)  # 1 a 5
    comentario = Column(String, nullable=True)
    created_at = Column(DateTime, default=_ahora, nullable=False)

    # Si se borra el salón o el usuario, se borran sus reseñas. El cascade del ORM
    # lo hace también en SQLite, donde las claves foráneas no se aplican solas.
    salon = relationship(
        "SalonModel",
        backref=backref("resenas", cascade="all, delete-orphan"),
    )
    usuario = relationship(
        "UserModel",
        backref=backref("resenas", cascade="all, delete-orphan"),
    )