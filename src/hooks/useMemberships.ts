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

export interface Membership {
  id: string
  service_id: string | null
  monthly_price: number
  start_month: string
  months: number | null
  status: 'ativa' | 'cancelada'
  services?: { name: string } | null
}

/**
 * Matrículas (turmas mensais) e mensalidades de um único aluno — usado no card
 * do cliente. Carrega só quando `clientId` é passado (card aberto).
 */
export function useClientFinance(establishmentId?: string, clientId?: string | null) {
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [charges, setCharges] = useState<MembershipCharge[]>([])
  const [loading, setLoading] = useState(false)

  const fetchAll = useCallback(async () => {
    if (!establishmentId || !clientId) { setMemberships([]); setCharges([]); return }
    setLoading(true)
    const [{ data: ms }, { data: cs }] = await Promise.all([
      supabase
        .from('memberships')
        .select('id, service_id, monthly_price, start_month, months, status, services(name)')
        .eq('establishment_id', establishmentId)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false }),
      supabase
        .from('membership_charges')
        .select('*, services(name)')
        .eq('establishment_id', establishmentId)
        .eq('client_id', clientId)
        .neq('status', 'cancelada')
        .order('reference_month', { ascending: false }),
    ])
    setMemberships((ms ?? []) as unknown as Membership[])
    setCharges((cs ?? []) as MembershipCharge[])
    setLoading(false)
  }, [establishmentId, clientId])

  useEffect(() => { void fetchAll() }, [fetchAll])

  const setStatus = async (id: string, status: MembershipCharge['status']) => {
    setCharges((prev) => prev.map((c) => (c.id === id ? { ...c, status, paid_at: status === 'pago' ? new Date().toISOString() : null } : c)))
    await supabase
      .from('membership_charges')
      .update({ status, paid_at: status === 'pago' ? new Date().toISOString() : null })
      .eq('id', id)
  }

  return {
    memberships,
    charges,
    loading,
    markPaid: (id: string) => setStatus(id, 'pago'),
    markPending: (id: string) => setStatus(id, 'pendente'),
  }
}
