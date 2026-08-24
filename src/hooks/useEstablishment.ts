import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Establishment } from '../types'

export function useEstablishment(userId: string | undefined) {
  const [establishment, setEstablishment] = useState<Establishment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    setLoading(true)
    supabase
      .from('establishments')
      .select('*')
      .eq('user_id', userId)
      .single()
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setEstablishment(data as Establishment)
        setLoading(false)
      })
  }, [userId])

  const updateEstablishment = async (updates: Partial<Establishment>) => {
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

  return { establishment, loading, error, updateEstablishment }
}

export function useEstablishmentBySlug(slug: string | undefined) {
  const [establishment, setEstablishment] = useState<Establishment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
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
