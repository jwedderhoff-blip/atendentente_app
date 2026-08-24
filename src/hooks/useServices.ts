import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { isDemo } from '../lib/isDemo'
import { mockServices } from '../lib/mockData'
import type { Service } from '../types'

export function useServices(establishmentId: string | undefined) {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchServices = useCallback(async () => {
    if (isDemo) {
      setServices(mockServices)
      setLoading(false)
      return
    }

    if (!establishmentId) {
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('establishment_id', establishmentId)
      .order('name')
    if (error) setError(error.message)
    else setServices((data ?? []) as Service[])
    setLoading(false)
  }, [establishmentId])

  useEffect(() => {
    void fetchServices()
  }, [fetchServices])

  const createService = async (payload: Omit<Service, 'id'>) => {
    if (isDemo) {
      const newService: Service = { ...payload, id: crypto.randomUUID() }
      setServices((prev) => [...prev, newService])
      return { error: null }
    }
    const { data, error } = await supabase.from('services').insert(payload).select().single()
    if (!error && data) setServices((prev) => [...prev, data as Service])
    return { error: error?.message ?? null }
  }

  const updateService = async (id: string, updates: Partial<Service>) => {
    if (isDemo) {
      setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)))
      return { error: null }
    }
    const { data, error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (!error && data) {
      setServices((prev) => prev.map((s) => (s.id === id ? (data as Service) : s)))
    }
    return { error: error?.message ?? null }
  }

  const deleteService = async (id: string) => {
    if (isDemo) {
      setServices((prev) => prev.filter((s) => s.id !== id))
      return { error: null }
    }
    const { error } = await supabase.from('services').delete().eq('id', id)
    if (!error) setServices((prev) => prev.filter((s) => s.id !== id))
    return { error: error?.message ?? null }
  }

  return { services, loading, error, refetch: fetchServices, createService, updateService, deleteService }
}
