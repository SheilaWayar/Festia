from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.db import Base, get_db
from app.models.salon import SalonModel

FECHA = (date.today() + timedelta(days=30)).isoformat()


@pytest.fixture()
def client(tmp_path):
    engine = create_engine(
        f"sqlite:///{tmp_path / 'test.db'}",
        connect_args={"check_same_thread": False},
    )
    Session = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = Session()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    with Session() as db:
        db.add(SalonModel(nombre="Test", direccion="X", capacidad=10, precio_por_hora=1000))
        db.commit()

    yield TestClient(app)
    app.dependency_overrides.clear()


def _headers(client, email="u@test.com"):
    r = client.post(
        "/api/v1/auth/registro",
        json={"nombre": "U", "email": email, "password": "1234"},
    )
    if r.status_code == 409:
        r = client.post("/api/v1/auth/login", json={"email": email, "password": "1234"})
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def _body(inicio="20:00", fin="23:00", fecha=FECHA):
    return {"salon_id": 1, "fecha": fecha, "hora_inicio": inicio, "hora_fin": fin}


def test_reservar_y_superposicion(client):
    h = _headers(client)
    assert client.post("/api/v1/turnos", json=_body(), headers=h).status_code == 201
    # mismo horario
    assert client.post("/api/v1/turnos", json=_body(), headers=h).status_code == 409
    # solapado parcialmente
    assert client.post("/api/v1/turnos", json=_body("22:00", "23:30"), headers=h).status_code == 409
    # contiguo: se permite
    assert client.post("/api/v1/turnos", json=_body("23:00", "23:59"), headers=h).status_code == 201


def test_cancelar_libera_el_horario(client):
    h = _headers(client)
    turno = client.post("/api/v1/turnos", json=_body(), headers=h).json()
    assert client.delete(f"/api/v1/turnos/{turno['id']}", headers=h).status_code == 204
    assert client.post("/api/v1/turnos", json=_body(), headers=h).status_code == 201


def test_sin_token(client):
    assert client.get("/api/v1/turnos/mios").status_code in (401, 403)


def test_usuario_comun_no_ve_todos_los_turnos(client):
    h = _headers(client, "comun@test.com")
    assert client.get("/api/v1/turnos", headers=h).status_code == 403


def test_hora_fin_menor_que_inicio(client):
    h = _headers(client)
    assert client.post("/api/v1/turnos", json=_body("20:00", "19:00"), headers=h).status_code == 422


def test_fecha_pasada(client):
    h = _headers(client)
    ayer = (date.today() - timedelta(days=1)).isoformat()
    assert client.post("/api/v1/turnos", json=_body(fecha=ayer), headers=h).status_code == 400