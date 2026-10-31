import { createClient } from 'npm:@supabase/supabase-js@2'

const esc = (t: string) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace/>/g, '&gt;')


Deno.serve(async (req) => {
  // Solo acepta llamadas del webhook de la base (lleva un secreto compartido)
  const secreto = Deno.env.get('WEBHOOK_SECRET')
  if (secreto && req.headers.get('x-webhook-secret') !== secreto) {
    return new Response('forbidden', { status: 403 })
  }

  const { type, record } = await req.json()
  if (type !== 'INSERT' || !record?.enviar_mail) return new Response('ok')

  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data } = await db.auth.admin.getUserById(record.user_id)
  const email = data?.user?.email
  if (!email) return new Response('usuario sin email')

  const front = Deno.env.get('FRONTEND_URL') ?? ''
  const boton = record.link
    ? '<p><a href="' + front + record.link + '" style="background:#4f46e5;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Ver en la plataforma</a></p>'
    : ''

  const html =
    '<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto">' +
    '<h2 style="color:#4f46e5">' + esc(record.titulo) + '</h2>' +
    '<p>' + esc(record.mensaje) + '</p>' + boton +
    '<p style="color:#999;font-size:12px">Plataforma de Salones</p></div>'

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + Deno.env.get('RESEND_API_KEY'),
    },
    body: JSON.stringify({
      from: Deno.env.get('MAIL_FROM') ?? 'Salones <onboarding@resend.dev>',
      to: [email],
      subject: record.titulo,
      html,
    }),
  })

  if (!r.ok) {
    console.error(await r.text())
    return new Response('error al enviar', { status: 502 })
  }

  return new Response('ok')
})