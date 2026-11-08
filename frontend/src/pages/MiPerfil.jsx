import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { usePerfil } from '../lib/usePerfil'

const vacio = { nombre: '', apellido: '', dni: '', fecha_nacimiento: '', direccion: '', telefono: '' }
const hoy = () => new Date().toISOString().slice(0, 10)

export default function MiPerfil() {
  const { user, cargando } = usePerfil()
  const location = useLocation()
  const navigate = useNavigate()
  const [f, setF] = useState(vacio)
  const [email, setEmail] = useState('')
  const [dniBloqueado, setDniBloqueado] = useState(false)
  const [msg, setMsg] = useState({ texto: '', ok: false })
  const [guardando, setGuardando] = useState(false)

  const completar = Boolean(location.state?.completar)
  const desde = location.state?.desde

  useEffect(() => {
    if (!user) return
    let vivo = true
    supabase
      .from('perfiles')
      .select('nombre, apellido, dni, direccion, telefono, email, fecha_nacimiento')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (!vivo) return
        if (error || !data) return setMsg({ texto: 'No se pudieron cargar tus datos', ok: false })
        setEmail(data.email || user.email || '')
        setDniBloqueado(Boolean(data.dni))
        setF({
          nombre: data.nombre || '',
          apellido: data.apellido || '',
          dni: data.dni || '',
          fecha_nacimiento: data.fecha_nacimiento || '',
          direccion: data.direccion || '',
          telefono: data.telefono || '',
        })
      })
    return () => { vivo = false }
  }, [user])

  if (cargando) return null

  const cambiar = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const guardar = async (e) => {
    e.preventDefault()
    setMsg({ texto: '', ok: false })
    if (!f.nombre.trim() || !f.apellido.trim())
      return setMsg({ texto: 'Completá nombre y apellido', ok: false })
    if (!/^\d{7,9}$/.test(f.dni.replace(/\D/g, '')))
      return setMsg({ texto: 'El DNI son 7 a 9 números, sin puntos', ok: false })
    if (!f.fecha_nacimiento || f.fecha_nacimiento > hoy())
      return setMsg({ texto: 'Ingresá una fecha de nacimiento válida', ok: false })
    if (!f.direccion.trim())
      return setMsg({ texto: 'Ingresá tu dirección', ok: false })
    if (f.telefono.trim() && f.telefono.replace(/\D/g, '').length < 8)
      return setMsg({ texto: 'Poné un teléfono válido', ok: false })

    setGuardando(true)
    const { error } = await supabase.rpc('actualizar_mis_datos', {
      p_nombre: f.nombre,
      p_apellido: f.apellido,
      p_fecha_nacimiento: f.fecha_nacimiento,
      p_direccion: f.direccion,
      p_telefono: f.telefono,
      p_dni: dniBloqueado ? null : f.dni,
    })
    setGuardando(false)
    if (error) return setMsg({ texto: error.message, ok: false })

    setMsg({ texto: 'Datos guardados', ok: true })
    setDniBloqueado(true)
    if (completar && desde) navigate(desde, { replace: true })
  }

  return (
    <main className='auth'>
      <div className='auth-card'>
        <h3 style={{ marginBottom: 6 }}>Mis datos</h3>
        <p className='ayuda' style={{ marginBottom: 20 }}>
          {completar
            ? 'Para reservar necesitamos que completes tus datos personales.'
            : 'Los usamos para tus reservas y comprobantes. El correo y el DNI no se pueden modificar.'}
        </p>
        <form onSubmit={guardar}>
          <label>Correo<input value={email} disabled readOnly /></label>
          <label>DNI
            <input
              value={f.dni}
              onChange={cambiar('dni')}
              disabled={dniBloqueado}
              readOnly={dniBloqueado}
              inputMode='numeric'
              placeholder='Sin puntos'
            />
          </label>
          <label>Nombre<input value={f.nombre} onChange={cambiar('nombre')} autoComplete='given-name' /></label>
          <label>Apellido<input value={f.apellido} onChange={cambiar('apellido')} autoComplete='family-name' /></label>
          <label>Fecha de nacimiento
            <input type='date' value={f.fecha_nacimiento} max={hoy()} onChange={cambiar('fecha_nacimiento')} />
          </label>
          <label>Dirección<input value={f.direccion} onChange={cambiar('direccion')} autoComplete='street-address' /></label>
          <label>Teléfono (opcional)<input value={f.telefono} onChange={cambiar('telefono')} inputMode='tel' autoComplete='tel' /></label>
          <p className={'form-msg' + (msg.ok ? ' is-ok' : '')}>{msg.texto}</p>
          <button className='primary-button' type='submit' disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </main>
  )
}