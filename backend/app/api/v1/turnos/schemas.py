from datetime import date, time

from pydantic import BaseModel, model_validator


class TurnoCreate(BaseModel):
    salon_id: int
    fecha: date
    hora_inicio: time
    hora_fin: time
    tipo_evento: str | None = None

    @model_validator(mode="after")
    def validar_horas(self):
        if self.hora_fin <= self.hora_inicio:
            raise ValueError("hora_fin debe ser posterior a hora_inicio")
        return self


class TurnoResponse(BaseModel):
    id: int
    salon_id: int
    salon_nombre: str | None = None
    usuario_email: str | None = None
    fecha: date
    hora_inicio: time
    hora_fin: time
    tipo_evento: str | None = None
    estado: str


class EstadoIn(BaseModel):
    estado: str  # pendiente | confirmado | cancelado