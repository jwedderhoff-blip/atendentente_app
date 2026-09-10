import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface AdminNotification {
  id: string
  event_type: string
  establishment_id: string | null
  payload: {
    name?: string
    email?: string
    phone?: string
    category?: string
    status?: string
  }
  status: 'pendente' | 'enviado' | 'falhou'
  error: string | null
  created_at: string
  sent_at: string | null
}

export interface NotificationSettings {
  notify_email: string
  on_new_signup: boolean
  enabled: boolean
}

export function useAdminNotifications() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = async () => {
    const [notifRes, cfgRes] = await Promise.all([
      supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase.from('admin_notification_settings').select('*').maybeSingle(),
    ])

    if (notifRes.error) setError(notifRes.error.message)
    else setNotifications((notifRes.data ?? []) as AdminNotification[])

    if (cfgRes.data) setSettings(cfgRes.data as NotificationSettings)
    setLoading(false)
  }

  useEffect(() => { void fetchAll() }, [])

  const saveSettings = async (updates: Partial<NotificationSettings>) => {
    const { data, error: err } = await supabase
      .from('admin_notification_settings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', true)
      .select()

    if (err) return { error: err.message }
    if (!data || data.length === 0) {
      return { error: 'Nenhuma linha alterada — verifique se seu usuário é super admin.' }
    }
    setSettings(data[0] as NotificationSettings)
    return { error: null }
  }

  /** Dispara a Edge Function que consome a fila de pendentes. */
  const sendPending = async () => {
    const { data, error: err } = await supabase.functions.invoke('notify-admin')
    if (err) return { error: err.message, sent: 0 }
    await fetchAll()
    return { error: null, sent: (data as { sent?: number })?.sent ?? 0 }
  }

  const pendingCount = notifications.filter((n) => n.status === 'pendente').length

  return { notifications, settings, loading, error, pendingCount, saveSettings, sendPending, refetch: fetchAll }
}
