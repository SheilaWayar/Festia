// =====================================================================
// Constantes y utilidades compartidas del módulo de proveedores.
// =====================================================================
import { supabase } from "../../lib/supabase";
export { supabase };

// Las categorías son las de tu sección pública (fotografia, sonido, catering, planeadores)
export { CATEGORIAS, etiquetaCategoria } from "../../services/serviciosApi";

export const TERMINOS_VERSION = "v1";
export const MIN_FOTOS = 3;
export const MAX_FOTOS = 10;
export const MAX_MB = 10;

export const DOCS_BASE = [
  { tipo: "dni_frente", label: "DNI (frente)", requerido: true },
  { tipo: "dni_dorso", label: "DNI (dorso)", requerido: true },
  {
    tipo: "arca",
    label: "Constancia de inscripción en ARCA (monotributo o responsable inscripto)",
    requerido: true,
  },
];

export const DOCS_EXTRA = {
  catering: [
    {
      tipo: "libreta_sanitaria",
      label: "Libreta sanitaria o carnet de manipulación de alimentos",
      requerido: true,
    },
    {
      tipo: "habilitacion_lugar",
      label: "Habilitación del lugar donde elabora (si corresponde)",
      requerido: false,
    },
  ],
  fotografia: [],
  sonido: [],
  planeadores: [],
};

export const DOC_SEGURO = {
  tipo: "seguro_rc",
  label: "Seguro de responsabilidad civil (opcional)",
  requerido: false,
};

export const docsPara = (categoria) => [
  ...DOCS_BASE,
  ...(DOCS_EXTRA[categoria] || []),
  DOC_SEGURO,
];

export const DOC_LABELS = Object.fromEntries(
  [...DOCS_BASE, ...Object.values(DOCS_EXTRA).flat(), DOC_SEGURO].map((d) => [d.tipo, d.label])
);

// Sube un archivo y devuelve la ruta dentro del bucket
export async function subirArchivo(bucket, userId, file, prefijo = "") {
  if (file.size > MAX_MB * 1024 * 1024) {
    throw new Error(`"${file.name}" pesa más de ${MAX_MB} MB.`);
  }
  const limpio = file.name.normalize("NFD").replace(/[^\w.-]/g, "_");
  const path = `${userId}/${prefijo}${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${limpio}`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType: file.type });
  if (error) throw error;
  return path;
}

// Sube una foto y devuelve su URL pública (es lo que se guarda en "imagenes")
export async function subirFoto(userId, file) {
  const path = await subirArchivo("proveedores-fotos", userId, file);
  return supabase.storage.from("proveedores-fotos").getPublicUrl(path).data.publicUrl;
}

// De una URL pública saca la ruta del archivo (null si la foto no es de nuestro bucket)
export function rutaDeFoto(url) {
  const marca = "/proveedores-fotos/";
  const i = (url || "").indexOf(marca);
  if (i === -1) return null;
  return decodeURIComponent(url.slice(i + marca.length).split("?")[0]);
}

export const fmtPrecio = (n) =>
  n === null || n === undefined || n === ""
    ? "—"
    : new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

// ---------------------------------------------------------------------
// Estilos: verde oscuro con dorado (tema Festia).
// ---------------------------------------------------------------------
const C = {
  fondoCard: "#0f2f29",
  fondoInput: "#0a241f",
  borde: "rgba(226, 191, 117, 0.28)",
  bordeFuerte: "rgba(226, 191, 117, 0.55)",
  dorado: "#e2bf75",
  texto: "#f3ead7",
  tenue: "#9db3a8",
  verdeOscuro: "#0a2420",
  rojo: "#f0a39a",
  rojoBorde: "rgba(224, 122, 111, 0.5)",
};

export const ui = {
  page: { maxWidth: 900, margin: "0 auto", padding: "24px 16px", fontFamily: "inherit", color: C.texto },
  card: { border: `1px solid ${C.borde}`, borderRadius: 12, padding: 18, marginBottom: 16, background: C.fondoCard, color: C.texto },
  h1: { fontSize: 28, margin: "0 0 4px", color: "#f6edd8" },
  h2: { fontSize: 18, margin: "0 0 10px", color: C.dorado },
  muted: { color: C.tenue, fontSize: 14 },
  link: { color: C.dorado },
  label: { display: "block", fontWeight: 600, margin: "12px 0 4px", fontSize: 14, color: "#e9dcc0" },
  input: {
    width: "100%", padding: "9px 11px", border: `1px solid ${C.bordeFuerte}`, borderRadius: 8,
    fontSize: 15, boxSizing: "border-box", color: C.texto, background: C.fondoInput, colorScheme: "dark",
  },
  btn: {
    padding: "8px 14px", borderRadius: 8, border: `1px solid ${C.bordeFuerte}`,
    background: "transparent", color: C.dorado, cursor: "pointer", fontSize: 14,
  },
  btnPrimary: {
    padding: "8px 14px", borderRadius: 8, border: `1px solid ${C.dorado}`,
    background: C.dorado, color: C.verdeOscuro, cursor: "pointer", fontSize: 14, fontWeight: 600,
  },
  btnDanger: {
    padding: "8px 14px", borderRadius: 8, border: `1px solid ${C.rojoBorde}`,
    background: "transparent", color: C.rojo, cursor: "pointer", fontSize: 14,
  },
  row: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" },
  grid2: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 },
  thumbs: { display: "flex", gap: 8, flexWrap: "wrap", margin: "8px 0" },
  thumb: { width: 96, height: 96, objectFit: "cover", borderRadius: 8, border: `1px solid ${C.borde}` },
  error: { background: "rgba(224, 122, 111, 0.14)", color: "#f4b3ab", border: `1px solid ${C.rojoBorde}`, padding: 10, borderRadius: 8, margin: "12px 0" },
  okBox: { background: "rgba(120, 200, 150, 0.14)", color: "#a6e0bd", border: "1px solid rgba(120, 200, 150, 0.4)", padding: 10, borderRadius: 8, margin: "12px 0" },
  warn: { background: "rgba(226, 191, 117, 0.12)", color: "#ecd397", border: `1px solid ${C.borde}`, padding: 10, borderRadius: 8, margin: "12px 0" },
  badge: (color) => ({ display: "inline-block", padding: "2px 10px", borderRadius: 99, fontSize: 12, background: color, color: "#fff" }),
};