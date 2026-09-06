import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { isDemo } from '../lib/isDemo'
import { mockEstablishment } from '../lib/mockData'
import type { Establishment } from '../types'

export function useEstablishments(userId: string | undefined) {
  const [establishments, setEstablishments] = useState<Establishment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDemo) {
      setEstablishments([mockEstablishment])
      setLoading(false)
      return
    }
    if (!userId) {
      setLoading(false)
      return
    }
    supabase
      .from('establishments')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setEstablishments(data as Establishment[])
        setLoading(false)
      })
  }, [userId])

  return { establishments, loading }
}
