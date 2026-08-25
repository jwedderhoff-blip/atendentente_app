import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { isDemo } from '../lib/isDemo'
import { mockAppointments } from '../lib/mockData'
import type { Appointment } from '../types'

export function useAppointments(establishmentId: string | undefined, date?: string) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAppointments = useCallback(async () => {
    if (isDemo) {
      let filtered = mockAppointments
      if (date) {
        filtered = mockAppointments.filter((a) => a.starts_at.startsWith(date))
      }
      setAppointments(filtered)
      setLoading(false)
      return
    }

    if (!establishmentId) {
      setLoading(false)
      return
    }
    setLoading(true)
    let query = supabase
      .from('appointments')
      .select('*, client:clients(*), service:services(*), professional:professionals(id,name)')
      .eq('establishment_id', establishmentId)

    if (date) {
      const start = `${date}T00:00:00`
      const end = `${date}T23:59:59`
      query = query.gte('starts_at', start).lte('starts_at', end)
    }

    const { data, error } = await query.order('starts_at')
    if (error) setError(error.message)
    else setAppointments((data ?? []) as Appointment[])
    setLoading(false)
  }, [establishmentId, date])

  useEffect(() => {
    void fetchAppointments()
  }, [fetchAppointments])

  const createAppointment = async (payload: {
    establishment_id: string
    client_id: string
    professional_id?: string
    service_id: string
    starts_at: string
    ends_at: string
  }) => {
    if (isDemo) {
      const newApt: Appointment = {
        ...payload,
        id: crypto.randomUUID(),
        status: 'pendente',
        payment_status: 'pendente',
        created_at: new Date().toISOString(),
      }
      setAppointments((prev) => [...prev, newApt])
      return { appointment: newApt, error: null }
    }

    const { data, error } = await supabase
      .from('appointments')
      .insert({ ...payload, status: 'pendente', payment_status: 'pendente' })
      .select()
      .single()
    if (!error && data) setAppointments((prev) => [...prev, data as Appointment])
    return { appointment: data as Appointment | null, error: error?.message ?? null }
  }

  const updateStatus = async (id: string, status: Appointment['status']) => {
    if (isDemo) {
      setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
      return { error: null }
    }
    const { error } = await supabase.from('appointments').update({ status }).eq('id', id)
    if (!error) {
      setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
    }
    return { error: error?.message ?? null }
  }

  return { appointments, loading, error, refetch: fetchAppointments, createAppointment, updateStatus }
}
