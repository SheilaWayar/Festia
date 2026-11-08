import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { usePerfil } from '../lib/usePerfil'

// true = el segundo dueño es obligatorio
const SEGUNDO_DUENO_OBLIGATORIO = false
const MAX_MB = 5
const TIPOS_OK = ['application/pdf', 'image/jpeg', 'image/png']

const DOCS_DUENO1 = [
  { tipo: 'arca_dueno1', etiqueta: 'Alta de ARCA del dueño 1' },
  { tipo: 'servicio_dueno1', etiqueta: 'Comprobante de luz o gas del dueño 1' },
]
const DOCS_DUENO2 = [
  { tipo: 'arca_dueno2', etiqueta: 'Alta de ARCA del dueño 2' },
  { tipo: 'servicio_dueno2', etiqueta: 'Comprobante de luz o gas del dueño 2' },
]

const ESTADO = {
  pendiente: { texto: 'Pendiente', clase: 'badge-pendiente' },
  aprobada: { texto: 'Aprobada', clase: 'badge-confirmado' },
  rechazada: { texto: 'Rechazada', clase: 'badge-rechazado' },
}

const vacio = {
  nombre: '', descripcion: '', direccion: '', capacidad: '', precio: '', telefono: '',
  dueno2_nombre: '', dueno2_dni: '',
}

