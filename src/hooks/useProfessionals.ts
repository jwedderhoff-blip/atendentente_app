import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { isDemo } from '../lib/isDemo'
import { mockProfessionals } from '../lib/mockData'
import type { Professional } from '../types'

interface RawProfessional {
  id: string
  establishment_id: string
  name: string
  avatar_url: string | null
  professional_services: { service_id: string }[]
}

function mapProfessional(raw: RawProfessional): Professional {
  return {
    id: raw.id,
    establishment_id: raw.establishment_id,
    name: raw.name,
    avatar_url: raw.avatar_url ?? undefined,
    services: raw.professional_services.map((ps) => ps.service_id),
  }
}

export function useProfessionals(establishmentId: string | undefined) {
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfessionals = useCallback(async () => {
    if (isDemo) {
      setProfessionals(mockProfessionals)
      setLoading(false)
      return
    }

    if (!establishmentId) {
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('professionals')
      .select('*, professional_services(service_id)')
      .eq('establishment_id', establishmentId)
      .order('name')
    if (error) {
      setError(error.message)
    } else {
      setProfessionals(((data ?? []) as RawProfessional[]).map(mapProfessional))
    }
    setLoading(false)
  }, [establishmentId])

  useEffect(() => {
    void fetchProfessionals()
  }, [fetchProfessionals])

  const createProfessional = async (name: string, serviceIds: string[], estId: string) => {
    if (isDemo) {
      const newPro: Professional = {
        id: crypto.randomUUID(),
        establishment_id: estId,
        name,
        services: serviceIds,
      }
      setProfessionals((prev) => [...prev, newPro])
      return { error: null }
    }

    const { data, error } = await supabase
      .from('professionals')
      .insert({ name, establishment_id: estId })
      .select()
      .single()
    if (error || !data) return { error: error?.message ?? 'Erro ao criar' }

    if (serviceIds.length > 0) {
      await supabase.from('professional_services').insert(
        serviceIds.map((service_id) => ({ professional_id: (data as { id: string }).id, service_id }))
      )
    }
    await fetchProfessionals()
    return { error: null }
  }

  const updateProfessional = async (id: string, name: string, serviceIds: string[]) => {
    if (isDemo) {
      setProfessionals((prev) =>
        prev.map((p) => (p.id === id ? { ...p, name, services: serviceIds } : p))
      )
      return { error: null }
    }

    const { error } = await supabase.from('professionals').update({ name }).eq('id', id)
    if (error) return { error: error.message }

    await supabase.from('professional_services').delete().eq('professional_id', id)
    if (serviceIds.length > 0) {
      await supabase.from('professional_services').insert(
        serviceIds.map((service_id) => ({ professional_id: id, service_id }))
      )
    }
    await fetchProfessionals()
    return { error: null }
  }

  const deleteProfessional = async (id: string) => {
    if (isDemo) {
      setProfessionals((prev) => prev.filter((p) => p.id !== id))
      return { error: null }
    }
    const { error } = await supabase.from('professionals').delete().eq('id', id)
    if (!error) setProfessionals((prev) => prev.filter((p) => p.id !== id))
    return { error: error?.message ?? null }
  }

  return { professionals, loading, error, refetch: fetchProfessionals, createProfessional, updateProfessional, deleteProfessional }
}
