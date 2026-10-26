from app.core.db import SessionLocal
from app.models.user import UserModel
from app.core.security import hashear

db = SessionLocal()

email = "admin@festia.com"
password = "admin123"

# borrar si ya existe para recrearlo limpio
existente = db.query(UserModel).filter(UserModel.email == email).first()
if existente:
    db.delete(existente)
    db.commit()

admin = UserModel(
    nombre="Admin Festia",
    email=email,
    password_hash=hashear(password),
    rol="admin"
)

db.add(admin)
db.commit()
print(f"ADMIN CREADO -> {email} / {password}")
db.close()