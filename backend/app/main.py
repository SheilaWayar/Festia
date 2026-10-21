from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.db import Base, engine, SessionLocal
from app.api.v1.turnos.router import router as turnos_router
from app.api.v1.auth.router import router as auth_router
from app.api.v1.salones.router import router as salones_router, tipos_router

from app.models.turno import TurnoModel  # noqa: F401
from app.models.salon import SalonModel  # noqa: F401
from app.models.salon import TipoEvento  # noqa: F401
from app.models.user import UserModel  # noqa: F401
from app.core.security import hashear

Base.metadata.create_all(bind=engine)

def seed_datos():
    db = SessionLocal()
    try:
        if db.query(TipoEvento).count() == 0:
            for n in ["Casamiento", "Cumpleaños", "15 Años", "Corporativo", "Bautismo"]:
                db.add(TipoEvento(nombre=n))
            db.commit()

        # Asegurar que admin@test.com sea admin y pass admin123
        for email in ["admin@test.com", "admin@festia.com"]:
            u = db.query(UserModel).filter(UserModel.email == email).first()
            if not u:
                u = UserModel(nombre="Admin Festia", email=email, password_hash=hashear("admin123"), rol="admin")
                db.add(u)
            else:
                u.password_hash = hashear("admin123")
                u.rol = "admin"
            db.commit()
            print(f">>> Admin OK: {email} / admin123")
    finally:
        db.close()

seed_datos()

app = FastAPI(title="Sistema de Reserva de Salones", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=False, allow_methods=["*"], allow_headers=["*"])
app.include_router(salones_router, prefix="/api/v1/salones", tags=["Salones"])
app.include_router(turnos_router, prefix="/api/v1/turnos", tags=["Turnos"])
app.include_router(auth_router, prefix="/api/v1")
app.include_router(tipos_router, prefix="/api/v1/tipos-evento", tags=["Tipos de evento"])

@app.get("/")
def inicio():
    return {"mensaje": "Bienvenido al sistema de reservas de salones"}