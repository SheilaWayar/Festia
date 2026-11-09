import { useEffect, useState } from "react";
import {
  supabase, CATEGORIAS, subirFoto, fmtPrecio, rutaDeFoto, etiquetaCategoria, DOC_LABELS, ui,
} from "../proveedores/shared";

const CAMPOS = ["nombre", "descripcion", "precio_desde", "whatsapp", "instagram", "facebook", "zona", "imagenes"];

function Fotos({ urls = [] }) {
  return (
    <div style={ui.thumbs}>
      {(urls || []).map((u) => (
        <a key={u} href={u} target="_blank" rel="noreferrer">
          <img alt="" src={u} style={ui.thumb} />
        </a>
      ))}
    </div>
  );
}

function Datos({ d }) {
  return (
    <div style={{ fontSize: 14 }}>
      <div><b>{d.nombre}</b></div>
      <div style={ui.muted}>
        {d.zona || "Sin zona"} · WhatsApp {d.whatsapp || "—"} · Instagram {d.instagram || "—"} · Facebook {d.facebook || "—"} · desde {fmtPrecio(d.precio_desde)}
      </div>
      <p style={{ whiteSpace: "pre-wrap" }}>{d.descripcion}</p>
      <Fotos urls={d.imagenes} />
    </div>
  );
}

function Documentos({ docs }) {
  const [urls, setUrls] = useState(null);
  async function ver() {
    const { data, error } = await supabase.storage
      .from("proveedores-docs")
      .createSignedUrls(docs.map((d) => d.path), 600);
    if (error) return alert(error.message);
    setUrls(Object.fromEntries(data.map((x) => [x.path, x.signedUrl])));
  }
  if (!docs?.length) return <div style={ui.warn}>No subió documentos.</div>;
  return (
    <div>
      {!urls && <button type="button" style={ui.btn} onClick={ver}>Ver documentos</button>}
      {urls && (
        <ul>
          {docs.map((d) => (
            <li key={d.id}>
              <a style={ui.link} href={urls[d.path]} target="_blank" rel="noreferrer">{DOC_LABELS[d.tipo] || d.tipo}</a>
            </li>
          ))}
        </ul>
      )}
      {urls && <div style={ui.muted}>Los enlaces vencen a los 10 minutos.</div>}
    </div>
  );
}

