from app.core.db import SessionLocal
from app.models.salon import TipoEvento

db = SessionLocal()

tipos = ["Casamiento", "Cumpleaños", "15 Años", "Corporativo", "Bautismo"]

for nombre in tipos:
    existe = db.query(TipoEvento).filter_by(nombre=nombre).first()
    if not existe:
        db.add(TipoEvento(nombre=nombre))
        print(f"Creando: {nombre}")

db.commit()
print("¡Tipos creados!")
db.close()