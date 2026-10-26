import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const vacio = { nombre: '', email: '', password: '' }

export default function Administradores() {
  const [admins, setAdmins] = useState([])
  const [salones, setSalones] = useState([])
  const [asig, setAsig] = useState([])
  const [form, setForm] = useState(vacio)
  const [sel, setSel] = useState([])
  const [err, setErr] = useState('')

  const cargar = async () => {
    const a = await supabase.from('perfiles').select('id, nombre, email, activo').eq('rol', 'admin')
    const s = await supabase.from('salones').select('id, nombre')
    const x = await supabase.from('admin_salones').select('admin_id, salon_id')
    setAdmins(a.data || [])
    setSalones(s.data || [])
    setAsig(x.data || [])
  }
  useEffect(() => { cargar() }, [])

  const llamar = async (body) => {
    const { data, error } = await supabase.functions.invoke('admin-usuarios', { body })
    if (error || data?.error) {
      setErr(data?.error || error.message)
      return false
    }
    setErr('')
    return true
  }

  // CREAR
  const crear = async () => {
    if (await llamar({ accion: 'crear', ...form, salones: sel })) {
      setForm(vacio)
      setSel([])
      cargar()
    }
  }

  // EDITAR nombre / activar / desactivar
  const editar = async (id, cambios) => {
    const { error } = await supabase.from('perfiles').update(cambios).eq('id', id)
    setErr(error ? error.message : '')
    cargar()
  }

  // ASIGNAR / QUITAR salón
  const toggle = async (admin_id, salon_id, activo) => {
    if (activo) await supabase.from('admin_salones').delete().match({ admin_id, salon_id })
    else await supabase.from('admin_salones').insert({ admin_id, salon_id })
    cargar()
  }

  // BAJA: vuelve a usuario común
  const quitar = async (id) => {
    if (!confirm('¿Quitar permisos de administrador?')) return
    const { error } = await supabase.rpc('quitar_admin', { p_id: id })
    setErr(error ? error.message : '')
    cargar()
  }

  // ELIMINAR cuenta completa
  const eliminar = async (id) => {
    if (!confirm('Se borra la cuenta y sus reservas. ¿Continuar?')) return
    if (await llamar({ accion: 'eliminar', id })) cargar()
  }

  const chip = (activo, onClick, texto, key) => (
    <button
      key={key}
      onClick={onClick}
      className={'rounded-full border px-3 py-1 text-xs ' + (activo ? 'bg-indigo-600 text-white' : 'text-gray-600')}
    >
      {texto}
    </button>
  )

  return (
    <div className='space-y-4'>
      <div className='space-y-2 rounded-xl border bg-white p-3'>
        <b className='text-sm'>Nuevo administrador ({admins.length}/4)</b>
        <div className='grid gap-2 sm:grid-cols-3'>
          <input placeholder='Nombre' value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className='rounded border px-2 py-1' />
          <input placeholder='Email' value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className='rounded border px-2 py-1' />
          <input type='password' placeholder='Contraseña temporal' value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className='rounded border px-2 py-1' />
        </div>
        <div className='flex flex-wrap gap-2'>
          {salones.map(s =>
            chip(sel.includes(s.id), () => setSel(sel.includes(s.id) ? sel.filter(x => x !== s.id) : [...sel, s.id]), s.nombre, s.id)
          )}
        </div>
        <button disabled={admins.length >= 4} onClick={crear} className='rounded bg-indigo-600 px-4 py-1 text-white disabled:opacity-40'>
          Crear administrador
        </button>
      </div>

      {err && <p className='text-sm text-red-500'>{err}</p>}

      {admins.map(a => (
        <div key={a.id} className={'rounded-xl border bg-white p-3 ' + (a.activo ? '' : 'opacity-60')}>
          <div className='mb-2 flex flex-wrap items-center gap-2'>
            <input
              defaultValue={a.nombre}
              onBlur={e => e.target.value !== a.nombre && editar(a.id, { nombre: e.target.value })}
              className='rounded border px-2 py-1 font-medium'
            />
            <span className='text-xs text-gray-500'>{a.email}</span>
            <span className='ml-auto flex gap-3 text-sm'>
              <button onClick={() => editar(a.id, { activo: !a.activo })}>{a.activo ? 'Desactivar' : 'Activar'}</button>
              <button className='text-orange-600' onClick={() => quitar(a.id)}>Quitar rol</button>
              <button className='text-red-600' onClick={() => eliminar(a.id)}>Eliminar</button>
            </span>
          </div>
          <div className='flex flex-wrap gap-2'>
            {salones.map(s => {
              const activo = asig.some(x => x.admin_id === a.id && x.salon_id === s.id)
              return chip(activo, () => toggle(a.id, s.id, activo), s.nombre, s.id)
            })}
          </div>
        </div>
      ))}
      {!admins.length && <p className='text-gray-400'>Todavía no hay administradores.</p>}
    </div>
  )
}