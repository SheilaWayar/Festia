import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const f = (n) => (n == null ? '—' : '$' + Number(n).toLocaleString('es-AR'))
const color = {
  pendiente: 'bg-yellow-100 text-yellow-700',
  aprobada: 'bg-green-100 text-green-700',
  rechazada: 'bg-red-100 text-red-700',
}

// El superadmin aprueba o rechaza pedidos de pasar de usuario a salón
export default function Solicitudes() {
  const [lista, setLista] = useState([])
  const [duenos, setDuenos] = useState({})
  const [motivo, setMotivo] = useState({})
  const [msg, setMsg] = useState('')
  const [ocupado, setOcupado] = useState(null)

  // Trae las solicitudes y los datos de cada dueño
  const traer = async () => {
    const { data } = await supabase.from('solicitudes_salon').select('*').order('created_at', { ascending: false })
    const filas = data || []
    const ids = [...new Set(filas.map((s) => s.user_id))]
    let mapa = {}
    if (ids.length) {
      const { data: ps } = await supabase.from('perfiles').select('id, nombre, email').in('id', ids)
      mapa = Object.fromEntries((ps || []).map((p) => [p.id, p]))
    }
    return { filas, mapa }
  }

  // Carga inicial
  useEffect(() => {
    let vivo = true
    traer().then(({ filas, mapa }) => {
      if (!vivo) return
      setLista(filas)
      setDuenos(mapa)
    })
    return () => { vivo = false }
  }, [])

  // Recarga después de aprobar o rechazar
  const recargar = async () => {
    const { filas, mapa } = await traer()
    setLista(filas)
    setDuenos(mapa)
  }

  const aprobar = async (s) => {
    setOcupado(s.id)
    setMsg('')
    const { error } = await supabase.rpc('aprobar_solicitud_salon', { p_id: s.id })
    setOcupado(null)
    setMsg(error ? error.message : 'Salón creado y asignado a su dueño.')
    recargar()
  }

  const rechazar = async (s) => {
    setOcupado(s.id)
    setMsg('')
    const { error } = await supabase.rpc('rechazar_solicitud_salon', { p_id: s.id, p_motivo: motivo[s.id] || null })
    setOcupado(null)
    setMsg(error ? error.message : 'Solicitud rechazada.')
    recargar()
  }

  const pendientes = lista.filter((s) => s.estado === 'pendiente')
  const resueltas = lista.filter((s) => s.estado !== 'pendiente')

  return (
    <div className='space-y-4'>
      <h1 className='text-xl font-semibold'>Solicitudes de salón</h1>
      {msg && <p className='rounded bg-indigo-50 p-3 text-sm text-indigo-700'>{msg}</p>}

      <section className='space-y-3'>
        <h2 className='font-medium'>Pendientes ({pendientes.length})</h2>
        {pendientes.map((s) => {
          const d = duenos[s.user_id]
          return (
            <div key={s.id} className='space-y-2 rounded-lg border bg-white p-4 text-sm'>
              <div className='flex flex-wrap items-start justify-between gap-2'>
                <div>
                  <p className='text-base font-medium'>{s.nombre}</p>
                  <p className='text-gray-500'>{d ? (d.nombre || d.email) + ' · ' + d.email : s.user_id}</p>
                </div>
                <span className={'rounded px-2 py-0.5 text-xs ' + color[s.estado]}>{s.estado}</span>
              </div>
              {s.descripcion && <p className='text-gray-700'>{s.descripcion}</p>}
              <p className='text-gray-500'>
                {s.direccion || 'Sin dirección'} · Capacidad {s.capacidad ?? '—'} · Precio {f(s.precio)} · Tel. {s.telefono || '—'}
              </p>
              <input
                placeholder='Motivo del rechazo (opcional)'
                value={motivo[s.id] || ''}
                onChange={(e) => setMotivo({ ...motivo, [s.id]: e.target.value })}
                className='w-full rounded border px-3 py-2'
              />
              <div className='flex gap-2'>
                <button disabled={ocupado === s.id} onClick={() => aprobar(s)}
                  className='rounded bg-green-600 px-4 py-2 text-white disabled:opacity-50'>Aprobar</button>
                <button disabled={ocupado === s.id} onClick={() => rechazar(s)}
                  className='rounded bg-red-600 px-4 py-2 text-white disabled:opacity-50'>Rechazar</button>
              </div>
            </div>
          )
        })}
        {!pendientes.length && <p className='text-sm text-gray-400'>No hay solicitudes pendientes.</p>}
      </section>

      {resueltas.length > 0 && (
        <section className='space-y-2'>
          <h2 className='font-medium'>Resueltas</h2>
          {resueltas.map((s) => (
            <div key={s.id} className='flex items-center justify-between rounded-lg border bg-white p-3 text-sm'>
              <span>{s.nombre} <span className='text-gray-400'>· {duenos[s.user_id]?.email}</span></span>
              <span className={'rounded px-2 py-0.5 text-xs ' + color[s.estado]}>{s.estado}</span>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}