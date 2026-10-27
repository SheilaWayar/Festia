import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import leer_token
from app.models.user import UserModel, SalonAdminModel

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

    if not getattr(usuario, "activo", True):
        raise HTTPException(status_code=403, detail="Usuario inactivo")
    if usuario.rol not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Requiere rol admin o superadmin")
    return usuario

def verificar_admin_de_salon(
    salon_id: int, 
    usuario: UserModel = Depends(require_admin), 
    db: Session = Depends(get_db)
) -> UserModel:
   
    if usuario.rol == "superadmin":
        return usuario


    es_admin = db.query(SalonAdminModel).filter(
        SalonAdminModel.admin_id == usuario.id,
        SalonAdminModel.salon_id == salon_id
    ).first()

    if not es_admin:
        raise HTTPException(
            status_code=403, 
            detail="No tienes permisos para gestionar este salón"
        )

    return usuario