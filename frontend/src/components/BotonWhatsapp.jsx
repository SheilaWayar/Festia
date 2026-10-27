import { linkWhatsapp, mensajeReserva } from "../utils/whatsapp";

// turno: { id, salon_nombre, salon_whatsapp, fecha, hora_inicio, hora_fin }
export default function BotonWhatsapp({ turno, nombreUsuario }) {
  const url = linkWhatsapp(turno.salon_whatsapp, mensajeReserva(turno, nombreUsuario));
  if (!url) return null; // sin número válido, no se muestra

  return (
    <a className="btn-outline btn-whatsapp" href={url} target="_blank" rel="noopener noreferrer">
      Contactar al salón por WhatsApp
    </a>
  );
}