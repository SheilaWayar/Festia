import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { usePerfil } from '../lib/usePerfil'

const lista = (t) => (t || '').split(',').map((x) => x.trim()).filter(Boolean)

// arma el formulario a partir de un salón
const armar = (s) => ({
  ...s,
  servicios_txt: (s.servicios || []).join(', '),
  tipos_txt: (s.tipos_evento || []).join(', '),
})

const campos = [
  ['nombre', 'Nombre'],
  ['direccion', 'Dirección'],
  ['capacidad', 'Capacidad', 'number'],
  ['precio_por_hora', 'Precio por hora ($)', 'number'],
  ['sena_porcentaje', 'Seña (% del total)', 'number'],
  ['whatsapp', 'WhatsApp (con código de país, ej. 5493874000000)'],
]

// El salón edita sus datos y sube fotos. El superadmin ve todos los salones.
export default function MiSalon() {
  const { user, perfil } = usePerfil()
  const [salones, setSalones] = useState([])
  const [id, setId] = useState('')
  const [f, setF] = useState(null)
  const [msg, setMsg] = useState('')

  // salones que puede editar esta persona
  useEffect(() => {
    if (!user || !perfil) return
    let vivo = true
    const superadmin = perfil.rol === 'superadmin'
    const consulta = superadmin
      ? supabase.from('salones').select('*').order('nombre')
      : supabase.from('admin_salones').select('salones(*)').eq('admin_id', user.id)
    consulta.then(({ data }) => {
      if (!vivo) return
      const filas = (superadmin ? data : (data || []).map((x) => x.salones)) || []
      setSalones(filas)
      if (filas.length) {
        setId(String(filas[0].id))
        setF(armar(filas[0]))
      }
    })
    return () => { vivo = false }
  }, [user, perfil])

  const elegirSalon = (nuevoId) => {
    const s = salones.find((x) => String(x.id) === nuevoId)
    setId(nuevoId)
    setMsg('')
    setF(s ? armar(s) : null)
  }

  const guardar = async () => {
    const { error } = await supabase.from('salones').update({
      nombre: f.nombre,
      direccion: f.direccion,
      descripcion: f.descripcion,
      capacidad: Number(f.capacidad) || 0,
      precio_por_hora: Number(f.precio_por_hora) || 0,
      sena_porcentaje: Number(f.sena_porcentaje) || 30,
      whatsapp: f.whatsapp,
      servicios: lista(f.servicios_txt),
      tipos_evento: lista(f.tipos_txt),
      activo: f.activo,
    }).eq('id', Number(id))
    setMsg(error ? error.message : 'Cambios guardados')
  }

  // las fotos se guardan en la lista «imagenes» del salón (la primera es la principal)
  const guardarFotos = async (imagenes) => {
    const { error } = await supabase.from('salones').update({ imagenes }).eq('id', Number(id))
    if (error) return setMsg(error.message)
    setF({ ...f, imagenes })
  }

  const subir = async (e) => {
    const archivo = e.target.files[0]
    if (!archivo) return
    const ruta = id + '/' + Date.now() + '-' + archivo.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const { error } = await supabase.storage.from('salones').upload(ruta, archivo)
    if (error) return setMsg(error.message)
    const url = supabase.storage.from('salones').getPublicUrl(ruta).data.publicUrl
    guardarFotos([...(f.imagenes || []), url])
  }

  const hacerPrincipal = (url) => guardarFotos([url, ...f.imagenes.filter((x) => x !== url)])
  const quitar = (url) => guardarFotos(f.imagenes.filter((x) => x !== url))

  if (!salones.length) return <p className='text-gray-400'>No tenés salones asignados todavía.</p>
  if (!f) return null

  return (
    <div className='mx-auto max-w-2xl space-y-4'>
      {salones.length > 1 && (
        <select value={id} onChange={(e) => elegirSalon(e.target.value)} className='rounded border px-2 py-1'>
          {salones.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </select>
      )}

      <section className='space-y-2 rounded-xl border bg-white p-4'>
        <h2 className='font-medium'>Datos del salón</h2>
        {campos.map(([k, label, type = 'text']) => (
          <label key={k} className='block text-sm'>
            <span className='text-gray-500'>{label}</span>
            <input type={type} value={f[k] ?? ''} onChange={(e) => setF({ ...f, [k]: e.target.value })}
              className='w-full rounded border px-3 py-2' />
          </label>
        ))}
        <label className='block text-sm'>
          <span className='text-gray-500'>Descripción</span>
          <textarea value={f.descripcion ?? ''} onChange={(e) => setF({ ...f, descripcion: e.target.value })}
            className='h-24 w-full rounded border px-3 py-2' />
        </label>
        <label className='block text-sm'>
          <span className='text-gray-500'>Servicios (separados por coma)</span>
          <input value={f.servicios_txt} onChange={(e) => setF({ ...f, servicios_txt: e.target.value })}
            className='w-full rounded border px-3 py-2' />
        </label>
        <label className='block text-sm'>
          <span className='text-gray-500'>Tipos de evento (separados por coma)</span>
          <input value={f.tipos_txt} onChange={(e) => setF({ ...f, tipos_txt: e.target.value })}
            className='w-full rounded border px-3 py-2' />
        </label>
        <label className='flex items-center gap-2 text-sm'>
          <input type='checkbox' checked={!!f.activo} onChange={(e) => setF({ ...f, activo: e.target.checked })} />
          Visible en el sitio
        </label>
        <button onClick={guardar} className='rounded bg-indigo-600 px-4 py-2 text-white'>Guardar cambios</button>
        {msg && <p className='text-sm text-indigo-600'>{msg}</p>}
      </section>

      <section className='space-y-2 rounded-xl border bg-white p-4'>
        <h2 className='font-medium'>Fotos</h2>
        <input type='file' accept='image/*' onChange={subir} className='text-sm' />
        <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
          {(f.imagenes || []).map((url, n) => (
            <div key={url} className='space-y-1'>
              <img src={url} alt='' className={'h-24 w-full rounded-lg object-cover ' + (n === 0 ? 'ring-2 ring-indigo-600' : '')} />
              <div className='flex justify-between text-xs'>
                {n === 0 ? <span className='text-indigo-600'>Principal</span>
                  : <button onClick={() => hacerPrincipal(url)} className='text-indigo-600'>Hacer principal</button>}
                <button onClick={() => quitar(url)} className='text-red-600'>Quitar</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}