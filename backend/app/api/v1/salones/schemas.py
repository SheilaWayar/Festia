from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional

class SalonCreate(BaseModel):
    nombre: str
    direccion: str
    capacidad: int
    precio_por_hora: float
    descripcion: str | None = None
    servicios: list[str] = []
    imagenes: list[str] = []
    tipos_evento: list[str] = []

class SalonResponse(SalonCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int

    @field_validator('servicios', 'imagenes', 'tipos_evento', mode='before')
    @classmethod
    def none_to_list(cls, v):
        if v is None:
            return []
        return v