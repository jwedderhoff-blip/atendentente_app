import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type PaymentMethod = 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'outro'
export type CashKind = 'mensalidade' | 'servico' | 'avulso'

export interface CashMovement {
  id: string
  establishment_id: string
  client_id: string | null
  membership_charge_id: string | null
  kind: CashKind
  description: string | null
  amount: number
  method: PaymentMethod
  operator_email: string | null
  created_at: string
  clients?: { name: string } | null
}

export interface RegisterPaymentInput {
  clientId?: string | null
  chargeId?: string | null
  kind: CashKind
  description?: string
  amount: number
  method: PaymentMethod
}

export const METHOD_LABELS: Record<PaymentMethod, string> = {
  dinheiro: 'Dinheiro',
  pix: 'Pix',
  cartao_credito: 'Cartão de crédito',
  cartao_debito: 'Cartão de débito',
  outro: 'Outro',
}

export const KIND_LABELS: Record<CashKind, string> = {
  mensalidade: 'Mensalidade',
  servico: 'Serviço',
  avulso: 'Avulso',
}

/**
 * Frente de caixa: lista as movimentações de um dia e registra novos
 * recebimentos via RPC (que também baixa a mensalidade, quando houver).
 */
export function useCaixa(establishmentId?: string, day?: string) {
  const [movements, setMovements] = useState<CashMovement[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMovements = useCallback(async () => {
    if (!establishmentId) { setLoading(false); return }
    setLoading(true)
    const base = day ?? new Date().toISOString().slice(0, 10)
    const start = new Date(`${base}T00:00:00`)
    const end = new Date(start)
    end.setDate(end.getDate() + 1)
    const { data } = await supabase
      .from('cash_movements')
      .select('*, clients(name)')
      .eq('establishment_id', establishmentId)
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString())
      .order('created_at', { ascending: false })
    setMovements((data ?? []) as CashMovement[])
    setLoading(false)
  }, [establishmentId, day])

  useEffect(() => { void fetchMovements() }, [fetchMovements])

  const registerPayment = async (input: RegisterPaymentInput) => {
    if (!establishmentId) return { error: 'Sem estabelecimento' }
    const { error } = await supabase.rpc('register_cash_payment', {
      p_establishment: establishmentId,
      p_client: input.clientId ?? null,
      p_charge: input.chargeId ?? null,
      p_kind: input.kind,
      p_description: input.description ?? '',
      p_amount: input.amount,
      p_method: input.method,
    })
    if (error) return { error: error.message }
    await fetchMovements()
    return { error: null }
  }

  const total = movements.reduce((s, m) => s + Number(m.amount), 0)

  return { movements, total, loading, registerPayment, refetch: fetchMovements }
}

/** Cobranças de mensalidade em aberto de um cliente (para baixar no caixa). */
export function useOpenCharges(establishmentId?: string, clientId?: string | null) {
  const [charges, setCharges] = useState<
    { id: string; reference_month: string; amount: number; services?: { name: string } | null }[]
  >([])

  useEffect(() => {
    if (!establishmentId || !clientId) { setCharges([]); return }
    let cancelled = false
    ;(async () => {
      const { data } = await supabase
        .from('membership_charges')
        .select('id, reference_month, amount, services(name)')
        .eq('establishment_id', establishmentId)
        .eq('client_id', clientId)
        .eq('status', 'pendente')
        .order('reference_month', { ascending: true })
      if (!cancelled) setCharges((data ?? []) as unknown as typeof charges)
    })()
    return () => { cancelled = true }
  }, [establishmentId, clientId])

  return charges
}
