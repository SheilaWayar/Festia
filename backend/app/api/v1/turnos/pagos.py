import os
import mercadopago
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.models.turno import TurnoModel

router = APIRouter(prefix="/api/v1/pagos", tags=["Pagos"])

# Inicializar Mercado Pago con el Access Token (usá el de prueba por ahora)
# Idealmente se saca de una variable de entorno: os.getenv("MP_ACCESS_TOKEN")
ACCESS_TOKEN = os.getenv("MP_ACCESS_TOKEN", "TEST-TU-ACCESS-TOKEN-AQUI")
sdk = mercadopago.SDK(ACCESS_TOKEN)

@router.post("/crear-pago/{turno_id}")
def crear_pago(turno_id: int, db: Session = Depends(get_db)):
    # 1. Buscar el turno creado
    turno = db.get(TurnoModel, turno_id)
    if not turno:
        raise HTTPException(status_code=404, detail="Turno no encontrado")

    # 2. Configurar los datos de la preferencia de pago usando el anticipo calculado
    preference_data = {
        "items": [
            {
                "title": f"Anticipo de Reserva - Salón #{turno.salon_id}",
                "quantity": 1,
                "unit_price": float(turno.monto_anticipo),
                "currency_id": "ARS",
            }
        ],
        "back_urls": {
            "success": "http://localhost:3000/reserva/exito",
            "failure": "http://localhost:3000/reserva/error",
            "pending": "http://localhost:3000/reserva/pendiente",
        },
        "auto_return": "approved",
        "external_reference": str(turno.id),
    }

    # 3. Crear la preferencia en Mercado Pago
    preference_response = sdk.preference().create(preference_data)
    preference = preference_response["response"]

    # 4. Retornar los links de pago (init_point para producción/sandbox)
    return {
        "preference_id": preference["id"],
        "init_point": preference["init_point"],
        "sandbox_init_point": preference.get("sandbox_init_point"),
        "monto_cobrado": float(turno.monto_anticipo)
    }