export default function QuieroSerSalon() {
  const { user, perfil, cargando } = usePerfil()
  const [datosDueno, setDatosDueno] = useState(null) // { nombre, apellido, dni }
  const [f, setF] = useState(vacio)
  const [segundo, setSegundo] = useState(SEGUNDO_DUENO_OBLIGATORIO)
  const [archivos, setArchivos] = useState({})
  const [claveForm, setClaveForm] = useState(0)
  const [mias, setMias] = useState([])
  const [msg, setMsg] = useState({ texto: '', ok: false })
  const [enviando, setEnviando] = useState(false)

  const cargarMias = (uid) =>
    supabase.from('solicitudes_salon').select('id, nombre, estado, motivo_rechazo')
      .eq('user_id', uid).order('created_at', { ascending: false })
      .then(({ data }) => setMias(data || []))

  useEffect(() => {
    if (!user) return
    cargarMias(user.id)
    supabase.from('perfiles').select('nombre, apellido, dni').eq('id', user.id).single()
      .then(({ data }) => setDatosDueno(data || {}))
  }, [user])

  if (cargando) return null
  if (!user) {
    return (
      <main className='auth'>
        <div className='auth-card'>
          <p>Iniciá sesión para publicar tu salón.</p>
          <Link className='primary-button' style={{ marginTop: 16 }} to='/login'>Ingresar</Link>
        </div>
      </main>
    )
  }
  if (['admin', 'superadmin'].includes(perfil?.rol)) {
    return <main className='auth'><div className='auth-card'><p>Tu cuenta ya administra la plataforma.</p></div></main>
  }

  const hayPendiente = mias.some((s) => s.estado === 'pendiente')
  const sinDni = datosDueno && !datosDueno.dni
  const docsRequeridos = [...DOCS_DUENO1, ...(segundo ? DOCS_DUENO2 : [])]

  const cambiar = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const elegirArchivo = (tipo, file) => {
    if (!file) return
    if (!TIPOS_OK.includes(file.type)) return setMsg({ texto: 'Solo se aceptan PDF, JPG o PNG', ok: false })
    if (file.size > MAX_MB * 1024 * 1024) return setMsg({ texto: `Cada archivo puede pesar hasta ${MAX_MB} MB`, ok: false })
    setMsg({ texto: '', ok: false })
    setArchivos((a) => ({ ...a, [tipo]: file }))
  }

  const validar = () => {
    if (!f.nombre.trim()) return 'Poné el nombre del salón'
    if (!f.direccion.trim()) return 'Poné la dirección del salón'
    if (!f.capacidad || Number(f.capacidad) <= 0) return 'Indicá la capacidad'
    if (!f.precio || Number(f.precio) <= 0) return 'Indicá el precio por hora'
    if (segundo) {
      if (f.dueno2_nombre.trim().length < 3) return 'Ingresá nombre y apellido del dueño 2'
      if (!/^\d{7,9}$/.test(f.dueno2_dni.replace(/\D/g, ''))) return 'El DNI del dueño 2 son 7 a 9 números'
    }
    const falta = docsRequeridos.find((d) => !archivos[d.tipo])
    if (falta) return `Falta adjuntar: ${falta.etiqueta}`
    return ''
  }

  const enviar = async (e) => {
    e.preventDefault()
    const problema = validar()
    if (problema) return setMsg({ texto: problema, ok: false })

    setEnviando(true)
    setMsg({ texto: '', ok: false })
    const subidos = []
    try {
      const carpeta = `${user.id}/${crypto.randomUUID()}`
      const documentos = {}
      for (const { tipo } of docsRequeridos) {
        const file = archivos[tipo]
        const ext = file.name.split('.').pop().toLowerCase()
        const path = `${carpeta}/${tipo}.${ext}`
        const { error } = await supabase.storage.from('documentos-salon').upload(path, file, { contentType: file.type })
        if (error) throw error
        subidos.push(path)
        documentos[tipo] = path
      }

      const { error } = await supabase.from('solicitudes_salon').insert({
        user_id: user.id,
        nombre: f.nombre.trim(),
        descripcion: f.descripcion,
        direccion: f.direccion.trim(),
        capacidad: Number(f.capacidad),
        precio: Number(f.precio),
        telefono: f.telefono,
        dueno2_nombre: segundo ? f.dueno2_nombre.trim() : null,
        dueno2_dni: segundo ? f.dueno2_dni.replace(/\D/g, '') : null,
        documentos,
      })
      if (error) throw error

      setF(vacio)
      setArchivos({})
      setSegundo(SEGUNDO_DUENO_OBLIGATORIO)
      setClaveForm((n) => n + 1)
      setMsg({ texto: '¡Solicitud enviada! Un administrador revisará tus documentos.', ok: true })
      cargarMias(user.id)
    } catch (err) {
      if (subidos.length) await supabase.storage.from('documentos-salon').remove(subidos)
      setMsg({ texto: err.message || 'No se pudo enviar la solicitud', ok: false })
    } finally {
      setEnviando(false)
    }
  }

  const campoArchivo = ({ tipo, etiqueta }) => (
    <label key={tipo}>
      {etiqueta}
      <input type='file' accept='.pdf,image/jpeg,image/png'
        onChange={(e) => elegirArchivo(tipo, e.target.files[0])} />
      {archivos[tipo] && <span className='ayuda'>✓ {archivos[tipo].name}</span>}
    </label>
  )

  return (
    <main className='auth'>
      <div className='auth-card auth-card--ancha'>
        <h3 style={{ marginBottom: 6 }}>Publicá tu salón</h3>
        <p className='ayuda' style={{ marginBottom: 20 }}>
          Completá los datos y adjuntá la documentación. Un administrador la revisa; si se aprueba,
          seguís entrando con tu mismo usuario y aparece el Panel para gestionar tus reservas.
        </p>

        {hayPendiente ? (
          <p className='form-msg is-ok'>Ya tenés una solicitud pendiente de revisión.</p>
        ) : sinDni ? (
          <>
            <p className='form-msg'>Antes de enviar la solicitud completá tus datos personales (DNI incluido).</p>
            <Link className='primary-button' to='/mi-perfil'>Ir a Mis datos</Link>
          </>
        ) : (
          <form key={claveForm} onSubmit={enviar} noValidate>
            <label>Nombre del salón<input value={f.nombre} onChange={cambiar('nombre')} /></label>
            <label>Descripción<textarea rows={3} value={f.descripcion} onChange={cambiar('descripcion')} /></label>
            <label>Dirección del salón<input value={f.direccion} onChange={cambiar('direccion')} /></label>
            <div className='fila-2'>
              <label>Capacidad<input type='number' min='1' value={f.capacidad} onChange={cambiar('capacidad')} /></label>
              <label>Precio por hora ($)<input type='number' min='1' value={f.precio} onChange={cambiar('precio')} /></label>
            </div>
            <label>Teléfono de contacto<input value={f.telefono} onChange={cambiar('telefono')} inputMode='tel' /></label>

            <fieldset>
              <legend>Dueño 1</legend>
              <p className='ayuda'>
                {datosDueno?.nombre} {datosDueno?.apellido} · DNI {datosDueno?.dni}
              </p>
              {DOCS_DUENO1.map(campoArchivo)}
              <p className='ayuda'>La boleta de luz o gas debe tener nombre, apellido y DNI. PDF, JPG o PNG, hasta {MAX_MB} MB.</p>
            </fieldset>

            {!SEGUNDO_DUENO_OBLIGATORIO && (
              <label className='chk'>
                <input type='checkbox' checked={segundo} onChange={(e) => setSegundo(e.target.checked)} />
                Mi salón tiene un segundo dueño
              </label>
            )}

            {segundo && (
              <fieldset>
                <legend>Dueño 2</legend>
                <label>Nombre y apellido<input value={f.dueno2_nombre} onChange={cambiar('dueno2_nombre')} /></label>
                <label>DNI<input value={f.dueno2_dni} onChange={cambiar('dueno2_dni')} inputMode='numeric' placeholder='Sin puntos' /></label>
                {DOCS_DUENO2.map(campoArchivo)}
              </fieldset>
            )}

            <p className={'form-msg' + (msg.ok ? ' is-ok' : '')} role='alert'>{msg.texto}</p>
            <button className='primary-button' type='submit' disabled={enviando}>
              {enviando ? 'Enviando…' : 'Enviar solicitud'}
            </button>
          </form>
        )}

        {(hayPendiente || sinDni) && msg.texto && (
          <p className={'form-msg' + (msg.ok ? ' is-ok' : '')}>{msg.texto}</p>
        )}
      </div>

      {mias.length > 0 && (
        <section className='turnos-list' style={{ paddingTop: 24 }}>
          <h3>Mis solicitudes</h3>
          {mias.map((s) => (
            <article key={s.id} className='turno-card'>
              <div>
                <h3 style={{ fontSize: 20 }}>{s.nombre}</h3>
                {s.motivo_rechazo && <p className='turno-meta'>Motivo: {s.motivo_rechazo}</p>}
              </div>
              <span className={`badge ${ESTADO[s.estado]?.clase ?? ''}`}>{ESTADO[s.estado]?.texto ?? s.estado}</span>
            </article>
          ))}
        </section>
      )}
    </main>
  )
}