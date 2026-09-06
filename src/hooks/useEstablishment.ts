import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { isDemo } from '../lib/isDemo'
import { mockEstablishment } from '../lib/mockData'
import type { Establishment } from '../types'

const STORAGE_KEY = 'selectedEstablishmentId'

export function getSelectedEstablishmentId() {
  return localStorage.getItem(STORAGE_KEY)
}

export function setSelectedEstablishmentId(id: string) {
  localStorage.setItem(STORAGE_KEY, id)
}

export function useEstablishment(userId: string | undefined) {
  const [establishment, setEstablishment] = useState<Establishment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isDemo) {
      setEstablishment(mockEstablishment)
      setLoading(false)
      return
    }

    if (!userId) {
      setLoading(false)
      return
    }

    setLoading(true)
    supabase
      .from('establishments')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setError(error.message)
        } else if (data && data.length > 0) {
          const savedId = getSelectedEstablishmentId()
          const selected = data.find((e) => e.id === savedId) ?? data[0]
          setEstablishment(selected as Establishment)
        }
        setLoading(false)
      })
  }, [userId])

  const switchEstablishment = (id: string) => {
    setSelectedEstablishmentId(id)
    // força re-fetch no próximo render via window reload simples
    window.location.reload()
  }

  const updateEstablishment = async (updates: Partial<Establishment>) => {
    if (isDemo) {
      setEstablishment((prev) => (prev ? { ...prev, ...updates } : prev))
      return { error: null }
    }
    if (!establishment) return { error: 'Sem estabelecimento' }
    const { data, error } = await supabase
      .from('establishments')
      .update(updates)
      .eq('id', establishment.id)
      .select()
      .single()
    if (!error && data) setEstablishment(data as Establishment)
    return { error: error?.message ?? null }
  }

  return { establishment, loading, error, updateEstablishment, switchEstablishment }
}

export function useEstablishmentBySlug(slug: string | undefined) {
  const [establishment, setEstablishment] = useState<Establishment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isDemo) {
      setEstablishment(mockEstablishment)
      setLoading(false)
      return
    }

    if (!slug) {
      setLoading(false)
      return
    }

    setLoading(true)
    supabase
      .from('establishments')
      .select('*')
      .eq('slug', slug)
      .single()
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setEstablishment(data as Establishment)
        setLoading(false)
      })
  }, [slug])

  return { establishment, loading, error }
}
