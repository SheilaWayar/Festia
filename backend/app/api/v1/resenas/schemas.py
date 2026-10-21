from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class ResenaIn(BaseModel):
    puntaje: int = Field(ge=1, le=5)
    comentario: str | None = Field(default=None, max_length=500)

    @field_validator("comentario")
    @classmethod
    def limpiar(cls, v):
        if v is None:
            return None
        v = v.strip()
        return v or None


class ResenaOut(BaseModel):
    id: int
    salon_id: int
    nombre: str
    puntaje: int
    comentario: str | None = None
    created_at: datetime


class ResenasPagina(BaseModel):
    items: list[ResenaOut]
    total: int
    page: int
    limit: int
    paginas: int
    promedio: float | None = None  # None si todavía no hay reseñas
    cantidad: int


class EstadoResena(BaseModel):
    puede_resenar: bool
    motivo: str | None = None       # por qué no puede (para mostrarlo en pantalla)
    mi_resena: ResenaOut | None = None


class ResumenSalon(BaseModel):
    salon_id: int
    promedio: float | None = None
    cantidad: int