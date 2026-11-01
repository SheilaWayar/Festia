import { useState } from "react";
import { request } from "../services/api";

// «Pagar la seña» → abre Mercado Pago. Aparece solo si el turno está confirmado y falta pagar.
export default function BotonPagar({ turno }) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const saldo = Number(turno.monto_total || 0) - Number(turno.monto_pagado || 0);
  if (turno.estado !== "confirmado" || turno.estado_pago === "pagado" || saldo <= 0) return null;
  const yaPagoAlgo = Number(turno.monto_pagado || 0) > 0;

  async function pagar(modo) {
    setError("");
    setCargando(true);
    try {
      const r = await request("/pagos/crear-pago/" + turno.id, {
        method: "POST",
        body: JSON.stringify({ modo }),
      });
      window.location.href = r.url;
    } catch (e) {
      setError(e.message);
      setCargando(false);
    }
  }

  return (
    <div className="turno-acciones" style={{ marginTop: 14, flexWrap: "wrap" }}>
      <button className="primary-button" type="button" disabled={cargando}
        onClick={() => pagar(yaPagoAlgo ? "total" : "sena")}>
        {cargando ? "Abriendo Mercado Pago..." : yaPagoAlgo ? "Pagar el saldo" : "Pagar la seña"}
      </button>
      {!yaPagoAlgo && (
        <button className="btn-outline" type="button" disabled={cargando} onClick={() => pagar("total")}>
          Pagar el total
        </button>
      )}
      {error && <p className="form-msg">{error}</p>}
    </div>
  );
}