import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase, subirFoto, etiquetaCategoria, MIN_FOTOS, MAX_FOTOS, fmtPrecio, ui } from "./shared";

export default function MiFichaProveedor() {
  const [user, setUser] = useState(null);
  const [prov, setProv] = useState(null);
  const [pendiente, setPendiente] = useState(null);
  const [rechazado, setRechazado] = useState(null);
  const [form, setForm] = useState(null);
  const [fotosActuales, setFotosActuales] = useState([]); // URLs ya subidas
  const [fotosNuevas, setFotosNuevas] = useState([]); // File[]
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  async function cargar() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (!user) return setCargando(false);

    const { data: p } = await supabase.from("proveedores").select("*").eq("user_id", user.id).maybeSingle();
    setProv(p);
    if (p) {
      const { data: cambios } = await supabase
        .from("proveedores_cambios").select("*").eq("proveedor_id", p.id)
        .order("created_at", { ascending: false });
      const pend = (cambios || []).find((c) => c.estado === "pendiente") || null;
      const ultimo = (cambios || [])[0];
      setPendiente(pend);
      setRechazado(!pend && ultimo?.estado === "rechazado" ? ultimo : null);
      const base = pend ? pend.datos : p;
      setForm({
        nombre: base.nombre || "",
        descripcion: base.descripcion || "",
        precio_desde: base.precio_desde ?? "",
        whatsapp: base.whatsapp || "",
        instagram: base.instagram || "",
        zona: base.zona || "",
      });
      setFotosActuales(base.imagenes || []);
      setFotosNuevas([]);
    }
    setCargando(false);
  }
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { cargar(); }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function enviar(e) {
    e.preventDefault();
    setError(""); setMsg("");
    if (!form.nombre.trim() || !form.descripcion.trim() || !form.whatsapp.trim() || !form.zona.trim())
      return setError("Completá nombre, descripción, WhatsApp y zona.");
    if (fotosActuales.length + fotosNuevas.length < MIN_FOTOS) return setError(`Tiene que haber al menos ${MIN_FOTOS} fotos.`);
    if (fotosActuales.length + fotosNuevas.length > MAX_FOTOS) return setError(`Máximo ${MAX_FOTOS} fotos.`);

    setEnviando(true);
    try {
      const nuevas = [];
      for (const f of fotosNuevas) nuevas.push(await subirFoto(user.id, f));

      // Reemplaza cualquier cambio pendiente anterior
      if (pendiente) {
        const { error: ed } = await supabase.from("proveedores_cambios").delete().eq("id", pendiente.id);
        if (ed) throw ed;
      }
      const { error: ei } = await supabase.from("proveedores_cambios").insert({
        proveedor_id: prov.id,
        estado: "pendiente",
        datos: {
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim(),
          precio_desde: form.precio_desde === "" ? null : Number(form.precio_desde),
          whatsapp: form.whatsapp.trim(),
          instagram: form.instagram.trim() || null,
          zona: form.zona.trim(),
          imagenes: [...fotosActuales, ...nuevas],
        },
      });
      if (ei) throw ei;
      setMsg("Enviamos tus cambios. Se publican cuando el administrador los apruebe; mientras tanto se sigue viendo la versión anterior.");
      await cargar();
    } catch (err) {
      setError(err.message || "No se pudieron enviar los cambios.");
    } finally {
      setEnviando(false);
    }
  }

  async function cancelarPendiente() {
    const { error } = await supabase.from("proveedores_cambios").delete().eq("id", pendiente.id);
    if (error) return setError(error.message);
    setMsg("Cancelaste los cambios pendientes.");
    cargar();
  }

  if (cargando) return <div style={ui.page}>Cargando…</div>;
  if (!user) return <div style={ui.page}><div style={ui.warn}>Iniciá sesión para editar tu ficha.</div><Link to="/login" style={ui.link}>Iniciar sesión</Link></div>;
  if (!prov) return <div style={ui.page}><p>Todavía no sos proveedor.</p><Link to="/proveedores/registro" style={ui.link}>Quiero ofrecer mis servicios</Link></div>;
  if (prov.estado !== "aprobado")
    return <div style={ui.page}><div style={ui.warn}>Tu ficha está en estado <b>{prov.estado}</b>. Podés editarla cuando esté aprobada.</div><Link to="/proveedores/registro" style={ui.link}>Ver estado de mi solicitud</Link></div>;

  return (
    <form style={ui.page} onSubmit={enviar}>
      <h1 style={ui.h1}>Mi ficha</h1>
      <p style={ui.muted}>Categoría: {etiquetaCategoria(prov.categoria)} · Precio publicado: {fmtPrecio(prov.precio_desde)}</p>

      {pendiente && (
        <div style={ui.warn}>
          Tenés cambios pendientes de aprobación. El público sigue viendo la versión anterior.{" "}
          <button type="button" style={ui.btn} onClick={cancelarPendiente}>Cancelar cambios</button>
        </div>
      )}
      {rechazado && (
        <div style={ui.error}>El administrador rechazó tus últimos cambios.{rechazado.motivo && <> Motivo: <b>{rechazado.motivo}</b></>}</div>
      )}
      {msg && <div style={ui.okBox}>{msg}</div>}

      <div style={ui.card}>
        <label style={ui.label}>Nombre o marca</label>
        <input style={ui.input} value={form.nombre} onChange={set("nombre")} />
        <label style={ui.label}>Descripción</label>
        <textarea style={{ ...ui.input, minHeight: 100 }} value={form.descripcion} onChange={set("descripcion")} />
        <div style={ui.grid2}>
          <div><label style={ui.label}>Precio desde (ARS)</label><input style={ui.input} type="number" min="0" value={form.precio_desde} onChange={set("precio_desde")} /></div>
          <div><label style={ui.label}>WhatsApp (con código de área, solo números)</label><input style={ui.input} value={form.whatsapp} onChange={set("whatsapp")} /></div>
          <div><label style={ui.label}>Instagram (usuario o enlace, opcional)</label><input style={ui.input} value={form.instagram} onChange={set("instagram")} /></div>
          <div><label style={ui.label}>Zona donde trabajás</label><input style={ui.input} value={form.zona} onChange={set("zona")} /></div>
        </div>
      </div>

      <div style={ui.card}>
        <h2 style={ui.h2}>Fotos</h2>
        <div style={ui.thumbs}>
          {fotosActuales.map((url) => (
            <div key={url} style={{ textAlign: "center" }}>
              <img alt="" src={url} style={ui.thumb} /><br />
              <button type="button" style={{ ...ui.btn, padding: "2px 8px" }} onClick={() => setFotosActuales(fotosActuales.filter((x) => x !== url))}>Quitar</button>
            </div>
          ))}
          {fotosNuevas.map((f, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <img alt="" src={URL.createObjectURL(f)} style={ui.thumb} /><br />
              <button type="button" style={{ ...ui.btn, padding: "2px 8px" }} onClick={() => setFotosNuevas(fotosNuevas.filter((_, j) => j !== i))}>Quitar</button>
            </div>
          ))}
        </div>
        <input type="file" accept="image/*" multiple onChange={(e) => setFotosNuevas([...fotosNuevas, ...Array.from(e.target.files)])} />
      </div>

      {error && <div style={ui.error}>{error}</div>}
      <button style={ui.btnPrimary} disabled={enviando}>{enviando ? "Enviando…" : "Enviar cambios para aprobación"}</button>
    </form>
  );
}