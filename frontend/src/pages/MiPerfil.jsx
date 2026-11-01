import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { usePerfil } from '../lib/usePerfil'

const vacio = { nombre: '', apellido: '', dni: '', direccion: '', telefono: '' }

export default function MiPerfil() {
  const { user, cargando } = usePerfil()
  const [f, setF] = useState(vacio)
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState({ texto: '', ok: false })
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (!user) return
    let vivo = true
    supabase.from('perfiles').select('nombre, apellido, dni, direccion, telefono, email')
      .eq('id', user.id).single()
      .then(({ data }) => {
        if (!vivo || !data) return
        setEmail(data.email || user.email || '')
        setF({
          nombre: data.nombre || '', apellido: data.apellido || '', dni: data.dni || '',
          direccion: data.direccion || '', telefono: data.telefono || '',
        })
      })
    return () => { vivo = false }
  }, [user])

  if (cargando) return null

  const cambiar = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const guardar = async (e) => {
    e.preventDefault()
    setMsg({ texto: '', ok: false })
    if (!f.nombre.trim() || !f.apellido.trim()) return setMsg({ texto: 'Completá nombre y apellido', ok: false })
    if (!/^\d{7,9}$/.test(f.dni.trim())) return setMsg({ texto: 'El DNI son 7 a 9 números, sin puntos', ok: false })
    if (f.telefono.replace(/\D/g, '').length < 8) return setMsg({ texto: 'Poné un teléfono válido', ok: false })
    setGuardando(true)
    const { error } = await supabase.rpc('actualizar_mi_perfil', {
      p_nombre: f.nombre, p_apellido: f.apellido, p_dni: f.dni,
      p_direccion: f.direccion, p_telefono: f.telefono,
    })
    setGuardando(false)
    setMsg(error ? { texto: error.message, ok: false } : { texto: 'Datos guardados', ok: true })
  }

  return (
    <main className='auth'>
      <div className='auth-card'>
        <h3 style={{ marginBottom: 6 }}>Mis datos</h3>
        <p className='ayuda' style={{ marginBottom: 20 }}>
          Los usamos para tus reservas. Solo los ven los administradores del salón donde reservás.
        </p>
        <form onSubmit={guardar}>
          <label>Nombre<input value={f.nombre} onChange={cambiar('nombre')} /></label>
          <label>Apellido<input value={f.apellido} onChange={cambiar('apellido')} /></label>
          <label>DNI<input value={f.dni} onChange={cambiar('dni')} inputMode='numeric' placeholder='Sin puntos' /></label>
          <label>Dirección<input value={f.direccion} onChange={cambiar('direccion')} /></label>
          <label>Teléfono<input value={f.telefono} onChange={cambiar('telefono')} inputMode='tel' /></label>
          <label>Correo<input value={email} disabled /></label>
          <p className={'form-msg' + (msg.ok ? ' is-ok' : '')}>{msg.texto}</p>
          <button className='primary-button' type='submit' disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar mis datos'}
          </button>
        </form>
      </div>
    </main>
  )
}