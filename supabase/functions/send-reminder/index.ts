import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const ZAPI_TOKEN = Deno.env.get('ZAPI_TOKEN') ?? ''
const ZAPI_INSTANCE = Deno.env.get('ZAPI_INSTANCE') ?? ''
const ZAPI_CLIENT_TOKEN = Deno.env.get('ZAPI_CLIENT_TOKEN') ?? ''
// client-token é o token de segurança da conta Z-API (não o token da instância)

/** Normaliza telefone para formato internacional sem + (ex: 5547999999999) */
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('55') && digits.length >= 12) return digits
  if (digits.length === 11 || digits.length === 10) return '55' + digits
  return digits
}

async function sendWhatsApp(phone: string, message: string): Promise<boolean> {
  if (!ZAPI_INSTANCE || !ZAPI_TOKEN) return false
  const normalized = normalizePhone(phone)
  try {
    const res = await fetch(
      `https://api.z-api.io/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN}/send-text`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Client-Token': ZAPI_CLIENT_TOKEN,
        },
        body: JSON.stringify({ phone: normalized, message }),
      },
    )
    if (!res.ok) {
      const body = await res.text()
      console.error('Z-API error:', res.status, body)
    }
    return res.ok
  } catch (e) {
    console.error('sendWhatsApp exception:', e)
    return false
  }
}

async function sendEmail(
  to: string,
  clientName: string,
  serviceName: string,
  establishmentName: string,
  dateStr: string,
  timeStr: string,
  hoursAhead: number,
): Promise<boolean> {
  if (!RESEND_API_KEY) return false
  const when = hoursAhead <= 2 ? 'em breve' : 'amanhã'
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Agendamento <noreply@atendentente.app>',
        to,
        subject: `Lembrete: ${serviceName} ${when} às ${timeStr}`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#1f2937">
            <h2 style="color:#4f46e5">Lembrete de agendamento</h2>
            <p>Olá, <strong>${clientName}</strong>!</p>
            <p>
              Você tem um agendamento de <strong>${serviceName}</strong>
              em <strong>${establishmentName}</strong>
              ${when} às <strong>${timeStr}</strong> (${dateStr}).
            </p>
            <p style="margin-top:24px;color:#6b7280;font-size:13px">
              Se precisar cancelar, entre em contato com o estabelecimento.
            </p>
          </div>
        `,
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

/** Verifica se já foi enviado lembrete nessa janela para esse agendamento e canal */
async function alreadySent(appointmentId: string, channel: string, windowLabel: string): Promise<boolean> {
  const { data } = await supabase
    .from('notifications')
    .select('id')
    .eq('appointment_id', appointmentId)
    .eq('channel', channel)
    .eq('status', 'enviado')
    .like('message', `%[${windowLabel}]%`)
    .maybeSingle()
  return !!data
}

async function recordNotification(
  appointmentId: string,
  channel: string,
  status: 'enviado' | 'falhou',
  message: string,
) {
  await supabase.from('notifications').insert({
    appointment_id: appointmentId,
    channel,
    sent_at: new Date().toISOString(),
    status,
    message,
  })
}

async function processWindow(hoursAhead: number, windowLabel: string) {
  const now = new Date()
  const target = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000)
  // Janela de ±30min ao redor do horário alvo
  const windowStart = new Date(target.getTime() - 30 * 60 * 1000).toISOString()
  const windowEnd = new Date(target.getTime() + 30 * 60 * 1000).toISOString()

  const { data: appointments, error } = await supabase
    .from('appointments')
    .select(`
      id, starts_at,
      client:clients(name, phone, email),
      service:services(name),
      establishment:establishments(name, slug)
    `)
    .gte('starts_at', windowStart)
    .lte('starts_at', windowEnd)
    .eq('status', 'confirmado')

  if (error || !appointments) return { sent: 0, failed: 0, skipped: 0 }

  let sent = 0, failed = 0, skipped = 0

  for (const appt of appointments) {
    const client = appt.client as { name: string; phone: string; email?: string } | null
    const service = appt.service as { name: string } | null
    const estab = appt.establishment as { name: string; slug: string } | null

    if (!client || !service || !estab) { skipped++; continue }

    const date = new Date(appt.starts_at)
    const dateStr = date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    const timeStr = date.toLocaleTimeString('pt-BR', {
      hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
    })
    const when = hoursAhead <= 2 ? 'em breve' : 'amanhã'

    const whatsappMsg =
      `🔔 Olá, ${client.name}! Lembrete: você tem *${service.name}* ` +
      `em *${estab.name}* ${when} às *${timeStr}* (${dateStr}).\n\n` +
      `Se precisar cancelar, entre em contato conosco. [${windowLabel}]`

    // WhatsApp
    if (client.phone) {
      if (await alreadySent(appt.id, 'whatsapp', windowLabel)) {
        skipped++
      } else {
        const ok = await sendWhatsApp(client.phone, whatsappMsg)
        await recordNotification(appt.id, 'whatsapp', ok ? 'enviado' : 'falhou', whatsappMsg)
        ok ? sent++ : failed++
      }
    }

    // E-mail
    if (client.email) {
      const emailMsg = `[${windowLabel}] ${service.name} em ${estab.name} às ${timeStr}`
      if (await alreadySent(appt.id, 'email', windowLabel)) {
        skipped++
      } else {
        const ok = await sendEmail(
          client.email, client.name, service.name, estab.name, dateStr, timeStr, hoursAhead,
        )
        await recordNotification(appt.id, 'email', ok ? 'enviado' : 'falhou', emailMsg)
        ok ? sent++ : failed++
      }
    }
  }

  return { sent, failed, skipped }
}

Deno.serve(async (req) => {
  // Permite forçar uma janela específica: ?window=2h ou ?window=24h
  const url = new URL(req.url)
  const windowParam = url.searchParams.get('window')

  const results: Record<string, unknown> = {}

  if (!windowParam || windowParam === '24h') {
    results['24h'] = await processWindow(24, '24h')
  }
  if (!windowParam || windowParam === '2h') {
    results['2h'] = await processWindow(2, '2h')
  }

  return new Response(
    JSON.stringify({ ok: true, timestamp: new Date().toISOString(), ...results }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
