// Estrellas de solo lectura. `valor` va de 0 a 5 y admite decimales (4.5 = media estrella).
export default function Estrellas({ valor = 0, size = 16 }) {
  const porcentaje = (Math.max(0, Math.min(5, valor)) / 5) * 100;
  return (
    <span
      className="estrellas"
      style={{ fontSize: size }}
      role="img"
      aria-label={`${valor} de 5 estrellas`}
    >
      <span className="estrellas__fondo" aria-hidden="true">★★★★★</span>
      <span className="estrellas__relleno" style={{ width: `${porcentaje}%` }} aria-hidden="true">
        ★★★★★
      </span>
    </span>
  );
}