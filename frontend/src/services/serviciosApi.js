import { supabase } from "../lib/supabase";

export const CATEGORIAS = [
  {
    valor: "fotografia",
    etiqueta: "Fotografía",
    titulo: "Fotógrafos",
    descripcion: "Capturá cada momento de tu evento con fotógrafos y videastas profesionales.",
    cta: "Ver fotógrafos",
  },
  {
    valor: "sonido",
    etiqueta: "Sonido",
    titulo: "Sonido y música",
    descripcion: "DJs, bandas y equipos de sonido e iluminación para que la fiesta no pare.",
    cta: "Ver sonido",
  },
  {
    valor: "catering",
    etiqueta: "Catering",
    titulo: "Catering",
    descripcion: "Menús, mesas dulces y servicio de comida para todo tipo de celebración.",
    cta: "Ver catering",
  },
];

export const categoriaDe = (valor) => CATEGORIAS.find((c) => c.valor === valor) ?? null;
export const etiquetaCategoria = (valor) => categoriaDe(valor)?.etiqueta ?? valor;

function revisar({ data, error }) {
  if (error) throw new Error(error.message);
  return data;
}

export const serviciosApi = {
  // Solo los activos (página pública)
  async activos() {
    return revisar(
      await supabase.from("proveedores").select("*").eq("activo", true).order("nombre")
    );
  },

  async porCategoria(categoria) {
    return revisar(
      await supabase
        .from("proveedores")
        .select("*")
        .eq("activo", true)
        .eq("categoria", categoria)
        .order("nombre")
    );
  },

  // Todos (panel admin)
  async todos() {
    return revisar(
      await supabase.from("proveedores").select("*").order("created_at", { ascending: false })
    );
  },

  async crear(datos) {
    return revisar(await supabase.from("proveedores").insert(datos).select().single());
  },

  async actualizar(id, datos) {
    const data = revisar(await supabase.from("proveedores").update(datos).eq("id", id).select());
    if (!data?.length) throw new Error("No se guardó: no tenés permiso o el proveedor no existe.");
    return data[0];
  },

  async eliminar(id) {
    const data = revisar(await supabase.from("proveedores").delete().eq("id", id).select("id"));
    if (!data?.length) throw new Error("No se eliminó: no tenés permiso o el proveedor no existe.");
  },

  // ----- Reseñas -----
  // { [proveedor_id]: { promedio, cantidad } }
  async resumenes() {
    const filas = revisar(await supabase.from("resumen_resenas_proveedores").select("*")) || [];
    return Object.fromEntries(
      filas.map((f) => [f.proveedor_id, { promedio: Number(f.promedio), cantidad: f.cantidad }])
    );
  },

  async resenas(proveedorId) {
    return revisar(
      await supabase
        .from("resenas_proveedores")
        .select("id, user_id, autor_nombre, puntaje, comentario, created_at")
        .eq("proveedor_id", proveedorId)
        .order("created_at", { ascending: false })
        .limit(50)
    );
  },

  // Crea la reseña o, si la persona ya había dejado una, la actualiza
  async guardarResena(proveedorId, puntaje, comentario) {
    revisar(
      await supabase
        .from("resenas_proveedores")
        .upsert(
          { proveedor_id: proveedorId, puntaje, comentario: comentario || null },
          { onConflict: "proveedor_id,user_id" }
        )
        .select("id")
    );
  },

  async borrarResena(id) {
    const data = revisar(await supabase.from("resenas_proveedores").delete().eq("id", id).select("id"));
    if (!data?.length) throw new Error("No se pudo borrar la reseña.");
  },
};