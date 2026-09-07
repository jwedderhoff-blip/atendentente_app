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
  address?: string | null
  created_at: string
  subscriptions?: { status: string; plans?: { name: string } }[]
}

export interface SuperProfessional {
  id: string
  establishment_id: string
  name: string
  avatar_url?: string | null
  services: string[]
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
      .select('id, name, category, status, email, phone, slug, address, created_at, subscriptions(status, plans(name))')
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

  const updateEstablishment = async (id: string, updates: Partial<Omit<SuperEstablishment, 'id' | 'created_at' | 'subscriptions'>>) => {
    const { error } = await supabase.from('establishments').update(updates).eq('id', id)
    if (!error) await fetch()
    return { error: error?.message ?? null }
  }

  return { establishments, loading, updateStatus, updateEstablishment, refetch: fetch }
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

export function useProfessionalsForEstablishment(establishmentId: string | null) {
  const [professionals, setProfessionals] = useState<SuperProfessional[]>([])
  const [loading, setLoading] = useState(false)

  const fetch = async (id: string) => {
    setLoading(true)
    const { data } = await supabase
      .from('professionals')
      .select('id, establishment_id, name, avatar_url, services')
      .eq('establishment_id', id)
      .order('name')
    if (data) setProfessionals(data as SuperProfessional[])
    setLoading(false)
  }

  useEffect(() => {
    if (establishmentId) fetch(establishmentId)
    else setProfessionals([])
  }, [establishmentId])

  const addProfessional = async (establishmentId: string, name: string) => {
    const { error } = await supabase
      .from('professionals')
      .insert({ establishment_id: establishmentId, name, services: [] })
    if (!error) await fetch(establishmentId)
    return { error: error?.message ?? null }
  }

  const updateProfessional = async (id: string, establishmentId: string, name: string) => {
    const { error } = await supabase.from('professionals').update({ name }).eq('id', id)
    if (!error) await fetch(establishmentId)
    return { error: error?.message ?? null }
  }

  const deleteProfessional = async (id: string, establishmentId: string) => {
    const { error } = await supabase.from('professionals').delete().eq('id', id)
    if (!error) await fetch(establishmentId)
    return { error: error?.message ?? null }
  }

  return { professionals, loading, addProfessional, updateProfessional, deleteProfessional }
}
