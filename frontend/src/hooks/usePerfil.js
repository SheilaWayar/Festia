import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

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
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sesion) => {
      setTimeout(() => cargar(sesion?.user ?? null), 0)
    })
    return () => { vivo = false; sub.subscription.unsubscribe() }
  }, [])

  return estado
}
