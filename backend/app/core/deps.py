import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import leer_token
from app.models.user import UserModel

bearer = HTTPBearer()


def get_current_user(
    cred: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
) -> UserModel:
    try:
        datos = leer_token(cred.credentials)
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Token inválido o vencido")

    usuario = db.get(UserModel, int(datos["sub"]))
    if not usuario:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    return usuario


def require_admin(usuario: UserModel = Depends(get_current_user)) -> UserModel:
    if usuario.rol != "admin":
        raise HTTPException(status_code=403, detail="Requiere rol admin")
    return usuario