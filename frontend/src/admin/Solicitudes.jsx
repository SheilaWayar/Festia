import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const f = (n) => (n == null ? '—' : '$' + Number(n).toLocaleString('es-AR'))
const BADGE = { pendiente: 'badge-pendiente', aprobada: 'badge-confirmado', rechazada: 'badge-rechazado' }
const ETIQUETA_DOC = {
  arca_dueno1: 'Alta de ARCA · dueño 1',
  servicio_dueno1: 'Luz/gas · dueño 1',
  arca_dueno2: 'Alta de ARCA · dueño 2',
  servicio_dueno2: 'Luz/gas · dueño 2',
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
      const { data: ps } = await supabase.from('perfiles').select('id, nombre, apellido, dni, email').in('id', ids)
      mapa = Object.fromEntries((ps || []).map((p) => [p.id, p]))
    }
    return { filas, mapa }
  }

  useEffect(() => {
    let vivo = true
    traer().then(({ filas, mapa }) => {
      if (!vivo) return
      setLista(filas)
      setDuenos(mapa)
    })
    return () => { vivo = false }
  }, [])

  const recargar = async () => {
    const { filas, mapa } = await traer()
    setLista(filas)
    setDuenos(mapa)
  }

  // Abre el documento con un enlace temporal (5 min); el bucket es privado
  const verDoc = async (path) => {
    const ventana = window.open('', '_blank') // se abre antes para que el navegador no la bloquee
    const { data, error } = await supabase.storage.from('documentos-salon').createSignedUrl(path, 300)
    if (error || !data?.signedUrl) {
      ventana?.close()
      return setMsg('No se pudo abrir el documento: ' + (error?.message ?? 'sin acceso'))
    }
    if (ventana) ventana.location.href = data.signedUrl
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
    <div className='sol'>
      <h2>Solicitudes de salón</h2>
      {msg && <p className='form-msg is-ok'>{msg}</p>}

      <section className='sol-lista'>
        <h3>Pendientes ({pendientes.length})</h3>
        {pendientes.map((s) => {
          const d = duenos[s.user_id]
          const docs = Object.entries(s.documentos || {})
          return (
            <div key={s.id} className='sol-card'>
              <div className='sol-cab'>
                <div>
                  <h3>{s.nombre}</h3>
                  <p className='sol-meta'>
                    Dueño 1: {d ? `${d.nombre ?? ''} ${d.apellido ?? ''} · DNI ${d.dni ?? '—'} · ${d.email}` : s.user_id}
                  </p>
                  {s.dueno2_nombre && (
                    <p className='sol-meta'>Dueño 2: {s.dueno2_nombre} · DNI {s.dueno2_dni}</p>
                  )}
                </div>
                <span className={`badge ${BADGE[s.estado] ?? ''}`}>{s.estado}</span>
              </div>

              {s.descripcion && <p className='sol-meta'>{s.descripcion}</p>}
              <p className='sol-meta'>
                {s.direccion || 'Sin dirección'} · Capacidad {s.capacidad ?? '—'} · Precio {f(s.precio)} · Tel. {s.telefono || '—'}
              </p>

              <div className='sol-docs'>
                {docs.length === 0 && <span className='sol-meta'>Sin documentos adjuntos</span>}
                {docs.map(([tipo, path]) => (
                  <button key={tipo} type='button' className='btn-outline' onClick={() => verDoc(path)}>
                    Ver {ETIQUETA_DOC[tipo] ?? tipo}
                  </button>
                ))}
              </div>

              <input
                className='sol-input'
                placeholder='Motivo del rechazo (opcional)'
                value={motivo[s.id] || ''}
                onChange={(e) => setMotivo({ ...motivo, [s.id]: e.target.value })}
              />
              <div className='sol-acciones'>
                <button type='button' className='primary-button' disabled={ocupado === s.id} onClick={() => aprobar(s)}>Aprobar</button>
                <button type='button' className='btn-danger' disabled={ocupado === s.id} onClick={() => rechazar(s)}>Rechazar</button>
              </div>
            </div>
          )
        })}
        {!pendientes.length && <p className='sol-meta'>No hay solicitudes pendientes.</p>}
      </section>

      {resueltas.length > 0 && (
        <section className='sol-lista'>
          <h3>Resueltas</h3>
          {resueltas.map((s) => (
            <div key={s.id} className='sol-fila'>
              <span>{s.nombre} <span className='sol-meta'>· {duenos[s.user_id]?.email}</span></span>
              <span className={`badge ${BADGE[s.estado] ?? ''}`}>{s.estado}</span>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}