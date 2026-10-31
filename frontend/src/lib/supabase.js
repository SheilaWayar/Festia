// Cliente de Supabase para los paneles nuevos.
// Si tu proyecto YA tiene uno, borrá estas líneas y poné:
//   export { supabase } from '../services/TU_ARCHIVO'
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
