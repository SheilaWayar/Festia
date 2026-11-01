import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const f = (n) => '$' + Number(n || 0).toLocaleString('es-AR')
const dia = (d) => new Date(d + 'T00:00').toLocaleDateString('es-AR')
const hora = (h) => String(h).slice(0, 5)

// Historial POR CLIENTE: quiénes reservaron en tus salones; al tocar uno se ven todos sus turnos
export default function Clientes() {
  const [lista, setLista] = useState([])
  const [q, setQ] = useState('')
  const [abierto, setAbierto] = useState(null)
  const [detalle, setDetalle] = useState([])

  useEffect(() => { supabase.rpc('clientes_de_mis_salones').then(({ data }) => setLista(data || [])) }, [])

  const abrir = async (c) => {
    if (abierto === c.user_id) return setAbierto(null)
    setAbierto(c.user_id)
    setDetalle([])
    const { data } = await supabase.from('turnos_detalle').select('*')
      .eq('user_id', c.user_id).order('fecha', { ascending: false })
    setDetalle(data || [])
  }

  const visibles = lista.filter((c) =>
    !q || ((c.usuario || '') + ' ' + (c.email || '')).toLowerCase().includes(q.toLowerCase()))

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
            <div className='space-y-1 border-t p-3 text-sm'>
              {detalle.map((r) => (
                <div key={r.id} className='flex flex-wrap justify-between gap-2'>
                  <span>{dia(r.fecha)} {hora(r.hora_inicio)}-{hora(r.hora_fin)} · {r.salon_nombre}</span>
                  <span className='text-gray-500'>{r.estado} · {r.estado_pago} · {f(r.monto_pagado)} de {f(r.monto_total)}</span>
                </div>
              ))}
              {!detalle.length && <p className='text-gray-400'>Cargando…</p>}
            </div>
          )}
        </div>
      ))}
      {!visibles.length && <p className='text-gray-400'>Todavía no hay clientes.</p>}
    </div>
  )
}