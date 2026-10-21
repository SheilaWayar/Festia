import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function RequireAdmin({ children }) {
  const [ok, setOk] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return setOk(false)
      const { data } = await supabase
        .from('perfiles')
        .select('rol, activo')
        .eq('id', user.id)
        .single()
      setOk(['admin', 'superadmin'].includes(data?.rol) && data?.activo !== false)
    })
  }, [])

  if (ok === null) return null
  return ok ? children : <Navigate to='/' />
}