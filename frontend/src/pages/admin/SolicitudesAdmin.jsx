import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import './adminExtra.css'

export default function SolicitudesAdmin() {
  const [lista, setLista] = useState([])
  const [personas, setPersonas] = useState({})
  const [err, setErr] = useState('')

  const cargar = async () => {
    const s = await supabase.from('solicitudes_salon').select('*').order('created_at', { ascending: false })
    const p = await supabase.from('perfiles').select('id, nombre, email')
    setLista(s.data || [])
    setPersonas(Object.fromEntries((p.data || []).map((x) => [x.id, x])))
  }
  useEffect(() => { cargar() }, [])

  const aprobar = async (id) => {
    const { error } = await supabase.rpc('aprobar_solicitud_salon', { p_id: id })
    setErr(error ? error.message : ''); cargar()
  }
  const rechazar = async (id) => {
    const motivo = window.prompt('Motivo del rechazo (opcional)') || null
    const { error } = await supabase.rpc('rechazar_solicitud_salon', { p_id: id, p_motivo: motivo })
    setErr(error ? error.message : ''); cargar()
  }

  return (
    <div className='rb rb-stack'>
      <h2>Solicitudes de salón</h2>
      {err && <p className='rb-err'>{err}</p>}
      {lista.map((s) => {
        const quien = personas[s.user_id]
        return (
          <div key={s.id} className='rb-card'>
            <div className='rb-row rb-between'>
              <b style={{ fontSize: 16 }}>{s.nombre}</b>
              <span className={'rb-badge ' + s.estado}>{s.estado}</span>
            </div>
            <p className='rb-muted'>Solicita: {quien?.nombre} ({quien?.email}) · {new Date(s.created_at).toLocaleDateString('es-AR')}</p>
            <p>{s.descripcion}</p>
            <p className='rb-muted'>📍 {s.direccion} · 👥 {s.capacidad} · ${Number(s.precio || 0).toLocaleString('es-AR')} · ☎ {s.telefono}</p>
            {s.estado === 'pendiente' && (
              <div className='rb-row'>
                <button className='rb-btn green' onClick={() => aprobar(s.id)}>Aprobar</button>
                <button className='rb-btn red' onClick={() => rechazar(s.id)}>Rechazar</button>
              </div>
            )}
          </div>
        )
      })}
      {!lista.length && <p className='rb-muted'>No hay solicitudes.</p>}
    </div>
  )
}
