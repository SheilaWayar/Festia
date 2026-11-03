import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const url = Deno.env.get('SUPABASE_URL')!

  // 1. Quién es el usuario (por su token de sesión)
  const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } })
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return json({ error: 'No autenticado' }, 401)

  const { turno_id, modo } = await req.json()
  const db = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  // 2. El turno tiene que ser del usuario
  const { data: t } = await db.from('turnos')
    .select('id, monto_total, monto_pagado, estado, salones(nombre, sena_porcentaje)')
    .eq('id', turno_id).eq('user_id', user.id).single()
  if (!t) return json({ error: 'Turno no encontrado' }, 404)
  if (!['pendiente', 'confirmado'].includes(t.estado)) return json({ error: 'Este turno ya no admite pagos' }, 400)

  // 3. El monto se calcula acá, nunca se confía en el navegador
  const total = Number(t.monto_total)
  const saldo = total - Number(t.monto_pagado)
  if (saldo <= 0) return json({ error: 'El turno ya está pago' }, 400)
  const sena = Math.min(Math.round(total * t.salones.sena_porcentaje / 100), saldo)
  const importe = modo === 'total' || Number(t.monto_pagado) >= sena ? saldo : sena
  const tipo = importe >= saldo ? 'total' : 'sena'

  // 4. URL del sitio (sin barra final) y chequeo
  const front = (Deno.env.get('FRONTEND_URL') ?? '').replace(/\/+$/, '')
  if (!front.startsWith('http')) {
    console.error('FRONTEND_URL no está configurada:', front)
    return json({ error: 'Falta configurar FRONTEND_URL en los secretos de Supabase' }, 500)
  }
  if (!Deno.env.get('MP_ACCESS_TOKEN')) return json({ error: 'Falta MP_ACCESS_TOKEN' }, 500)

  // 5. Registrar el pago como pendiente
  const { data: pago, error: e1 } = await db.from('pagos')
    .insert({ turno_id: t.id, user_id: user.id, monto: importe, tipo, metodo: 'mercadopago', estado: 'pendiente' })
    .select().single()
  if (e1) return json({ error: e1.message }, 400)

  // 6. Preferencia de Mercado Pago
  const cuerpo: Record<string, unknown> = {
    items: [{ title: 'Turno en ' + t.salones.nombre + ' (' + tipo + ')', quantity: 1, unit_price: importe, currency_id: 'ARS' }],
    external_reference: String(pago.id),
    notification_url: url + '/functions/v1/mp-webhook',
    back_urls: {
      success: front + '/mis-turnos?pago=ok',
      failure: front + '/mis-turnos?pago=error',
      pending: front + '/mis-turnos?pago=pendiente',
    },
  }
  // Mercado Pago solo acepta auto_return con https
  if (front.startsWith('https://')) cuerpo.auto_return = 'approved'

  const resp = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + Deno.env.get('MP_ACCESS_TOKEN') },
    body: JSON.stringify(cuerpo),
  })
  const pref = await resp.json()

  if (!pref.init_point) {
    console.error('MP rechazó la preferencia', resp.status, JSON.stringify(pref))
    await db.from('pagos').delete().eq('id', pago.id) // no dejar pagos pendientes huérfanos
    return json({ error: 'Mercado Pago no devolvió el link', mp_status: resp.status, detalle: pref }, 502)
  }
  await db.from('pagos').update({ mp_preference_id: pref.id }).eq('id', pago.id)
  return json({ init_point: pref.init_point, pago_id: pago.id })
})