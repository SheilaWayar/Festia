import { supabase, rutaDeFoto, ui } from "./shared";
import { enlaceWhatsapp } from "../../utils/contacto";

const FESTIA_WHATSAPP = "5493872174060";

export default function AccionesServicio({ proveedor, onEliminado }) {
  const suspendido = proveedor.estado === "suspendido";
  const rechazado = proveedor.estado === "rechazado";

  const wa = enlaceWhatsapp(
    FESTIA_WHATSAPP,
    `Hola Festia! Mi servicio "${proveedor.nombre}" fue ${suspendido ? "suspendido" : "rechazado"}` +
      (proveedor.motivo_rechazo ? ` por: ${proveedor.motivo_rechazo}.` : ".") +
      " Quiero resolverlo."
  );

  async function eliminar() {
    if (!window.confirm(`¿Eliminar "${proveedor.nombre}"? Esta acción no se puede deshacer.`)) return;

    const { data: docs } = await supabase
      .from("proveedores_documentos")
      .select("path")
      .eq("proveedor_id", proveedor.id);

    const { data, error } = await supabase
      .from("proveedores")
      .delete()
      .eq("id", proveedor.id)
      .select();
    if (error || !data?.length) return alert(error?.message || "No se pudo eliminar el servicio.");

    const fotos = (proveedor.imagenes || []).map(rutaDeFoto).filter(Boolean);
    if (fotos.length) await supabase.storage.from("proveedores-fotos").remove(fotos);
    const rutas = (docs || []).map((d) => d.path);
    if (rutas.length) await supabase.storage.from("proveedores-docs").remove(rutas);

    onEliminado?.();
  }

  return (
    <div>
      {(suspendido || rechazado) && (
        <div style={ui.warn}>
          <b>
            {suspendido
              ? "Tu servicio está suspendido y no se ve en el sitio."
              : "Tu solicitud fue rechazada."}
          </b>
          {proveedor.motivo_rechazo && <p>Motivo: {proveedor.motivo_rechazo}</p>}
          <p>Escribinos para arreglarlo y volver a publicarlo.</p>
          {wa && (
            <a
              style={{ ...ui.btnPrimary, textDecoration: "none", display: "inline-block" }}
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
            >
              Contactar con Festia
            </a>
          )}
        </div>
      )}

      <div style={{ ...ui.row, marginTop: 12 }}>
        <button type="button" style={ui.btnDanger} onClick={eliminar}>
          Eliminar mi servicio
        </button>
      </div>
    </div>
  );
}