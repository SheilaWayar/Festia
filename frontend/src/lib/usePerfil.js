import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export function usePerfil() {
  const [estado, setEstado] = useState({ cargando: true, user: null, perfil: null })

  useEffect(() => {
    let vivo = true
    const cargar = async (user) => {
      let perfil = null
      if (user) {
        const { data } = await supabase.from('perfiles').select('nombre, rol, activo').eq('id', user.id).single()
        perfil = data
      }
      if (vivo) setEstado({ cargando: false, user, perfil })
    }
    supabase.auth.getUser().then(({ data }) => cargar(data.user))
    // setTimeout evita un bloqueo conocido de supabase-js al consultar dentro de este callback
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, sesion) => {
      setTimeout(() => cargar(sesion?.user ?? null), 0)
    })
    return () => { vivo = false; sub.subscription.unsubscribe() }
  }, [])

  return estado
}

// salón, admin y superadmin activos pueden entrar al panel
export const esStaff = (perfil) =>
  !!perfil && perfil.activo && ['salon', 'admin', 'superadmin'].includes(perfil.rol)