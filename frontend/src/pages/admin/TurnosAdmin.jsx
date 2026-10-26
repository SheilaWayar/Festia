import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { turnosApi } from "../../services/turnosApi";
import { salonesApi } from "../../services/salonesApi";
import ModalAccion from "../../components/ModalAccion";

const ESTADOS = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  finalizado: "Finalizado",
  rechazado: "Rechazado",
  cancelado: "Cancelado",
};
const ESTADOS_PAGO = { sin_pago: "Sin pago", parcial: "Anticipo pagado", pagado: "Pagado" };
const DEPOSITO = { pendiente: "En custodia", liberado: "Liberado", retenido: "Retenido" };
const TITULOS = {
  rechazar: "Rechazar pedido",
  finalizar: "Finalizar evento",
  pago: "Registrar pago manual",
};

const FORM_VACIO = { motivo: "", deposito: "liberado", comentario: "", monto: "", metodo: "efectivo" };

const yaTermino = (t) => new Date(`${t.fecha}T${t.hora_fin}`) <= new Date();

export default function TurnosAdmin() {
  const [turnos, setTurnos] = useState([]);
  const [salones, setSalones] = useState([]);
  const [filtros, setFiltros] = useState({ salon_id: "", fecha: "", estado: "" });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Ventana de acción: { tipo: "rechazar" | "finalizar" | "pago", turno }
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [errorModal, setErrorModal] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    salonesApi.listar().then(setSalones).catch(() => setSalones([]));
  }, []);

  function cargar() {
    setCargando(true);
    setError(null);
    turnosApi.todos(filtros).then(setTurnos)
      .catch((e) => setError(e.message)).finally(() => setCargando(false));
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros]);

  const cambiar = (e) => setFiltros({ ...filtros, [e.target.name]: e.target.value });
  const cambiarForm = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function ejecutar(accion) {
    try {
      await accion();
      cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  // Mientras el backend nuevo no esté, Confirmar usa el endpoint viejo.
  // Cuando exista PATCH /turnos/{id}/confirmar, cambiar por: turnosApi.confirmar(id)
  const confirmar = (id) => ejecutar(() => turnosApi.cambiarEstado(id, "confirmado"));
  const cancelar = (id) => ejecutar(() => turnosApi.cambiarEstado(id, "cancelado"));

  function abrirModal(tipo, turno) {
    setForm(FORM_VACIO);
    setErrorModal(null);
    setModal({ tipo, turno });
  }

  function cerrarModal() {
    if (!enviando) setModal(null);
  }

  async function enviarModal(e) {
    e.preventDefault();
    const { tipo, turno } = modal;
    const comentario = form.comentario.trim();
    setErrorModal(null);

    if (tipo === "rechazar" && form.motivo.trim().length < 3) {
      return setErrorModal("El motivo debe tener al menos 3 caracteres.");
    }
    if (tipo === "finalizar" && form.deposito === "retenido" && comentario.length < 10) {
      return setErrorModal("Para no liberar el depósito explicá el motivo (mínimo 10 caracteres).");
    }
    if (tipo === "pago" && !(Number(form.monto) > 0)) {
      return setErrorModal("Ingresá un monto mayor a 0.");
    }

    setEnviando(true);
    try {
      if (tipo === "rechazar") await turnosApi.rechazar(turno.id, form.motivo.trim());
      if (tipo === "finalizar") await turnosApi.finalizar(turno.id, form.deposito, comentario || null);
      if (tipo === "pago") {
        await turnosApi.pagoManual(turno.id, { monto: Number(form.monto), metodo: form.metodo });
      }
      setModal(null);
      cargar();
    } catch (err) {
      setErrorModal(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <header className="page-head">
        <span className="eyebrow"><span></span> Administración</span>
        <h2>Todos los <em>turnos</em></h2>
      </header>

      <div className="filtros-admin">
        <select name="salon_id" value={filtros.salon_id} onChange={cambiar} aria-label="Salón">
          <option value="">Todos los salones</option>
          {salones.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </select>
        <input type="date" name="fecha" value={filtros.fecha} onChange={cambiar} aria-label="Fecha" />
        <select name="estado" value={filtros.estado} onChange={cambiar} aria-label="Estado">
          <option value="">Todos los estados</option>
          {Object.entries(ESTADOS).map(([valor, texto]) => (
            <option key={valor} value={valor}>{texto}</option>
          ))}
        </select>
        {filtros.salon_id && (
          <Link className="btn-outline" to={`/admin/salones/${filtros.salon_id}/historial`}>
            Ver historial del salón
          </Link>
        )}
      </div>

      <section className="turnos-list" aria-live="polite">
        {cargando && <div className="state-box"><p>Cargando turnos...</p></div>}
        {error && <div className="state-box"><p>{error}</p></div>}
        {!cargando && !error && turnos.length === 0 && (
          <div className="state-box"><p>No hay turnos con esos filtros.</p></div>
        )}

        {turnos.map((t) => (
          <article
            key={t.id}
            className={`turno-card${["cancelado", "rechazado"].includes(t.estado) ? " is-cancelled" : ""}`}
          >
            <div>
              <h3>{t.salon_nombre}</h3>
              <p className="turno-meta">
                {t.fecha} · {t.hora_inicio.slice(0, 5)} a {t.hora_fin.slice(0, 5)} h · {t.usuario_email}
              </p>
              {t.monto_total > 0 && (
                <p className="turno-meta">
                  Total ${Number(t.monto_total).toLocaleString("es-AR")} · anticipo {t.anticipo_porcentaje}% ·{" "}
                  {ESTADOS_PAGO[t.estado_pago] ?? t.estado_pago} · depósito {DEPOSITO[t.estado_deposito] ?? t.estado_deposito}
                </p>
              )}
              {t.motivo_rechazo && <p className="turno-meta">Motivo del rechazo: {t.motivo_rechazo}</p>}
              {t.comentario_deposito && <p className="turno-meta">Comentario del depósito: {t.comentario_deposito}</p>}
            </div>
            <span className={`badge badge-${t.estado}`}>{ESTADOS[t.estado] ?? t.estado}</span>
            <div className="turno-acciones">
              {t.estado === "pendiente" && (
                <>
                  <button className="btn-outline" type="button" onClick={() => confirmar(t.id)}>Confirmar</button>
                  <button className="btn-danger" type="button" onClick={() => abrirModal("rechazar", t)}>Rechazar</button>
                </>
              )}
              {t.estado === "confirmado" && yaTermino(t) && (
                <button className="btn-outline" type="button" onClick={() => abrirModal("finalizar", t)}>
                  Finalizar evento
                </button>
              )}
              {["confirmado", "finalizado"].includes(t.estado) && t.monto_total > 0 && t.estado_pago !== "pagado" && (
                <button className="btn-outline" type="button" onClick={() => abrirModal("pago", t)}>
                  Registrar pago
                </button>
              )}
              {["pendiente", "confirmado"].includes(t.estado) && (
                <button className="btn-danger" type="button" onClick={() => cancelar(t.id)}>Cancelar</button>
              )}
            </div>
          </article>
        ))}
      </section>

      {modal && (
        <ModalAccion titulo={TITULOS[modal.tipo]} onCerrar={cerrarModal}>
          <p className="turno-meta">
            {modal.turno.salon_nombre} · {modal.turno.fecha} · {modal.turno.usuario_email}
          </p>
          <form onSubmit={enviarModal}>
            {modal.tipo === "rechazar" && (
              <label className="accion-campo">
                Motivo del rechazo (mínimo 3 caracteres)
                <textarea name="motivo" rows={3} value={form.motivo} onChange={cambiarForm} />
              </label>
            )}

            {modal.tipo === "finalizar" && (
              <>
                <label className="accion-opcion">
                  <input type="radio" name="deposito" value="liberado"
                    checked={form.deposito === "liberado"} onChange={cambiarForm} />
                  <span>Liberar depósito</span>
                </label>
                <label className="accion-opcion">
                  <input type="radio" name="deposito" value="retenido"
                    checked={form.deposito === "retenido"} onChange={cambiarForm} />
                  <span>No liberar depósito</span>
                </label>
                <label className="accion-campo">
                  {form.deposito === "retenido"
                    ? "Motivo (obligatorio, mínimo 10 caracteres)"
                    : "Comentario (opcional)"}
                  <textarea name="comentario" rows={3} value={form.comentario} onChange={cambiarForm} />
                </label>
              </>
            )}

            {modal.tipo === "pago" && (
              <>
                <label className="accion-campo">
                  Monto cobrado ($)
                  <input type="number" name="monto" min="0" step="0.01" value={form.monto} onChange={cambiarForm} />
                </label>
                <label className="accion-campo">
                  Método
                  <select name="metodo" value={form.metodo} onChange={cambiarForm}>
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                  </select>
                </label>
              </>
            )}

            {errorModal && <p className="accion-error" role="alert">{errorModal}</p>}

            <div className="accion-botones">
              <button className="btn-outline" type="button" onClick={cerrarModal} disabled={enviando}>
                Volver
              </button>
              <button className="btn-danger" type="submit" disabled={enviando}>
                {enviando ? "Guardando..." : "Confirmar"}
              </button>
            </div>
          </form>
        </ModalAccion>
      )}
    </>
  );
}  