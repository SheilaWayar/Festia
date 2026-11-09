import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  supabase, CATEGORIAS, docsPara, subirArchivo, subirFoto, TERMINOS_VERSION,
  MIN_FOTOS, MAX_FOTOS, ui,
} from "./shared";
import AccionesServicio from "./AccionesServicio";

const VACIO = {
  nombre: "", categoria: "", descripcion: "", precio_desde: "",
  whatsapp: "", instagram: "", zona: "",
};

export default function ProveedorRegistro() {
  const [user, setUser] = useState(null);
  const [existente, setExistente] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState(VACIO);
  const [fotos, setFotos] = useState([]);
  const [docs, setDocs] = useState({});
  const [acepta, setAcepta] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  async function cargar() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      const { data } = await supabase.from("proveedores").select("*").eq("user_id", user.id).maybeSingle();
      setExistente(data);
    }
    setCargando(false);
  }
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { cargar(); }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const listaDocs = docsPara(form.categoria);

  async function enviar(e) {
    e.preventDefault();
    setError("");
    if (!form.nombre.trim() || !form.categoria || !form.descripcion.trim() || !form.whatsapp.trim() || !form.zona.trim())
      return setError("Completá nombre, categoría, descripción, WhatsApp y zona.");
    if (fotos.length < MIN_FOTOS) return setError(`Subí al menos ${MIN_FOTOS} fotos de tus trabajos.`);
    if (fotos.length > MAX_FOTOS) return setError(`Máximo ${MAX_FOTOS} fotos.`);
    const faltan = listaDocs.filter((d) => d.requerido && !docs[d.tipo]);
    if (faltan.length) return setError(`Falta subir: ${faltan.map((d) => d.label).join("; ")}.`);
    if (!acepta) return setError("Tenés que aceptar los términos y condiciones.");

    setEnviando(true);
    try {
      const imagenes = [];
      for (const f of fotos) imagenes.push(await subirFoto(user.id, f));

      const docsSubidos = [];
      for (const d of listaDocs) {
        if (docs[d.tipo]) {
          const path = await subirArchivo("proveedores-docs", user.id, docs[d.tipo], `${d.tipo}-`);
          docsSubidos.push({ tipo: d.tipo, path });
        }
      }

      const { data: prov, error: e1 } = await supabase
        .from("proveedores")
        .insert({
          user_id: user.id,
          nombre: form.nombre.trim(),
          categoria: form.categoria,
          descripcion: form.descripcion.trim(),
          precio_desde: form.precio_desde === "" ? null : Number(form.precio_desde),
          whatsapp: form.whatsapp.trim(),
          instagram: form.instagram.trim() || null,
          zona: form.zona.trim(),
          imagenes,
          estado: "pendiente",
          terminos_aceptados_at: new Date().toISOString(),
          terminos_version: TERMINOS_VERSION,
        })
        .select()
        .single();
      if (e1) throw e1;

      const { error: e2 } = await supabase
        .from("proveedores_documentos")
        .insert(docsSubidos.map((d) => ({ proveedor_id: prov.id, ...d })));
      if (e2) throw e2;

      setExistente(prov);
    } catch (err) {
      setError(err.message || "No se pudo enviar la solicitud. Probá de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  async function reenviar() {
    const { error } = await supabase.from("proveedores").delete().eq("id", existente.id);
    if (error) return setError(error.message);
    setExistente(null);
  }

  if (cargando) return <div style={ui.page}>Cargando…</div>;

  if (!user)
    return (
      <div style={ui.page}>
        <h1 style={ui.h1}>Quiero ofrecer mis servicios</h1>
        <div style={ui.warn}>Para registrarte como proveedor primero tenés que iniciar sesión.</div>
        <Link to="/login" style={ui.link}>Iniciar sesión</Link>
      </div>
    );

  if (existente) {
    return (
      <div style={ui.page}>
        <h1 style={ui.h1}>Tu solicitud de proveedor</h1>

        {existente.estado === "pendiente" && (
          <>
            <div style={ui.warn}>
              Recibimos tu solicitud. Un administrador está revisando tus documentos. Te va a aparecer publicada cuando la aprueben.
            </div>
            <AccionesServicio proveedor={existente} onEliminado={() => setExistente(null)} />
          </>
        )}

        {existente.estado === "aprobado" && (
          <div style={ui.okBox}>
            ¡Tu ficha está aprobada y publicada! <Link to="/mi-ficha" style={ui.link}>Editar mi ficha</Link>
          </div>
        )}

        {(existente.estado === "suspendido" || existente.estado === "rechazado") && (
          <>
            <AccionesServicio proveedor={existente} onEliminado={() => setExistente(null)} />
            {existente.estado === "rechazado" && (
              <button style={{ ...ui.btnPrimary, marginTop: 12 }} onClick={reenviar}>
                Corregir y volver a enviar
              </button>
            )}
          </>
        )}

        {error && <div style={ui.error}>{error}</div>}
      </div>
    );
  }

  return (
    <form style={ui.page} onSubmit={enviar}>
      <h1 style={ui.h1}>Quiero ofrecer mis servicios</h1>
      <p style={ui.muted}>Completá tus datos y subí la documentación. Un administrador la revisa antes de publicar tu ficha.</p>

      <div style={ui.card}>
        <h2 style={ui.h2}>Datos del servicio</h2>
        <label style={ui.label}>Nombre o marca</label>
        <input style={ui.input} value={form.nombre} onChange={set("nombre")} />

        <label style={ui.label}>Categoría</label>
        <select
          style={ui.input}
          value={form.categoria}
          onChange={(e) => { setForm({ ...form, categoria: e.target.value }); setDocs({}); }}
        >
          <option value="">Elegí una categoría</option>
          {CATEGORIAS.map((c) => <option key={c.valor} value={c.valor}>{c.etiqueta}</option>)}
        </select>

        <label style={ui.label}>Descripción</label>
        <textarea style={{ ...ui.input, minHeight: 100 }} value={form.descripcion} onChange={set("descripcion")} />

        <div style={ui.grid2}>
          <div>
            <label style={ui.label}>Precio desde (ARS)</label>
            <input style={ui.input} type="number" min="0" value={form.precio_desde} onChange={set("precio_desde")} />
          </div>
          <div>
            <label style={ui.label}>WhatsApp (con código de área, solo números)</label>
            <input style={ui.input} value={form.whatsapp} onChange={set("whatsapp")} />
          </div>
          <div>
            <label style={ui.label}>Instagram (usuario o enlace, opcional)</label>
            <input style={ui.input} value={form.instagram} onChange={set("instagram")} />
          </div>
          <div>
            <label style={ui.label}>Zona donde trabajás</label>
            <input style={ui.input} value={form.zona} onChange={set("zona")} />
          </div>
        </div>
      </div>

      <div style={ui.card}>
        <h2 style={ui.h2}>Fotos de tus trabajos</h2>
        <p style={ui.muted}>Entre {MIN_FOTOS} y {MAX_FOTOS} fotos. La primera es la que se ve en la tarjeta.</p>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setFotos([...fotos, ...Array.from(e.target.files)].slice(0, MAX_FOTOS))}
        />
        <div style={ui.thumbs}>
          {fotos.map((f, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <img alt="" src={URL.createObjectURL(f)} style={ui.thumb} />
              <br />
              <button
                type="button"
                style={{ ...ui.btn, padding: "2px 8px" }}
                onClick={() => setFotos(fotos.filter((_, j) => j !== i))}
              >
                Quitar
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={ui.card}>
        <h2 style={ui.h2}>Documentación</h2>
        {!form.categoria && <p style={ui.muted}>Elegí una categoría para ver qué documentos hacen falta.</p>}
        {form.categoria && <p style={ui.muted}>Solo los ve el administrador. Imágenes o PDF.</p>}
        {form.categoria && listaDocs.map((d) => (
          <div key={d.tipo}>
            <label style={ui.label}>{d.label}{d.requerido && " *"}</label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setDocs({ ...docs, [d.tipo]: e.target.files[0] })}
            />
          </div>
        ))}
        {form.categoria === "sonido" && (
          <p style={ui.muted}>Tené en cuenta que, según tu zona, los eventos con música pueden requerir trámites de derechos de autor.</p>
        )}
      </div>

      <div style={ui.card}>
        <label>
          <input type="checkbox" checked={acepta} onChange={(e) => setAcepta(e.target.checked)} />{" "}
          Acepto los términos y condiciones de la plataforma. Se guarda la fecha y hora de mi aceptación.
        </label>
      </div>

      {error && <div style={ui.error}>{error}</div>}
      <button style={ui.btnPrimary} disabled={enviando}>{enviando ? "Enviando…" : "Enviar solicitud"}</button>
    </form>
  );
}