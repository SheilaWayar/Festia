from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import hashear, verificar, crear_token
from app.models.user import UserModel
from app.api.v1.auth.schemas import RegistroIn, LoginIn

router = APIRouter(prefix="/auth", tags=["Auth"])  # main.py lo monta en /api/v1


def _respuesta(u: UserModel) -> dict:
    # Este es el contrato con el frontend (AuthContext de Sheila)
    return {
        "access_token": crear_token(u.id, u.rol),
        "token_type": "bearer",
        "rol": u.rol,
        "nombre": u.nombre,
    }


@router.post("/registro", status_code=201)
def registro(data: RegistroIn, db: Session = Depends(get_db)):
    if db.query(UserModel).filter(UserModel.email == data.email).first():
        raise HTTPException(status_code=409, detail="Ese email ya está registrado")

    usuario = UserModel(
        nombre=data.nombre,
        email=data.email,
        password_hash=hashear(data.password),
        rol="usuario",
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return _respuesta(usuario)


@router.post("/login")
def login(data: LoginIn, db: Session = Depends(get_db)):
    usuario = db.query(UserModel).filter(UserModel.email == data.email).first()
    if not usuario or not verificar(data.password, usuario.password_hash):
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")
    return _respuesta(usuario)