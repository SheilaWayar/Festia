import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

const dorado = "#e2bf75";

const estilos = {
  caja: {
    display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between",
    border: "1px solid rgba(226, 191, 117, 0.4)", borderRadius: 14, padding: "20px 24px",
    margin: "32px 0", background: "rgba(226, 191, 117, 0.07)", color: "#f3ead7",
  },
  titulo: { margin: "0 0 4px", fontSize: 20, color: "#f6edd8" },
  texto: { margin: 0, fontSize: 14, color: "#9db3a8", maxWidth: 520 },
  boton: {
    display: "inline-block", padding: "10px 18px", borderRadius: 8, background: dorado,
    color: "#0a2420", fontWeight: 600, fontSize: 14, textDecoration: "none",
  },
  botonSec: {
    display: "inline-block", padding: "10px 18px", borderRadius: 8, border: `1px solid ${dorado}`,
    color: dorado, fontSize: 14, textDecoration: "none",
  },
};

export default function QuieroOfrecerServicios() {
  // null = no tiene ficha (o no inició sesión); si no, el estado de su ficha
  const [estado, setEstado] = useState(null);

  useEffect(() => {
    let vivo = true;
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from("proveedores").select("estado").eq("user_id", user.id).maybeSingle();
      if (vivo && data) setEstado(data.estado);
    });
    return () => { vivo = false; };
  }, []);

  let titulo = "¿Ofrecés catering, fotografía o sonido?";
  let texto = "Sumá tu servicio a Festia. Subís tu documentación y tus fotos, y lo publicamos cuando lo aprobemos.";
  let boton = <Link to="/proveedores/registro" style={estilos.boton}>Quiero ofrecer mis servicios</Link>;

  if (estado === "pendiente") {
    titulo = "Tu solicitud está en revisión";
    texto = "Un administrador está revisando tus documentos. Te vamos a publicar apenas la aprueben.";
    boton = <Link to="/proveedores/registro" style={estilos.botonSec}>Ver estado</Link>;
  } else if (estado === "aprobado") {
    titulo = "Tu servicio está publicado";
    texto = "Podés actualizar tus fotos, precio y descripción. Los cambios se publican cuando el administrador los aprueba.";
    boton = <Link to="/mi-ficha" style={estilos.boton}>Editar mi ficha</Link>;
  } else if (estado === "rechazado") {
    titulo = "Tu solicitud necesita correcciones";
    texto = "Revisá el motivo, corregí los datos y volvé a enviarla.";
    boton = <Link to="/proveedores/registro" style={estilos.boton}>Ver motivo y corregir</Link>;
  } else if (estado === "suspendido") {
    titulo = "Tu ficha está suspendida";
    texto = "Contactá a la administración para más información.";
    boton = null;
  }

  return (
    <section style={estilos.caja}>
      <div>
        <h2 style={estilos.titulo}>{titulo}</h2>
        <p style={estilos.texto}>{texto}</p>
      </div>
      {boton}
    </section>
  );
}