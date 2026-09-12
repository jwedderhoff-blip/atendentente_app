import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { isDemo } from '../lib/isDemo'
import { mockEstablishment } from '../lib/mockData'
import type { Establishment } from '../types'

export function useEstablishments(userId: string | undefined) {
  const [establishments, setEstablishments] = useState<Establishment[]>([])
  const [hasOwned, setHasOwned] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDemo) {
      setEstablishments([mockEstablishment])
      setHasOwned(true)
      setLoading(false)
      return
    }
    if (!userId) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    ;(async () => {
      // 1) Estabelecimentos que o usuário é dono
      const owned = await supabase
        .from('establishments')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false })

      let list = (owned.data ?? []) as Establishment[]
      const ownsAny = list.length > 0

      // 2) Se não é dono de nenhum, busca acessos de visualizador pelo e-mail
      if (!ownsAny) {
        const { data: { user } } = await supabase.auth.getUser()
        const email = user?.email?.toLowerCase()
        if (email) {
          const mem = await supabase
            .from('establishment_members')
            .select('establishment_id')
            .eq('email', email)
          const ids = (mem.data ?? []).map((m: { establishment_id: string }) => m.establishment_id)
          if (ids.length > 0) {
            const ests = await supabase.from('establishments').select('*').in('id', ids)
            list = (ests.data ?? []) as Establishment[]
          }
        }
      }

      if (cancelled) return
      setEstablishments(list)
      setHasOwned(ownsAny)
      setLoading(false)
    })()

    return () => { cancelled = true }
  }, [userId])

  return { establishments, hasOwned, loading }
}