// Formulario para que el admin cree o edite un proveedor
function FormProveedor({ titulo, inicial, onGuardar, onCancelar }) {
  const [f, setF] = useState({
    nombre: inicial.nombre || "",
    categoria: inicial.categoria || "",
    descripcion: inicial.descripcion || "",
    precio_desde: inicial.precio_desde ?? "",
    whatsapp: inicial.whatsapp || "",
    instagram: inicial.instagram || "",
    facebook: inicial.facebook || "",
    zona: inicial.zona || "",
  });
  const [fotos, setFotos] = useState(inicial.imagenes || []); // URLs que se conservan
  const [nuevas, setNuevas] = useState([]); // File[]
  const [guardando, setGuardando] = useState(false);
  const [err, setErr] = useState("");

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function guardar(e) {
    e.preventDefault();
    setErr("");
    if (!f.nombre.trim() || !f.categoria) return setErr("Completá al menos el nombre y la categoría.");
    setGuardando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const subidas = [];
      for (const file of nuevas) subidas.push(await subirFoto(user.id, file));
      const quitadas = (inicial.imagenes || []).filter((u) => !fotos.includes(u));
      await onGuardar(
        {
          nombre: f.nombre.trim(),
          categoria: f.categoria,
          descripcion: f.descripcion.trim() || null,
          precio_desde: f.precio_desde === "" ? null : Number(f.precio_desde),
          whatsapp: f.whatsapp.trim() || null,
          instagram: f.instagram.trim() || null,
          facebook: f.facebook.trim() || null,
          zona: f.zona.trim() || null,
          imagenes: [...fotos, ...subidas],
        },
        quitadas
      );
    } catch (e2) {
      setErr(e2.message || String(e2));
      setGuardando(false);
    }
  }

  return (
    <form style={ui.card} onSubmit={guardar}>
      <h2 style={ui.h2}>{titulo}</h2>

      <label style={ui.label}>Nombre o marca</label>
      <input style={ui.input} value={f.nombre} onChange={set("nombre")} />

      <label style={ui.label}>Categoría</label>
      <select style={ui.input} value={f.categoria} onChange={set("categoria")}>
        <option value="">Elegí una categoría</option>
        {CATEGORIAS.map((c) => <option key={c.valor} value={c.valor}>{c.etiqueta}</option>)}
      </select>

      <label style={ui.label}>Descripción</label>
      <textarea style={{ ...ui.input, minHeight: 90 }} value={f.descripcion} onChange={set("descripcion")} />

      <div style={ui.grid2}>
        <div>
          <label style={ui.label}>Precio desde (ARS)</label>
          <input style={ui.input} type="number" min="0" value={f.precio_desde} onChange={set("precio_desde")} />
        </div>
        <div>
          <label style={ui.label}>Zona</label>
          <input style={ui.input} value={f.zona} onChange={set("zona")} />
        </div>
        <div>
          <label style={ui.label}>WhatsApp (con código de área, solo números)</label>
          <input style={ui.input} value={f.whatsapp} onChange={set("whatsapp")} />
        </div>
        <div>
          <label style={ui.label}>Instagram (usuario o enlace)</label>
          <input style={ui.input} value={f.instagram} onChange={set("instagram")} />
        </div>
        <div>
          <label style={ui.label}>Facebook (usuario o enlace)</label>
          <input style={ui.input} value={f.facebook} onChange={set("facebook")} />
        </div>
      </div>

      <label style={ui.label}>Fotos (la primera se ve en la tarjeta)</label>
      <div style={ui.thumbs}>
        {fotos.map((u) => (
          <div key={u} style={{ textAlign: "center" }}>
            <img alt="" src={u} style={ui.thumb} /><br />
            <button type="button" style={{ ...ui.btn, padding: "2px 8px" }} onClick={() => setFotos(fotos.filter((x) => x !== u))}>Quitar</button>
          </div>
        ))}
        {nuevas.map((file, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <img alt="" src={URL.createObjectURL(file)} style={ui.thumb} /><br />
            <button type="button" style={{ ...ui.btn, padding: "2px 8px" }} onClick={() => setNuevas(nuevas.filter((_, j) => j !== i))}>Quitar</button>
          </div>
        ))}
      </div>
      <input type="file" accept="image/*" multiple onChange={(e) => setNuevas([...nuevas, ...Array.from(e.target.files)])} />

      {err && <div style={ui.error}>{err}</div>}
      <div style={{ ...ui.row, marginTop: 14 }}>
        <button style={ui.btnPrimary} disabled={guardando}>{guardando ? "Guardando…" : "Guardar"}</button>
        <button type="button" style={ui.btn} onClick={onCancelar} disabled={guardando}>Cancelar</button>
      </div>
    </form>
  );
}

