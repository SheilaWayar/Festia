import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import './adminExtra.css'

const f = (n) => '$' + Number(n || 0).toLocaleString('es-AR')
const dia = (d) => new Date(d + 'T00:00').toLocaleDateString('es-AR')

export default function ClientesAdmin() {
  const [lista, setLista] = useState([])
  const [q, setQ] = useState('')
  const [abierto, setAbierto] = useState(null)
  const [detalle, setDetalle] = useState([])

  useEffect(() => { supabase.rpc('clientes_de_mis_salones').then(({ data }) => setLista(data || [])) }, [])

  const abrir = async (c) => {
    if (abierto === c.user_id) return setAbierto(null)
    setAbierto(c.user_id)
    setDetalle([])
    const { data } = await supabase.rpc('historial_reservas', { p_salon: null, p_user: c.user_id })
    setDetalle(data || [])
  }

  const visibles = lista.filter((c) =>
    !q || ((c.usuario || '') + ' ' + (c.email || '')).toLowerCase().includes(q.toLowerCase()))

  return (
    <div className='rb rb-stack'>
      <h2>Historial por cliente</h2>
      <input className='rb-input rb-full' value={q} onChange={(e) => setQ(e.target.value)} placeholder='Buscar cliente o email' />
      {visibles.map((c) => (
        <div key={c.user_id} className='rb-card' style={{ padding: 0 }}>
          <button className='rb-click rb-row rb-between' onClick={() => abrir(c)}>
            <span>
              <b>{c.usuario}</b>
              <div className='rb-muted rb-small'>{c.email}</div>
            </span>
            <span className='rb-muted'>{c.reservas} reservas · última {dia(c.ultima)} · pagó {f(c.total_pagado)}</span>
          </button>
          {abierto === c.user_id && (
            <div style={{ borderTop: '1px solid #e5e7eb', padding: 12 }}>
              {detalle.map((r) => (
                <div key={r.reserva_id} className='rb-row rb-between' style={{ marginBottom: 4 }}>
                  <span>{dia(r.fecha)} · {r.salon}</span>
                  <span className='rb-muted'>{r.estado} · {r.estado_pago} · {f(r.monto_pagado)} de {f(r.monto_total)}</span>
                </div>
              ))}
              {!detalle.length && <p className='rb-muted'>Cargando…</p>}
            </div>
          )}
        </div>
      ))}
      {!visibles.length && <p className='rb-muted'>Todavía no hay clientes.</p>}
    </div>
  )
}
