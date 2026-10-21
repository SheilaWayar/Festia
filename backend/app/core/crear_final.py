"""Crea el admin y un cliente de prueba SI NO EXISTEN (ya no borra a nadie).

Se corre desde la carpeta backend:   python -m app.core.crear_final
Equivale a la parte de usuarios de:  python -m scripts.seed
"""
from app.core.db import SessionLocal, engine, Base
from app.core.security import hashear
from app.models.salon import SalonModel  # noqa: F401
from app.models.turno import TurnoModel  # noqa: F401
from app.models.user import UserModel

Base.metadata.create_all(bind=engine)
db = SessionLocal()

for nombre, email, clave, rol in [
    ("Admin", "admin@test.com", "admin123", "admin"),
    ("Cliente", "comun@test.com", "comun123", "usuario"),
]:
    if not db.query(UserModel).filter(UserModel.email == email).first():
        db.add(UserModel(nombre=nombre, email=email, password_hash=hashear(clave), rol=rol))

db.commit()
print("Usuarios:")
for u in db.query(UserModel).all():
    print(" ", u.id, u.nombre, u.email, u.rol)
db.close()
