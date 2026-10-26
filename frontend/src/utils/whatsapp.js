// Deja el número en formato internacional para wa.me (solo dígitos).
export function normalizarWhatsapp(numero) {
  const n = String(numero || "").replace(/\D/g, "");
  if (n.startsWith("549") && n.length >= 12 && n.length <= 13) return n;
  if (n.length === 10) return "549" + n; // código de área + número, sin 0 ni 15
  return null;
}

export function mensajeReserva(turno, nombreUsuario) {
  const hora = (h) => String(h || "").slice(0, 5);
  return (
    `Hola, soy ${nombreUsuario || "un cliente"}. ` +
    `Mi reserva #${turno.id} en ${turno.salon_nombre} fue confirmada ` +
    `para el ${turno.fecha} de ${hora(turno.hora_inicio)} a ${hora(turno.hora_fin)} h. ` +
    `Quisiera coordinar los detalles del evento. ¡Gracias!`
  );
}

export function linkWhatsapp(numero, mensaje) {
  const n = normalizarWhatsapp(numero);
  if (!n) return null;
  return `https://wa.me/${n}?text=${encodeURIComponent(mensaje)}`;
}