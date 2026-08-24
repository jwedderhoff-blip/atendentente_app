import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { isDemo } from '../lib/isDemo'
import { mockClients } from '../lib/mockData'
import type { Client } from '../types'

export function useClients(establishmentId: string | undefined) {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchClients = useCallback(async () => {
    if (isDemo) {
      setClients(mockClients)
      setLoading(false)
      return
    }

    if (!establishmentId) {
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('establishment_id', establishmentId)
      .order('name')
    if (error) setError(error.message)
    else setClients((data ?? []) as Client[])
    setLoading(false)
  }, [establishmentId])

  useEffect(() => {
    void fetchClients()
  }, [fetchClients])

  const createClient = async (payload: Omit<Client, 'id' | 'created_at'>) => {
    if (isDemo) {
      // Verifica se já existe pelo telefone
      const existing = clients.find(
        (c) => c.establishment_id === payload.establishment_id && c.phone === payload.phone
      )
      if (existing) return { client: existing, error: null }

      const newClient: Client = {
        ...payload,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      }
      setClients((prev) => [...prev, newClient])
      return { client: newClient, error: null }
    }

    const existing = await supabase
      .from('clients')
      .select('id')
      .eq('establishment_id', payload.establishment_id)
      .eq('phone', payload.phone)
      .single()

    if (existing.data) return { client: existing.data as Client, error: null }

    const { data, error } = await supabase.from('clients').insert(payload).select().single()
    if (!error && data) setClients((prev) => [...prev, data as Client])
    return { client: data as Client | null, error: error?.message ?? null }
  }

  const exportCsv = () => {
    const header = ['Nome', 'Telefone', 'Email', 'Cadastro']
    const rows = clients.map((c) => [
      c.name,
      c.phone,
      c.email ?? '',
      new Date(c.created_at).toLocaleDateString('pt-BR'),
    ])
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'clientes.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return { clients, loading, error, refetch: fetchClients, createClient, exportCsv }
}
