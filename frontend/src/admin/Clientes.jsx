import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { usePerfil } from '../lib/usePerfil'

const f = (n) => '$' + Number(n || 0).toLocaleString('es-AR')
const dia = (d) => new Date(d + 'T00:00').toLocaleDateString('es-AR')
const hora = (h) => String(h).slice(0, 5)
const fechaHora = (t) =>
  new Date(t).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
const vacioNota = { salon: '', puntaje: 0, comentario: '' }

// Estrellas: editables si recibe onChange, de solo lectura si no
function Estrellas({ valor, onChange }) {
  return (
    <span className='inline-flex gap-0.5'>
      {[1, 2, 3, 4, 5].map((n) => {
        const clase = 'text-xl leading-none ' + (n <= valor ? 'text-yellow-600' : 'text-gray-400')
        return onChange ? (
          <button key={n} type='button' className={clase} aria-label={n + ' estrellas'}
            onClick={() => onChange(n === valor ? 0 : n)}>★</button>
        ) : (
          <span key={n} className={clase}>★</span>
        )
      })}
    </span>
  )
}

// Clientes: ficha completa, calificación y comentarios (solo los ven los admin)
export default function Clientes() {
  const { user, perfil } = usePerfil()
  const [lista, setLista] = useState([])
  const [q, setQ] = useState('')
  const [abierto, setAbierto] = useState(null)
  const [info, setInfo] = useState(null)
  const [turnos, setTurnos] = useState([])
  const [notas, setNotas] = useState([])
  const [nota, setNota] = useState(vacioNota)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    supabase.rpc('clientes_de_mis_salones').then(({ data }) => setLista(data || []))
  }, [])

  const cargarNotas = async (id) => {
    const { data } = await supabase.from('cliente_notas').select('*')
      .eq('cliente_id', id).order('created_at', { ascending: false })
    setNotas(data || [])
  }

  const abrir = async (c) => {
    if (abierto === c.user_id) return setAbierto(null)
    setAbierto(c.user_id)
    setInfo(null); setTurnos([]); setNotas([]); setNota(vacioNota); setMsg('')
    const [d, t] = await Promise.all([
      supabase.rpc('cliente_detalle', { p_user: c.user_id }),
      supabase.from('turnos_detalle').select('*').eq('user_id', c.user_id).order('fecha', { ascending: false }),
    ])
    setInfo((d.data || [])[0] || null)
    setTurnos(t.data || [])
    if (d.error) setMsg(d.error.message)
    cargarNotas(c.user_id)
  }

  // salones donde este cliente reservó (para elegir a cuál se refiere la nota)
  const salonesCliente = [...new Map(turnos.map((r) => [r.salon_id, r.salon_nombre])).entries()]
  const nombreSalon = (id) => salonesCliente.find(([sid]) => sid === id)?.[1] || 'Salón ' + id

  const guardarNota = async () => {
    setMsg('')
    const salonId = Number(nota.salon || salonesCliente[0]?.[0])
    if (!salonId) return setMsg('Elegí un salón')
    if (!nota.puntaje && !nota.comentario.trim()) return setMsg('Poné una calificación o un comentario')
    const { error } = await supabase.from('cliente_notas').insert({
      cliente_id: abierto,
      salon_id: salonId,
      autor_id: user.id,
      autor_nombre: perfil?.nombre || null,
      puntaje: nota.puntaje || null,
      comentario: nota.comentario.trim() || null,
    })
    if (error) return setMsg(error.message)
    setNota(vacioNota)
    cargarNotas(abierto)
    supabase.rpc('cliente_detalle', { p_user: abierto }).then(({ data }) => setInfo((data || [])[0] || info))
  }

  const borrarNota = async (id) => {
    const { error } = await supabase.from('cliente_notas').delete().eq('id', id)
    if (error) return setMsg(error.message)
    cargarNotas(abierto)
    supabase.rpc('cliente_detalle', { p_user: abierto }).then(({ data }) => setInfo((data || [])[0] || info))
  }

  const visibles = lista.filter((c) =>
    !q || ((c.usuario || '') + ' ' + (c.email || '')).toLowerCase().includes(q.toLowerCase()))

  const dato = (v) => v || '—'
  const sinDatos = info && !info.apellido && !info.dni && !info.direccion && !info.telefono

  return (
    <div className='space-y-3'>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder='Buscar cliente o email'
        className='w-full rounded border px-3 py-2 text-sm' />

      {visibles.map((c) => (
        <div key={c.user_id} className='rounded-xl border bg-white'>
          <button onClick={() => abrir(c)} className='flex w-full flex-wrap items-center justify-between gap-2 p-3 text-left'>
            <span>
              <b>{c.usuario}</b>
              <span className='block text-xs text-gray-400'>{c.email}</span>
            </span>
            <span className='text-sm text-gray-600'>
              {c.reservas} turnos · último {dia(c.ultima)} · pagó {f(c.total_pagado)}
            </span>
          </button>

          {abierto === c.user_id && (
            <div className='space-y-4 border-t p-3 text-sm'>
              {/* Ficha del cliente */}
              <section className='space-y-2'>
                <div className='flex flex-wrap items-center justify-between gap-2'>
                  <h3>Datos del cliente</h3>
                  {info && info.calificaciones > 0 && (
                    <span className='flex items-center gap-2'>
                      <Estrellas valor={Math.round(info.promedio)} />
                      <span className='text-gray-500'>{info.promedio} ({info.calificaciones})</span>
                    </span>
                  )}
                </div>
                {info ? (
                  <div className='grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2'>
                    <p><span className='text-gray-500'>Nombre: </span>{dato(info.nombre)}</p>
                    <p><span className='text-gray-500'>Apellido: </span>{dato(info.apellido)}</p>
                    <p><span className='text-gray-500'>DNI: </span>{dato(info.dni)}</p>
                    <p><span className='text-gray-500'>Teléfono: </span>{dato(info.telefono)}</p>
                    <p><span className='text-gray-500'>Correo: </span>{dato(info.email)}</p>
                    <p><span className='text-gray-500'>Dirección: </span>{dato(info.direccion)}</p>
                  </div>
                ) : (
                  <p className='text-gray-400'>Cargando…</p>
                )}
                {sinDatos && (
                  <p className='text-gray-400'>Este cliente todavía no completó sus datos en «Mis datos».</p>
                )}
              </section>

              {/* Calificación y comentarios internos */}
              <section className='space-y-2'>
                <h3>Calificación y comentarios <span className='text-xs text-gray-400'>(solo los ven los admin)</span></h3>

                <div className='space-y-2 rounded-lg border p-3'>
                  <div className='flex flex-wrap items-center gap-3'>
                    <Estrellas valor={nota.puntaje} onChange={(p) => setNota({ ...nota, puntaje: p })} />
                    {salonesCliente.length > 1 && (
                      <select value={nota.salon || salonesCliente[0][0]}
                        onChange={(e) => setNota({ ...nota, salon: e.target.value })}
                        className='rounded border bg-white px-2 py-1'>
                        {salonesCliente.map(([id, nombre]) => <option key={id} value={id}>{nombre}</option>)}
                      </select>
                    )}
                  </div>
                  <textarea value={nota.comentario} maxLength={500}
                    onChange={(e) => setNota({ ...nota, comentario: e.target.value })}
                    placeholder='Comentario sobre este cliente (puntualidad, trato, daños…)'
                    className='h-20 w-full rounded border px-3 py-2' />
                  <button onClick={guardarNota} className='rounded bg-indigo-600 px-4 py-2 text-white'>Guardar nota</button>
                  {msg && <p className='text-red-600'>{msg}</p>}
                </div>

                {notas.map((n) => (
                  <div key={n.id} className='rounded-lg border p-3'>
                    <div className='flex flex-wrap items-center justify-between gap-2'>
                      <span className='flex items-center gap-2'>
                        {n.puntaje ? <Estrellas valor={n.puntaje} /> : null}
                        <span className='text-xs text-gray-500'>
                          {n.autor_nombre || 'Admin'} · {nombreSalon(n.salon_id)} · {fechaHora(n.created_at)}
                        </span>
                      </span>
                      {(n.autor_id === user?.id || perfil?.rol === 'superadmin') && (
                        <button onClick={() => borrarNota(n.id)} className='text-xs text-red-600'>Borrar</button>
                      )}
                    </div>
                    {n.comentario && <p className='mt-1'>{n.comentario}</p>}
                  </div>
                ))}
                {!notas.length && <p className='text-gray-400'>Todavía no hay notas sobre este cliente.</p>}
              </section>

              {/* Turnos */}
              <section className='space-y-1'>
                <h3>Turnos</h3>
                {turnos.map((r) => (
                  <div key={r.id} className='flex flex-wrap justify-between gap-2'>
                    <span>{dia(r.fecha)} {hora(r.hora_inicio)}-{hora(r.hora_fin)} · {r.salon_nombre}</span>
                    <span className='text-gray-500'>{r.estado} · {r.estado_pago} · {f(r.monto_pagado)} de {f(r.monto_total)}</span>
                  </div>
                ))}
                {!turnos.length && <p className='text-gray-400'>Cargando…</p>}
              </section>
            </div>
          )}
        </div>
      ))}
      {!visibles.length && <p className='text-gray-400'>Todavía no hay clientes.</p>}
    </div>
  )
}