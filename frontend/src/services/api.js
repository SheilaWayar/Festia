// =====================================================================
// src/services/api.js  ·  VERSIÓN SUPABASE (reemplaza al que hablaba con FastAPI)
// Autora: Sheila
//
// Truco: tus archivos salonesApi.js, turnosApi.js, resenasApi.js y authApi.js
// siguen llamando a request('/turnos', {...}) igual que antes. Acá adentro
// cada ruta de tu API vieja se traduce a una consulta de Supabase y devuelve
// el mismo formato de respuesta. Los componentes no se tocan.
// =====================================================================
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// ---------- ayudas ----------
function lanzar(error) {
  if (!error) return
  if (error.code === '23P01') throw new Error('Ese horario ya está ocupado, elegí otro.')
  if (error.code === '42501') throw new Error('No tenés permiso para hacer eso.')
  if (error.code === 'PGRST116') throw new Error('No se encontró lo que buscabas.')
  throw new Error(error.message || 'Ocurrió un error inesperado')
}

function datos({ data, error }) {
  lanzar(error)
  return data
}

async function mensajeDeFuncion(error) {
  try {
    const cuerpo = await error.context.json()
    return cuerpo.error || error.message
  } catch {
    return error.message
  }
}

async function usuarioId() {
  const { data } = await supabase.auth.getSession()
  const id = data.session?.user?.id
  if (!id) throw new Error('Iniciá sesión para continuar')
  return id
}

async function turnoPorId(id) {
  return datos(await supabase.from('turnos_detalle').select('*').eq('id', id).single())
}

// compara una ruta como 'salones/:id/resenas' con los segmentos reales
function coincide(patron, segmentos) {
  const p = patron.split('/')
  if (p.length !== segmentos.length) return null
  const params = {}
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(':')) params[p[i].slice(1)] = segmentos[i]
    else if (p[i] !== segmentos[i]) return null
  }
  return params
}

