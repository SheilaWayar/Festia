"""Carga datos de prueba: tipos de evento, salones y dos usuarios.

Se corre desde la carpeta backend:   python -m scripts.seed
Se puede correr las veces que quieras: no duplica nada.
(Para usar Supabase, definí antes la variable DATABASE_URL en esa terminal.)
"""
from app.core.db import Base, SessionLocal, engine
from app.core.security import hashear
from app.models.salon import SalonModel, TipoEvento
from app.models.turno import TurnoModel  # noqa: F401  (registra la tabla)
from app.models.user import UserModel

FOTO_1 = "https://images.unsplash.com/photo-1670529776180-60e4132ab90c?auto=format&fit=crop&w=1400&q=85"
FOTO_2 = "https://images.unsplash.com/photo-1670529776286-f426fb7ba42c?auto=format&fit=crop&w=1400&q=85"


def foto(nombre):
    return f"https://picsum.photos/seed/{nombre}/1400/900"


TIPOS = ["cumpleaños", "casamiento", "empresarial", "quince", "infantil"]

# Para cambiar fotos o textos: editá esta lista, borrá salones.db y volvé a correr el script.
SALONES = [
    dict(
        nombre="Salón Aurora",
        descripcion="Amplio y luminoso, ideal para bodas y fiestas de quince. Pista de baile central y jardín de invierno.",
        direccion="Av. Belgrano 1200, Salta",
        capacidad=200,
        precio_por_hora=60000,
        servicios=["catering", "sonido", "estacionamiento", "pista de baile"],
        imagenes=[FOTO_1, FOTO_2, foto("aurora")],
        tipos=["casamiento", "quince"],
    ),
    dict(
        nombre="Salón Cumbres",
        descripcion="Cálido y moderno, pensado para reuniones, lanzamientos y celebraciones íntimas.",
        direccion="Mitre 340, Salta",
        capacidad=80,
        precio_por_hora=30000,
        servicios=["sonido", "proyector", "wifi"],
        imagenes=[FOTO_2, FOTO_1, foto("cumbres")],
        tipos=["empresarial", "cumpleaños"],
    ),
    dict(
        nombre="Quinta Los Aromos",
        descripcion="Quinta con parque, pileta y parrilla. Perfecta para cumpleaños y fiestas al aire libre.",
        direccion="Ruta 51 km 5, Salta",
        capacidad=120,
        precio_por_hora=45000,
        servicios=["catering", "estacionamiento", "parrilla", "pileta"],
        imagenes=[FOTO_1, foto("aromos"), FOTO_2],
        tipos=["cumpleaños", "casamiento", "infantil"],
    ),
    dict(
        nombre="Terraza Altos del Valle",
        descripcion="Terraza panorámica con vista a los cerros. Ideal para eventos corporativos y brindis.",
        direccion="Caseros 780, Salta",
        capacidad=60,
        precio_por_hora=38000,
        servicios=["sonido", "bar", "wifi"],
        imagenes=[foto("altos"), FOTO_2, FOTO_1],
        tipos=["empresarial", "cumpleaños"],
    ),
]

USUARIOS = [
    dict(nombre="Admin", email="admin@test.com", password="admin123", rol="admin"),
    dict(nombre="Cliente", email="comun@test.com", password="comun123", rol="usuario"),
]


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Tipos de evento (los que falten)
        tipos = {}
        for nombre in TIPOS:
            t = db.query(TipoEvento).filter(TipoEvento.nombre == nombre).first()
            if not t:
                t = TipoEvento(nombre=nombre)
                db.add(t)
            tipos[nombre] = t
        db.flush()

        # Salones (solo si todavía no hay ninguno)
        if db.query(SalonModel).count() == 0:
            for datos in SALONES:
                nombres_tipos = datos.pop("tipos")
                db.add(SalonModel(**datos, tipos=[tipos[n] for n in nombres_tipos]))
            print(f"Salones cargados: {len(SALONES)}")
        else:
            print("Ya hay salones: no se tocaron.")

        # Usuarios (los que falten)
        for u in USUARIOS:
            if not db.query(UserModel).filter(UserModel.email == u["email"]).first():
                db.add(UserModel(
                    nombre=u["nombre"], email=u["email"],
                    password_hash=hashear(u["password"]), rol=u["rol"],
                ))
                print(f"Usuario creado: {u['email']} / {u['password']} ({u['rol']})")

        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    main()
