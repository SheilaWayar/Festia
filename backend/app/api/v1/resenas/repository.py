import math

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.resena import ResenaModel
from app.models.turno import TurnoModel
from app.api.v1.resenas.schemas import ResenaIn


def a_respuesta(r: ResenaModel) -> dict:
    return {
        "id": r.id,
        "salon_id": r.salon_id,
        "nombre": r.usuario.nombre if r.usuario else "Usuario eliminado",
        "puntaje": r.puntaje,
        "comentario": r.comentario,
        "created_at": r.created_at,
    }


def resumen_de_salon(db: Session, salon_id: int) -> tuple[float | None, int]:
    promedio, cantidad = (
        db.query(func.avg(ResenaModel.puntaje), func.count(ResenaModel.id))
        .filter(ResenaModel.salon_id == salon_id)
        .one()
    )
    return (round(float(promedio), 1) if promedio is not None else None), cantidad


def resumen_de_todos(db: Session) -> list[dict]:
    filas = (
        db.query(
            ResenaModel.salon_id,
            func.avg(ResenaModel.puntaje),
            func.count(ResenaModel.id),
        )
        .group_by(ResenaModel.salon_id)
        .all()
    )
    return [
        {"salon_id": sid, "promedio": round(float(prom), 1), "cantidad": cant}
        for sid, prom, cant in filas
    ]


def listar_pagina(db: Session, salon_id: int, page: int, limit: int):
    base = db.query(ResenaModel).filter(ResenaModel.salon_id == salon_id)
    total = base.count()
    filas = (
        base.options(joinedload(ResenaModel.usuario))
        .order_by(ResenaModel.created_at.desc(), ResenaModel.id.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
    paginas = max(1, math.ceil(total / limit))
    return filas, total, paginas


def tuvo_turno_confirmado(db: Session, salon_id: int, usuario_id: int) -> bool:
    return (
        db.query(TurnoModel.id)
        .filter(
            TurnoModel.salon_id == salon_id,
            TurnoModel.cliente_id == usuario_id,
            TurnoModel.estado == "confirmado",
        )
        .first()
        is not None
    )


def obtener(db: Session, resena_id: int) -> ResenaModel | None:
    return db.get(ResenaModel, resena_id)


def obtener_de_usuario(db: Session, salon_id: int, usuario_id: int) -> ResenaModel | None:
    return (
        db.query(ResenaModel)
        .filter(ResenaModel.salon_id == salon_id, ResenaModel.usuario_id == usuario_id)
        .first()
    )


def crear(db: Session, salon_id: int, usuario_id: int, data: ResenaIn) -> ResenaModel:
    r = ResenaModel(
        salon_id=salon_id,
        usuario_id=usuario_id,
        puntaje=data.puntaje,
        comentario=data.comentario,
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    return r


def actualizar(db: Session, r: ResenaModel, data: ResenaIn) -> ResenaModel:
    r.puntaje = data.puntaje
    r.comentario = data.comentario
    db.commit()
    db.refresh(r)
    return r


def eliminar(db: Session, r: ResenaModel) -> None:
    db.delete(r)
    db.commit()