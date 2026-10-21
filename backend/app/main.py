import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.db import Base, engine
from app.api.v1.turnos.router import router as turnos_router
from app.api.v1.auth.router import router as auth_router
from app.api.v1.salones.router import router as salones_router, tipos_router

# Importar los modelos hace que SQLAlchemy conozca todas las tablas antes de crearlas
from app.models.turno import TurnoModel  # noqa: F401
from app.models.salon import SalonModel  # noqa: F401
from app.models.user import UserModel  # noqa: F401

# Crear automáticamente las tablas en la BD si no existen
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Sistema de Reserva de Salones",
    description="API REST modularizada para la gestión de salones y turnos.",
    version="1.0.0",
)

# CORS: por defecto acepta cualquier origen (sirve para desarrollo y para Vercel).
# Para limitarlo en producción, definí FRONTEND_URL en Render (ej: https://mi-app.vercel.app).
frontend_url = os.getenv("FRONTEND_URL")
origenes = [frontend_url, "http://localhost:5173"] if frontend_url else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origenes,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir las rutas
app.include_router(salones_router, prefix="/api/v1/salones", tags=["Salones"])
app.include_router(turnos_router, prefix="/api/v1/turnos", tags=["Turnos"])
app.include_router(auth_router, prefix="/api/v1")
app.include_router(tipos_router, prefix="/api/v1/tipos-evento", tags=["Tipos de evento"])


@app.get("/")
def inicio():
    return {"mensaje": "Bienvenido al sistema de reservas de salones"}
