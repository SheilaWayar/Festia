import { estimarMontos, formatearPesos } from "../utils/montos";

// inicio y fin son objetos Date. Si falta alguno, no muestra nada.
export default function ResumenAnticipo({ salon, inicio, fin }) {
  const m = inicio && fin ? estimarMontos(salon, inicio, fin) : null;
  if (!m) return null;

  return (
    <div className="resumen-anticipo" aria-live="polite">
      <p>Total estimado: <strong>{formatearPesos(m.total)}</strong> ({m.horas} h)</p>
      <p>Anticipo para reservar ({m.porcentaje}%): <strong>{formatearPesos(m.anticipo)}</strong></p>
      <p className="resumen-nota">El salón confirma tu pedido y después se paga el anticipo.</p>
    </div>
  );
}