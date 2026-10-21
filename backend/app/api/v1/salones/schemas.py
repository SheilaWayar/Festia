from pydantic import BaseModel, ConfigDict


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