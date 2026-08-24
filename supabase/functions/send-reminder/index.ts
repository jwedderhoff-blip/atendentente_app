import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const ZAPI_TOKEN = Deno.env.get('ZAPI_TOKEN')!
const ZAPI_INSTANCE = Deno.env.get('ZAPI_INSTANCE')!

async function sendEmail(to: string, name: string, service: string, date: string, time: string) {
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Atendente App <noreply@atendente.app>',
      to,
      subject: `Lembrete: seu agendamento de ${service} é amanhã`,
      html: `<p>Olá, ${name}!</p>
             <p>Lembramos que você tem um agendamento de <strong>${service}</strong> amanhã às <strong>${time}</strong>.</p>
             <p>Data: ${date}</p>
             <p>Até lá!</p>`,
    }),
  })
}

async function sendWhatsApp(phone: string, message: string) {
  await fetch(`https://api.z-api.io/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN}/send-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, message }),
  })
}

Deno.serve(async () => {
  const now = new Date()
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  const windowStart = in24h.toISOString().slice(0, 13) + ':00:00'
  const windowEnd = in24h.toISOString().slice(0, 13) + ':59:59'

  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('*, client:clients(*), service:services(name), establishment:establishments(name)')
    .gte('starts_at', windowStart)
    .lte('starts_at', windowEnd)
    .eq('status', 'confirmado')

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  let sent = 0
  for (const appt of (appointments ?? [])) {
    const client = appt.client as { name: string; phone: string; email?: string }
    const service = appt.service as { name: string }
    const date = new Date(appt.starts_at)
    const dateStr = date.toLocaleDateString('pt-BR')
    const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

    const message = `Olá, ${client.name}! Lembrete: você tem ${service.name} amanhã às ${timeStr} (${dateStr}). Até lá!`

    if (client.phone) {
      await sendWhatsApp(client.phone, message)
    }
    if (client.email) {
      await sendEmail(client.email, client.name, service.name, dateStr, timeStr)
    }
    sent++
  }

  return new Response(JSON.stringify({ sent }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