// ---------- rutas: [método, patrón, función(params, query, body)] ----------
const rutas = [
  // ===== SALONES =====
  ['GET', 'salones', async (_p, q) => {
    let consulta = supabase.from('salones').select('*').eq('activo', true).order('nombre')
    if (q.capacidad_min) consulta = consulta.gte('capacidad', Number(q.capacidad_min))
    if (q.tipo_evento) consulta = consulta.contains('tipos_evento', [q.tipo_evento])
    if (q.q) {
      const t = q.q.replace(/[,()%]/g, ' ').trim()
      consulta = consulta.or('nombre.ilike.%' + t + '%,direccion.ilike.%' + t + '%,descripcion.ilike.%' + t + '%')
    }
    return datos(await consulta)
  }],
  ['POST', 'salones', async (_p, _q, b) => datos(await supabase.from('salones').insert(b).select().single())],
  ['GET', 'salones/:id', async (p) => datos(await supabase.from('salones').select('*').eq('id', Number(p.id)).single())],
  ['PUT', 'salones/:id', async (p, _q, b) =>
    datos(await supabase.from('salones').update(b).eq('id', Number(p.id)).select().single())],
  ['DELETE', 'salones/:id', async (p) => {
    lanzar((await supabase.from('salones').delete().eq('id', Number(p.id))).error)
    return null
  }],

  // calendario: devuelve [{fecha, hora_inicio, hora_fin}] (y también .ocupados por las dudas)
  ['GET', 'salones/:id/disponibilidad', async (p, q) => {
    const lista = datos(await supabase.rpc('disponibilidad', { p_salon: Number(p.id), p_mes: q.mes })) || []
    lista.ocupados = lista
    return lista
  }],

  // historial de turnos de un salón (solo salón / admin)
  ['GET', 'salones/:id/turnos', async (p) =>
    datos(await supabase.from('turnos_detalle').select('*').eq('salon_id', Number(p.id))
      .order('fecha', { ascending: false }).order('hora_inicio', { ascending: false }))],

  // ===== RESEÑAS =====
  ['GET', 'resenas/resumen', async () => datos(await supabase.rpc('resumen_resenas'))],
  ['GET', 'salones/:id/resenas', async (p, q) =>
    datos(await supabase.rpc('resenas_pagina', {
      p_salon: Number(p.id), p_page: Number(q.page || 1), p_limit: Number(q.limit || 3),
    }))],
  ['GET', 'salones/:id/resenas/estado', async (p) =>
    datos(await supabase.rpc('estado_para_resenar', { p_salon: Number(p.id) }))],
  ['POST', 'salones/:id/resenas', async (p, _q, b) =>
    datos(await supabase.rpc('crear_resena', { p_salon: Number(p.id), p_puntaje: b.puntaje, p_comentario: b.comentario ?? null }))],
  ['PUT', 'salones/:id/resenas/mia', async (p, _q, b) =>
    datos(await supabase.rpc('editar_mi_resena', { p_salon: Number(p.id), p_puntaje: b.puntaje, p_comentario: b.comentario ?? null }))],
  ['DELETE', 'salones/:id/resenas/:rid', async (p) => {
    lanzar((await supabase.rpc('borrar_resena', { p_id: Number(p.rid) })).error)
    return null
  }],

  // ===== TURNOS =====
  ['POST', 'turnos', async (_p, _q, b) => {
    const fila = datos(await supabase.from('turnos').insert({
      salon_id: b.salon_id, fecha: b.fecha, hora_inicio: b.hora_inicio,
      hora_fin: b.hora_fin, tipo_evento: b.tipo_evento ?? null,
    }).select('id').single())
    return turnoPorId(fila.id)
  }],
  ['GET', 'turnos/mios', async () => {
    const uid = await usuarioId()
    return datos(await supabase.from('turnos_detalle').select('*').eq('user_id', uid)
      .order('fecha', { ascending: false }).order('hora_inicio', { ascending: false }))
  }],
  ['GET', 'turnos', async (_p, q) => {
    let consulta = supabase.from('turnos_detalle').select('*')
      .order('fecha', { ascending: false }).order('hora_inicio', { ascending: false })
    if (q.salon_id) consulta = consulta.eq('salon_id', Number(q.salon_id))
    if (q.fecha) consulta = consulta.eq('fecha', q.fecha)
    if (q.estado) consulta = consulta.eq('estado', q.estado)
    return datos(await consulta)
  }],
  ['PATCH', 'turnos/:id/estado', async (p, _q, b) => {
    lanzar((await supabase.rpc('cambiar_estado_turno', { p_id: Number(p.id), p_estado: b.estado })).error)
    return turnoPorId(Number(p.id))
  }],
  ['PATCH', 'turnos/:id/confirmar', async (p) => {
    lanzar((await supabase.rpc('confirmar_turno', { p_id: Number(p.id) })).error)
    return turnoPorId(Number(p.id))
  }],
  ['PATCH', 'turnos/:id/rechazar', async (p, _q, b) => {
    lanzar((await supabase.rpc('rechazar_turno', { p_id: Number(p.id), p_motivo: b.motivo })).error)
    return turnoPorId(Number(p.id))
  }],
  ['PATCH', 'turnos/:id/finalizar', async (p, _q, b) => {
    lanzar((await supabase.rpc('finalizar_turno', {
      p_id: Number(p.id), p_deposito: b.deposito, p_comentario: b.comentario ?? null,
    })).error)
    return turnoPorId(Number(p.id))
  }],
  ['DELETE', 'turnos/:id', async (p) => {
    lanzar((await supabase.rpc('cancelar_turno', { p_id: Number(p.id) })).error)
    return null
  }],

  // ===== PAGOS =====
  ['POST', 'pagos/crear-pago/:id', async (p, _q, b) => {
    const { data, error } = await supabase.functions.invoke('crear-pago', {
      body: { turno_id: Number(p.id), modo: b.modo },
    })
    if (error) throw new Error(await mensajeDeFuncion(error))
    if (data?.error) throw new Error(data.error)
    return { ...data, url: data.init_point }
  }],
  ['POST', 'pagos/:id/manual', async (p, _q, b) => {
    lanzar((await supabase.rpc('registrar_pago_manual', {
      p_turno: Number(p.id), p_monto: Number(b.monto), p_metodo: b.metodo,
    })).error)
    return { ok: true }
  }],

  // ===== TIPOS DE EVENTO =====
  ['GET', 'tipos-evento', async () => {
    const filas = datos(await supabase.from('salones').select('tipos_evento').eq('activo', true)) || []
    return [...new Set(filas.flatMap((f) => f.tipos_evento || []))].sort()
  }],

  // ===== AUTENTICACIÓN =====
  ['POST', 'auth/registro', async (_p, _q, b) => {
    const { data, error } = await supabase.auth.signUp({
      email: b.email, password: b.password, options: { data: { nombre: b.nombre } },
    })
    if (error) {
      if (/already/i.test(error.message)) throw new Error('Ese email ya está registrado')
      throw new Error(error.message)
    }
    if (!data.session) {
      return { ok: true, requiere_confirmacion: true, mensaje: 'Revisá tu mail para confirmar la cuenta.' }
    }
    return respuestaDeSesion(data.session, b.nombre)
  }],
  ['POST', 'auth/login', async (_p, _q, b) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: b.email, password: b.password })
    if (error) throw new Error('Email o contraseña incorrectos')
    return respuestaDeSesion(data.session)
  }],
]

// Arma una respuesta de login con varios nombres de campo para que
// tu AuthContext (que no vi) encuentre lo que busca. Ver paso «AuthContext» de la guía.
async function respuestaDeSesion(sesion, nombreRegistro) {
  const u = sesion.user
  const { data: perfil } = await supabase.from('perfiles').select('nombre, rol').eq('id', u.id).single()
  const usuario = {
    id: u.id,
    email: u.email,
    nombre: perfil?.nombre || nombreRegistro || u.email,
    rol: perfil?.rol || 'usuario',
  }
  localStorage.setItem('token', sesion.access_token) // por si tu AuthContext lo lee de acá
  return { access_token: sesion.access_token, token: sesion.access_token, token_type: 'bearer', usuario, user: usuario, ...usuario }
}

// ---------- la función que usa todo tu frontend (misma firma que antes) ----------
export async function request(path, options = {}) {
  const metodo = (options.method || 'GET').toUpperCase()
  const [ruta, qs = ''] = path.split('?')
  const query = Object.fromEntries(new URLSearchParams(qs))
  const cuerpo = options.body ? JSON.parse(options.body) : {}
  const segmentos = ruta.split('/').filter(Boolean)

  for (const [m, patron, fn] of rutas) {
    if (m !== metodo) continue
    const params = coincide(patron, segmentos)
    if (params) return fn(params, query, cuerpo)
  }
  throw new Error('Ruta no implementada: ' + metodo + ' ' + path)
}