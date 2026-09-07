import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface Plan {
  id: string
  name: string
  description: string | null
  price_monthly: number
  max_services: number | null
  max_professionals: number | null
  max_appointments_per_month: number | null
  is_active: boolean
  created_at: string
}

export interface Subscription {
  id: string
  establishment_id: string
  plan_id: string | null
  status: 'trial' | 'active' | 'suspended' | 'cancelled'
  started_at: string
  expires_at: string | null
  created_at: string
  establishments?: { name: string; category: string; owner_id: string }
  plans?: { name: string }
}

export interface SuperEstablishment {
  id: string
  name: string
  category: string
  status: string
  email: string | null
  phone: string | null
  slug: string
  created_at: string
  subscriptions?: { status: string; plans?: { name: string } }[]
}

export function usePlans() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = async () => {
    const { data } = await supabase
      .from('plans')
      .select('*')
      .order('created_at')
    if (data) setPlans(data as Plan[])
    setLoading(false)
  }

  useEffect(() => { fetch() }, [])

  const updatePlan = async (id: string, updates: Partial<Plan>) => {
    const { error } = await supabase.from('plans').update(updates).eq('id', id)
    if (!error) await fetch()
    return { error: error?.message ?? null }
  }

  return { plans, loading, updatePlan, refetch: fetch }
}

export function useAllEstablishments() {
  const [establishments, setEstablishments] = useState<SuperEstablishment[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = async () => {
    const { data } = await supabase
      .from('establishments')
      .select('id, name, category, status, email, phone, slug, created_at, subscriptions(status, plans(name))')
      .order('created_at', { ascending: false })
    if (data) setEstablishments(data as unknown as SuperEstablishment[])
    setLoading(false)
  }

  useEffect(() => { fetch() }, [])

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('establishments').update({ status }).eq('id', id)
    if (!error) await fetch()
    return { error: error?.message ?? null }
  }

  return { establishments, loading, updateStatus, refetch: fetch }
}

export function useAllSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('subscriptions')
      .select('*, establishments(name, category), plans(name)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setSubscriptions(data as Subscription[])
        setLoading(false)
      })
  }, [])

  return { subscriptions, loading }
}
