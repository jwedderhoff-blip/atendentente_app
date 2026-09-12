import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface MembershipCharge {
  id: string
  membership_id: string
  establishment_id: string
  client_id: string | null
  service_id: string | null
  reference_month: string
  amount: number
  status: 'pendente' | 'pago' | 'cancelada'
  paid_at: string | null
  created_at: string
  clients?: { name: string } | null
  services?: { name: string; price_mode?: string } | null
}

/**
 * Cobranças de mensalidade do estabelecimento. Sem `month`, traz todas
 * (ordenadas do mês mais recente). O dono pode marcar como pago/pendente.
 */
export function useMembershipCharges(establishmentId?: string, month?: string) {
  const [charges, setCharges] = useState<MembershipCharge[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCharges = useCallback(async () => {
    if (!establishmentId) { setLoading(false); return }
    setLoading(true)
    let q = supabase
      .from('membership_charges')
      .select('*, clients(name), services(name, price_mode)')
      .eq('establishment_id', establishmentId)
      .neq('status', 'cancelada')
      .order('reference_month', { ascending: false })
    if (month) q = q.eq('reference_month', `${month}-01`)
    const { data } = await q
    setCharges((data ?? []) as MembershipCharge[])
    setLoading(false)
  }, [establishmentId, month])

  useEffect(() => { void fetchCharges() }, [fetchCharges])

  const setStatus = async (id: string, status: MembershipCharge['status']) => {
    // Atualização otimista
    setCharges((prev) => prev.map((c) => (c.id === id ? { ...c, status, paid_at: status === 'pago' ? new Date().toISOString() : null } : c)))
    await supabase
      .from('membership_charges')
      .update({ status, paid_at: status === 'pago' ? new Date().toISOString() : null })
      .eq('id', id)
  }

  const markPaid = (id: string) => setStatus(id, 'pago')
  const markPending = (id: string) => setStatus(id, 'pendente')

  return { charges, loading, markPaid, markPending, refetch: fetchCharges }
}
