import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { usePerfil } from '../../hooks/usePerfil'
import './adminExtra.css'

const campos = [
  ['nombre', 'Nombre'],
  ['direccion', 'Dirección'],
  ['capacidad', 'Capacidad', 'number'],
  ['precio', 'Precio por fecha ($)', 'number'],
  ['sena_porcentaje', 'Seña (%)', 'number'],
]

export default function MiSalon() {
  const { user, perfil } = usePerfil()
  const [salones, setSalones] = useState([])
  const [id, setId] = useState('')
  const [f, setF] = useState(null)
  const [fotos, setFotos] = useState([])
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!user || !perfil) return
    const consulta = perfil.rol === 'superadmin'
      ? supabase.from('salones').select('*').order('nombre')
      : supabase.from('admin_salones').select('salones(*)').eq('admin_id', user.id)
    consulta.then(({ data }) => {
      const lista = perfil.rol === 'superadmin' ? data : (data || []).map((x) => x.salones)
      setSalones(lista || [])
      if (lista?.length) setId(lista[0].id)
    })
  }, [user, perfil])

  const cargarFotos = () =>
    supabase.from('salon_imagenes').select('*').eq('salon_id', id).order('orden').then(({ data }) => setFotos(data || []))

  useEffect(() => {
    if (!id) return
    setF(salones.find((s) => s.id === id) || null)
    setMsg('')
    cargarFotos()
  }, [id, salones])

  const guardar = async () => {
    const { error } = await supabase.from('salones').update({
      nombre: f.nombre,
      descripcion: f.descripcion,
      direccion: f.direccion,
      capacidad: f.capacidad === '' ? null : Number(f.capacidad),
      precio: f.precio === '' ? null : Number(f.precio),
      sena_porcentaje: Number(f.sena_porcentaje),
      imagen_principal: f.imagen_principal,
      activo: f.activo,
    }).eq('id', id)
    setMsg(error ? error.message : 'Cambios guardados')
  }

  const subir = async (e) => {
    const archivo = e.target.files[0]
    if (!archivo) return
    const ruta = id + '/' + Date.now() + '-' + archivo.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const { error } = await supabase.storage.from('salones').upload(ruta, archivo)
    if (error) return setMsg(error.message)
    const url = supabase.storage.from('salones').getPublicUrl(ruta).data.publicUrl
    await supabase.from('salon_imagenes').insert({ salon_id: id, url, orden: fotos.length })
    if (!f.imagen_principal) {
      await supabase.from('salones').update({ imagen_principal: url }).eq('id', id)
      setF({ ...f, imagen_principal: url })
    }
    cargarFotos()
  }

  const hacerPrincipal = async (url) => {
    await supabase.from('salones').update({ imagen_principal: url }).eq('id', id)
    setF({ ...f, imagen_principal: url })
  }

  const quitarFoto = async (fotoId) => {
    await supabase.from('salon_imagenes').delete().eq('id', fotoId)
    cargarFotos()
  }

  if (!salones.length) return <p className='rb rb-muted'>No tenés salones asignados todavía.</p>
  if (!f) return null

  return (
    <div className='rb rb-page rb-stack'>
      {salones.length > 1 && (
        <select className='rb-input' value={id} onChange={(e) => setId(e.target.value)}>
          {salones.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </select>
      )}

      <div className='rb-card'>
        <h2>Datos del salón</h2>
        {campos.map(([k, label, type = 'text']) => (
          <label key={k} className='rb-field'>
            <span>{label}</span>
            <input className='rb-input rb-full' type={type} value={f[k] ?? ''} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
          </label>
        ))}
        <label className='rb-field'>
          <span>Descripción</span>
          <textarea className='rb-input rb-full' style={{ height: 90 }} value={f.descripcion ?? ''}
            onChange={(e) => setF({ ...f, descripcion: e.target.value })} />
        </label>
        <label className='rb-row' style={{ marginBottom: 10 }}>
          <input type='checkbox' checked={!!f.activo} onChange={(e) => setF({ ...f, activo: e.target.checked })} />
          Visible en el sitio
        </label>
        <button className='rb-btn' onClick={guardar}>Guardar cambios</button>
        {msg && <p className='rb-msg'>{msg}</p>}
      </div>

      <div className='rb-card'>
        <h2>Fotos</h2>
        <input type='file' accept='image/*' onChange={subir} />
        <div className='rb-fotos' style={{ marginTop: 12 }}>
          {fotos.map((p) => (
            <div key={p.id}>
              <img src={p.url} alt='' className={'rb-photo ' + (f.imagen_principal === p.url ? 'main' : '')} />
              <div className='rb-row rb-between rb-small' style={{ marginTop: 4 }}>
                <button className='rb-link' onClick={() => hacerPrincipal(p.url)}>Principal</button>
                <button className='rb-link red' onClick={() => quitarFoto(p.id)}>Quitar</button>
              </div>
            </div>
          ))}
        </div>
        <p className='rb-muted rb-small'>Después de elegir la foto principal, tocá Guardar cambios.</p>
      </div>
    </div>
  )
}
