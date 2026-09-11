import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { isDemo } from '../lib/isDemo'

export interface PlanLimits {
  maxServices: number | null
  maxProfessionals: number | null
  planName: string | null
}

interface PlanRow {
  name: string | null
  max_services: number | null
  max_professionals: number | null
}

/**
 * Limites do plano contratado pelo estabelecimento. `null` em um limite
 * significa "sem limite". Enquanto carrega, `limits` é null e `loading` true —
 * nesse estado não bloqueamos nada (evita travar o cadastro por engano).
 *
 * O dono lê a própria assinatura (policy owner_read_own em subscriptions) e o
 * plano (public_read_active em plans). Pega a assinatura mais recente.
 */
export function usePlanLimits(establishmentId?: string) {
  const [limits, setLimits] = useState<PlanLimits | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDemo || !establishmentId) {
      setLimits(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    supabase
      .from('subscriptions')
      .select('created_at, plans(name, max_services, max_professionals)')
      .eq('establishment_id', establishmentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return
        const plan = (data as { plans?: PlanRow | PlanRow[] } | null)?.plans
        const p = Array.isArray(plan) ? plan[0] : plan
        setLimits(
          p
            ? { maxServices: p.max_services, maxProfessionals: p.max_professionals, planName: p.name }
            : null,
        )
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [establishmentId])

  return { limits, loading }
}