export default function ServiciosAdmin() {
  const [tab, setTab] = useState("solicitudes");
  const [solicitudes, setSolicitudes] = useState([]);
  const [cambios, setCambios] = useState([]);
  const [publicados, setPublicados] = useState([]);
  const [editando, setEditando] = useState(null); // null | "nuevo" | id del proveedor
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [ultima, setUltima] = useState(null);
  const [error, setError] = useState("");

  async function cargar() {
    const [s, c, p] = await Promise.all([
      supabase.from("proveedores").select("*, proveedores_documentos(*)").eq("estado", "pendiente").order("created_at"),
      supabase.from("proveedores_cambios").select("*, proveedores(*)").eq("estado", "pendiente").order("created_at"),
      supabase.from("proveedores").select("*").in("estado", ["aprobado", "suspendido"]).order("nombre"),
    ]);
    const err = s.error || c.error || p.error;
    setError(err ? err.message : "");
    setSolicitudes(s.data || []);
    setCambios(c.data || []);
    setPublicados(p.data || []);
    setUltima(new Date());
    setCargando(false);
  }
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { cargar(); }, []);

  async function actualizar() {
    setActualizando(true);
    await new Promise((r) => setTimeout(r, 400));
    await cargar();
    setActualizando(false);
  }

  async function run(fn) {
    setError("");
    try { await fn(); await cargar(); } catch (e) { setError(e.message || String(e)); }
  }

  // ----- Alta y edición hechas por el admin -----
  async function guardarProveedor(id, datos, quitadas) {
    if (id === "nuevo") {
      const { error } = await supabase.from("proveedores").insert({ ...datos, activo: true });
      if (error) throw error;
    } else {
      const { error } = await supabase.from("proveedores")
        .update({ ...datos, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
      const rutas = quitadas.map(rutaDeFoto).filter(Boolean);
      if (rutas.length) await supabase.storage.from("proveedores-fotos").remove(rutas);
    }
    setEditando(null);
    await cargar();
  }

  // "activo" es lo que ve el público; se actualiza junto con el estado
  const aprobar = (p) => run(async () => {
    const { error } = await supabase.from("proveedores")
      .update({ estado: "aprobado", activo: true, motivo_rechazo: null, updated_at: new Date().toISOString() })
      .eq("id", p.id);
    if (error) throw error;
  });

  const rechazar = (p) => {
    const motivo = window.prompt("Motivo del rechazo (lo ve el proveedor):");
    if (motivo === null) return;
    run(async () => {
      const { error } = await supabase.from("proveedores")
        .update({ estado: "rechazado", activo: false, motivo_rechazo: motivo || null }).eq("id", p.id);
      if (error) throw error;
    });
  };

  const aprobarCambio = (c) => run(async () => {
    const nuevos = {};
    CAMPOS.forEach((k) => { if (k in c.datos) nuevos[k] = c.datos[k]; });
    const { error: e1 } = await supabase.from("proveedores")
      .update({ ...nuevos, updated_at: new Date().toISOString() }).eq("id", c.proveedor_id);
    if (e1) throw e1;
    const { error: e2 } = await supabase.from("proveedores_cambios")
      .update({ estado: "aprobado", motivo: null }).eq("id", c.id);
    if (e2) throw e2;
    // Borra del storage las fotos que ya no se usan (solo las que subimos nosotros)
    const nuevasUrls = c.datos.imagenes || [];
    const rutas = (c.proveedores?.imagenes || [])
      .filter((u) => !nuevasUrls.includes(u))
      .map(rutaDeFoto)
      .filter(Boolean);
    if (rutas.length) await supabase.storage.from("proveedores-fotos").remove(rutas);
  });

  const rechazarCambio = (c) => {
    const motivo = window.prompt("Motivo del rechazo (lo ve el proveedor):");
    if (motivo === null) return;
    run(async () => {
      const { error } = await supabase.from("proveedores_cambios")
        .update({ estado: "rechazado", motivo: motivo || null }).eq("id", c.id);
      if (error) throw error;
    });
  };

  const cambiarEstado = (p, estado) => run(async () => {
    const { error } = await supabase.from("proveedores")
      .update({ estado, activo: estado === "aprobado" }).eq("id", p.id);
    if (error) throw error;
  });

  const tabBtn = (id, texto, n) => (
    <button type="button" onClick={() => { setTab(id); setEditando(null); }}
      style={tab === id ? ui.btnPrimary : ui.btn}>
      {texto}{n > 0 ? ` (${n})` : ""}
    </button>
  );

  return (
    <div style={ui.page}>
      <h1 style={ui.h1}>Servicios y proveedores</h1>
      <p style={ui.muted}>Revisá solicitudes nuevas, cambios de fichas y proveedores publicados. También podés cargar proveedores vos.</p>

      <div style={{ ...ui.row, marginBottom: 6 }}>
        {tabBtn("solicitudes", "Solicitudes", solicitudes.length)}
        {tabBtn("cambios", "Cambios pendientes", cambios.length)}
        {tabBtn("publicados", "Publicados", 0)}
        <button type="button" style={{ ...ui.btn, opacity: actualizando ? 0.6 : 1 }} onClick={actualizar} disabled={actualizando}>
          {actualizando ? "Actualizando…" : "Actualizar"}
        </button>
        <button type="button" style={ui.btnPrimary} onClick={() => { setTab("publicados"); setEditando("nuevo"); }}>
          + Nuevo proveedor
        </button>
      </div>
      <div style={{ ...ui.muted, fontSize: 12, marginBottom: 16 }}>
        {ultima && `Última actualización: ${ultima.toLocaleTimeString("es-AR")}`}
      </div>

      {error && <div style={ui.error}>{error}</div>}
      {cargando && <p style={ui.muted}>Cargando…</p>}

      {!cargando && tab === "solicitudes" && (
        solicitudes.length === 0 ? <p style={ui.muted}>No hay solicitudes pendientes.</p> :
        solicitudes.map((p) => (
          <div key={p.id} style={ui.card}>
            <div style={ui.row}>
              <h2 style={{ ...ui.h2, margin: 0 }}>{p.nombre}</h2>
              <span style={ui.badge("#4b6358")}>{etiquetaCategoria(p.categoria)}</span>
            </div>
            <Datos d={p} />
            <div style={ui.muted}>
              Aceptó términos {p.terminos_version}: {p.terminos_aceptados_at ? new Date(p.terminos_aceptados_at).toLocaleString("es-AR") : "sin registro"}
            </div>
            <h3 style={{ ...ui.h2, marginTop: 12 }}>Documentos</h3>
            <Documentos docs={p.proveedores_documentos} />
            <div style={{ ...ui.row, marginTop: 12 }}>
              <button style={ui.btnPrimary} onClick={() => aprobar(p)}>Aprobar</button>
              <button style={ui.btnDanger} onClick={() => rechazar(p)}>Rechazar</button>
            </div>
          </div>
        ))
      )}

      {!cargando && tab === "cambios" && (
        cambios.length === 0 ? <p style={ui.muted}>No hay cambios pendientes.</p> :
        cambios.map((c) => (
          <div key={c.id} style={ui.card}>
            <h2 style={ui.h2}>Cambios en {c.proveedores?.nombre}</h2>
            <div style={ui.grid2}>
              <div><div style={ui.muted}>Publicado hoy</div><Datos d={c.proveedores} /></div>
              <div><div style={ui.muted}>Propuesto</div><Datos d={c.datos} /></div>
            </div>
            <div style={{ ...ui.row, marginTop: 12 }}>
              <button style={ui.btnPrimary} onClick={() => aprobarCambio(c)}>Aprobar cambios</button>
              <button style={ui.btnDanger} onClick={() => rechazarCambio(c)}>Rechazar</button>
            </div>
          </div>
        ))
      )}

      {!cargando && tab === "publicados" && (
        <>
          {editando === "nuevo" && (
            <FormProveedor
              titulo="Nuevo proveedor"
              inicial={{}}
              onGuardar={(datos) => guardarProveedor("nuevo", datos, [])}
              onCancelar={() => setEditando(null)}
            />
          )}

          {publicados.length === 0 && editando !== "nuevo" && (
            <p style={ui.muted}>Todavía no hay proveedores publicados.</p>
          )}

          {publicados.map((p) =>
            editando === p.id ? (
              <FormProveedor
                key={p.id}
                titulo={`Editar ${p.nombre}`}
                inicial={p}
                onGuardar={(datos, quitadas) => guardarProveedor(p.id, datos, quitadas)}
                onCancelar={() => setEditando(null)}
              />
            ) : (
              <div key={p.id} style={ui.card}>
                <div style={ui.row}>
                  <h2 style={{ ...ui.h2, margin: 0 }}>{p.nombre}</h2>
                  <span style={ui.badge("#4b6358")}>{etiquetaCategoria(p.categoria)}</span>
                  <span style={ui.badge(p.estado === "aprobado" ? "#2e7d32" : "#b02a37")}>{p.estado}</span>
                </div>
                <Datos d={p} />
                <div style={ui.row}>
                  <button style={ui.btn} onClick={() => setEditando(p.id)}>Editar</button>
                  {p.estado === "aprobado"
                    ? <button style={ui.btnDanger} onClick={() => cambiarEstado(p, "suspendido")}>Suspender</button>
                    : <button style={ui.btnPrimary} onClick={() => cambiarEstado(p, "aprobado")}>Reactivar</button>}
                </div>
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}