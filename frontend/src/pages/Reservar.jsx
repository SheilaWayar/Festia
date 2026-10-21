import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import CalendarioSalon from "../components/CalendarioSalon";
import { salonesApi } from "../services/salonesApi";
import { turnosApi } from "../services/turnosApi";
import { HORAS, aISO, hhmm, hhmmFin, horaOcupada } from "../utils/disponibilidad";

export default function Reservar() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [salon, setSalon] = useState(null);
  const [fecha, setFecha] = useState(null);
  const [ocupados, setOcupados] = useState([]);
  const [inicio, setInicio] = useState("");
  const [fin, setFin] = useState("");
  const [tipo, setTipo] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    salonesApi.obtener(id).then(setSalon).catch((e) => setError(e.message));
  }, [id]);

  if (!salon) {
    return (
      <section className="detail-section">
        <div className="state-box">
          <p>{error || "Cargando salón..."}</p>
          {error && <Link className="btn-outline" to="/salones">Volver a los salones</Link>}
        </div>
      </section>
    );
  }

  const fechaISO = fecha ? aISO(fecha) : null;

  // Horas de inicio: solo las libres de ese día
  const horasLibres = fechaISO ? HORAS.filter((h) => !horaOcupada(ocupados, fechaISO, h)) : [];

  // Horas de fin: hasta la próxima hora ocupada, para no pisar otra reserva
  const proximaOcupada =
    fechaISO && inicio
      ? HORAS.find((h) => h > Number(inicio) && horaOcupada(ocupados, fechaISO, h))
      : undefined;
  const tope = proximaOcupada ?? 24;
  const horasFin = inicio ? HORAS.concat(24).filter((h) => h > Number(inicio) && h <= tope) : [];

  const cantidadHoras = inicio && fin ? Number(fin) - Number(inicio) : 0;
  const total = cantidadHoras * (salon.precio_por_hora ?? 0);

  async function enviar(e) {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      await turnosApi.crear({
        salon_id: salon.id,
        fecha: fechaISO,
        hora_inicio: hhmm(Number(inicio)),
        hora_fin: hhmmFin(Number(fin)),
        tipo_evento: tipo || null,
      });
      navigate("/mis-turnos");
    } catch (err) {
      setError(err.message); // ej: "Ese horario ya está ocupado"
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="auth">
      <div className="auth-card auth-card--ancha">
        <Link className="back-link" to={`/salones/${salon.id}`}>← Volver al salón</Link>
        <h2>Reservar {salon.nombre}</h2>

        <form onSubmit={enviar}>
          <label>
            Fecha
            <CalendarioSalon
              salonId={salon.id}
              fecha={fecha}
              onFecha={(d) => {
                setFecha(d);
                setInicio("");
                setFin("");
              }}
              onOcupados={setOcupados}
            />
            <span className="ayuda">Los días tachados están completos; los resaltados tienen horarios ocupados.</span>
          </label>

          {fecha && (
            <>
              <label>
                Hora de inicio
                <select
                  value={inicio}
                  onChange={(e) => {
                    setInicio(e.target.value);
                    setFin("");
                  }}
                  required
                >
                  <option value="">Elegí</option>
                  {horasLibres.map((h) => (
                    <option key={h} value={h}>{hhmm(h)}</option>
                  ))}
                </select>
              </label>

              <label>
                Hora de fin
                <select value={fin} onChange={(e) => setFin(e.target.value)} required disabled={!inicio}>
                  <option value="">Elegí</option>
                  {horasFin.map((h) => (
                    <option key={h} value={h}>{h === 24 ? "23:59" : hhmm(h)}</option>
                  ))}
                </select>
              </label>
            </>
          )}

          <label>
            Tipo de evento
            <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="">Sin especificar</option>
              {salon.tipos_evento?.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>

          {cantidadHoras > 0 && (
            <div className="reserva-resumen">
              <span>Total estimado ({cantidadHoras} {cantidadHoras === 1 ? "hora" : "horas"})</span>
              <strong>${total.toLocaleString("es-AR")}</strong>
            </div>
          )}

          <p className="form-msg" role="alert">{error}</p>
          <button className="primary-button" type="submit" disabled={!fecha || !inicio || !fin || enviando}>
            {enviando ? "Reservando..." : "Confirmar reserva"}
          </button>
        </form>
      </div>
    </div>
  );
}
