import { linkWhatsapp, mensajeConsultaProveedor } from "../utils/whatsapp";

export default function BotonWhatsappProveedor({ proveedor, nombreUsuario }) {
  const url = linkWhatsapp(
    proveedor.whatsapp,
    mensajeConsultaProveedor(proveedor, nombreUsuario)
  );
  if (!url) return null; // sin número válido, no se muestra

  return (
    <a
      className="btn-outline btn-whatsapp"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
    >
      Contactar por WhatsApp
    </a>
  );
}