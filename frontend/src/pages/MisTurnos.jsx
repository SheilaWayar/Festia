import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { turnosApi } from "../services/turnosApi";
import { supabase } from "../lib/supabase";
import { usePerfil } from "../lib/usePerfil";
import BotonWhatsapp from "../components/BotonWhatsapp";
import BotonPagar from "../components/BotonPagar";
import { useAuth } from "../context/AuthContext";

const ESTADOS = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  finalizado: "Finalizado",
  rechazado: "Rechazado",
  cancelado: "Cancelado",
};
const ESTADOS_PAGO = { sin_pago: "Sin pago", parcial: "Anticipo pagado", pagado: "Pagado" };
const DEPOSITO = { pendiente: "En custodia", liberado: "Liberado", retenido: "Retenido" };

// Qué se muestra cuando Mercado Pago devuelve al cliente a esta pantalla (?pago=...)
const AVISOS_PAGO = {
  ok: { texto: "¡Pago recibido! Mercado Pago nos avisa en unos segundos y tu turno se actualiza solo.", ok: true },
  pendiente: { texto: "Tu pago está pendiente de acreditación. Cuando se acredite lo vas a ver acá.", ok: true },
  error: { texto: "El pago no se completó. Podés intentarlo de nuevo cuando quieras.", ok: false },
};

const pesos = (n) => `$${Number(n || 0).toLocaleString("es-AR")}`;

const fechaLarga = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("es-AR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

export default function MisTurnos() {
  const { sesion } = useAuth();
  const { user } = usePerfil();
  const [params] = useSearchParams();
  const pago = params.get("pago");
  const [turnos, setTurnos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState({ texto: "", ok: false });
  const [cancelando, setCancelando] = useState(null);
  const [descargando, setDescargando] = useState(null); // "reserva-<id>" | "pago-<id>"

  function traer() {
    return turnosApi
      .mios()
      .then(setTurnos)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    traer();
  }, []);

  // Al volver de Mercado Pago el aviso del pago puede tardar unos segundos: se vuelve a consultar
  useEffect(() => {
    if (pago !== "ok" && pago !== "pendiente") return;
    const tiempos = [3000, 8000, 15000].map((ms) => setTimeout(traer, ms));
    return () => tiempos.forEach(clearTimeout);
  }, [pago]);

  function reintentar() {
    setCargando(true);
    setError(null);
    traer();
  }

  async function cancelar(t) {
    if (!window.confirm(`¿Cancelar tu turno en ${t.salon_nombre}?`)) return;
    setMensaje({ texto: "", ok: false });
    setCancelando(t.id);
    try {
      await turnosApi.cancelar(t.id);
      setTurnos((lista) => lista.map((x) => (x.id === t.id ? { ...x, estado: "cancelado" } : x)));
      setMensaje({ texto: "Turno cancelado.", ok: true });
    } catch (err) {
      setMensaje({ texto: err.message, ok: false });
    } finally {
      setCancelando(null);
    }
  }

  // Genera el PDF en el navegador (la librería se carga recién al tocar el botón)
  async function descargar(tipo, t) {
    if (!user) return;
    setMensaje({ texto: "", ok: false });
    setDescargando(`${tipo}-${t.id}`);
    try {
      const { data: perfil } = await supabase
        .from("perfiles")
        .select("nombre, apellido, dni")
        .eq("id", user.id)
        .single();
      const pdf = await import("../utils/pdf");
      if (tipo === "reserva") await pdf.comprobanteReserva(t, perfil);
      else await pdf.comprobantePago(t, perfil);
    } catch (err) {
      console.error(err);
      setMensaje({ texto: "No se pudo generar el PDF. Probá de nuevo.", ok: false });
    } finally {
      setDescargando(null);
    }
  }

  const aviso = mensaje.texto ? mensaje : AVISOS_PAGO[pago] ?? mensaje;

  return (
    <>
      <header className="page-head">
        <span className="eyebrow"><span></span> Tu cuenta</span>
        <h2>Mis <em>turnos</em></h2>
      </header>

      <p className={`form-msg turnos-msg${aviso.ok ? " is-ok" : ""}`} role="alert">{aviso.texto}</p>

      <section className="turnos-list" aria-live="polite">
        {cargando && <div className="state-box"><p>Cargando tus turnos...</p></div>}

        {error && (
          <div className="state-box">
            <p>{error}</p>
            <button className="btn-outline" type="button" onClick={reintentar}>Reintentar</button>
          </div>
        )}

        {!cargando && !error && turnos.length === 0 && (
          <div className="state-box">
            <p>Todavía no tenés turnos reservados.</p>
            <Link className="primary-button" to="/salones">Ver salones</Link>
          </div>
        )}

        {turnos.map((t) => {
          const inactivo = ["cancelado", "rechazado"].includes(t.estado);
          const puedeCancelar = ["pendiente", "confirmado"].includes(t.estado);
          const hayComprobante = !inactivo;
          const hayPago = Number(t.monto_pagado) > 0;
          return (
            <article key={t.id} className={`turno-card${inactivo ? " is-cancelled" : ""}`}>
              <div>
                <h3>{t.salon_nombre}</h3>
                <p className="turno-meta">
                  {fechaLarga(t.fecha)} · {t.hora_inicio.slice(0, 5)} a {t.hora_fin.slice(0, 5)} h
                </p>

                {t.monto_total > 0 && (
                  <p className="turno-meta">
                    Total {pesos(t.monto_total)} · pagado {pesos(t.monto_pagado)} ·{" "}
                    {ESTADOS_PAGO[t.estado_pago] ?? t.estado_pago} · depósito{" "}
                    {DEPOSITO[t.deposito ?? "pendiente"] ?? t.deposito}
                  </p>
                )}

                {t.motivo_rechazo && (
                  <p className="turno-meta">Motivo del rechazo: {t.motivo_rechazo}</p>
                )}
                {t.comentario && (
                  <p className="turno-meta">Comentario del salón sobre el depósito: {t.comentario}</p>
                )}

                {t.estado === "confirmado" && (
                  <BotonWhatsapp turno={t} nombreUsuario={sesion?.nombre} />
                )}

                <BotonPagar turno={t} />

                {(hayComprobante || hayPago) && (
                  <div className="turno-docs">
                    {hayComprobante && (
                      <button className="btn-outline" type="button"
                        disabled={descargando === `reserva-${t.id}`}
                        onClick={() => descargar("reserva", t)}>
                        {descargando === `reserva-${t.id}` ? "Generando..." : "Comprobante de reserva (PDF)"}
                      </button>
                    )}
                    {hayPago && (
                      <button className="btn-outline" type="button"
                        disabled={descargando === `pago-${t.id}`}
                        onClick={() => descargar("pago", t)}>
                        {descargando === `pago-${t.id}` ? "Generando..." : "Comprobante de pago (PDF)"}
                      </button>
                    )}
                  </div>
                )}
              </div>
              <span className={`badge badge-${t.estado}`}>{ESTADOS[t.estado] ?? t.estado}</span>
              {puedeCancelar && (
                <button className="btn-danger" type="button"
                  disabled={cancelando === t.id} onClick={() => cancelar(t)}>
                  Cancelar
                </button>
              )}
            </article>
          );
        })}
      </section>
    </>
  );
}