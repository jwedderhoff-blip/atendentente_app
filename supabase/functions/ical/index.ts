import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// Converte ISO UTC para horário local de Brasília (UTC-3) e formata para iCal
function toSaoPauloIcal(iso: string): string {
  const date = new Date(iso)
  // UTC-3 fixo (Brasília standard; sem horário de verão a partir de 2019)
  const offset = -3 * 60
  const local = new Date(date.getTime() + offset * 60 * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${local.getUTCFullYear()}${pad(local.getUTCMonth() + 1)}${pad(local.getUTCDate())}` +
    `T${pad(local.getUTCHours())}${pad(local.getUTCMinutes())}${pad(local.getUTCSeconds())}`
  )
}

function escapeIcal(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

// RFC 5545: linhas devem ter ≤75 octets; continua com CRLF + espaço
function foldLine(line: string): string {
  const bytes = new TextEncoder()
  if (bytes.encode(line).length <= 75) return line
  const chunks: string[] = []
  let current = ''
  for (const char of line) {
    const candidate = current + char
    if (bytes.encode(candidate).length > 75) {
      chunks.push(current)
      current = ' ' + char
    } else {
      current = candidate
    }
  }
  if (current) chunks.push(current)
  return chunks.join('\r\n')
}

// Bloco VTIMEZONE para America/Sao_Paulo (sem DST desde 2019)
const VTIMEZONE = [
  'BEGIN:VTIMEZONE',
  'TZID:America/Sao_Paulo',
  'BEGIN:STANDARD',
  'TZOFFSETFROM:-0300',
  'TZOFFSETTO:-0300',
  'TZNAME:BRT',
  'DTSTART:19700101T000000',
  'END:STANDARD',
  'END:VTIMEZONE',
].join('\r\n')

Deno.serve(async (req: Request) => {
  const slug = new URL(req.url).pathname.split('/').pop()

  if (!slug) {
    return new Response('slug obrigatório', { status: 400 })
  }

  const { data: est, error: estErr } = await supabase
    .from('establishments')
    .select('id, name, address, phone')
    .eq('slug', slug)
    .single()

  if (estErr || !est) {
    return new Response('Estabelecimento não encontrado', { status: 404 })
  }

  const from = new Date()
  from.setDate(from.getDate() - 30)
  const to = new Date()
  to.setDate(to.getDate() + 90)

  const { data: appointments, error: apptErr } = await supabase
    .from('appointments')
    .select(`
      id,
      starts_at,
      ends_at,
      status,
      notes,
      client:clients(name, phone),
      service:services(name),
      professional:professionals(name)
    `)
    .eq('establishment_id', est.id)
    .neq('status', 'cancelado')
    .gte('starts_at', from.toISOString())
    .lte('starts_at', to.toISOString())
    .order('starts_at')

  if (apptErr) {
    return new Response('Erro ao buscar agendamentos', { status: 500 })
  }

  const header = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//MeuToki//${escapeIcal(est.name)}//PT`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcal(est.name)}`,
    'X-WR-TIMEZONE:America/Sao_Paulo',
    'X-WR-CALDESC:Agendamentos via MeuToki',
  ]

  const events: string[] = []

  for (const a of (appointments ?? [])) {
    const client = a.client as { name: string; phone?: string } | null
    const service = a.service as { name: string } | null
    const professional = a.professional as { name: string } | null

    // SUMMARY: "Serviço · Cliente" — legível no título do evento
    const summaryParts = [service?.name, client?.name].filter(Boolean)
    const summary = summaryParts.join(' · ')

    // DESCRIPTION: linhas separadas para melhor leitura no Google Agenda
    const descLines: string[] = []
    if (professional?.name) descLines.push(`👤 ${professional.name}`)
    if (client?.phone) descLines.push(`📱 ${client.phone}`)
    if (a.notes) descLines.push(`📝 ${a.notes}`)
    const description = descLines.join('\\n')

    // LOCATION: endereço do estabelecimento
    const location = est.address ? escapeIcal(est.address) : ''

    const dtstart = `TZID=America/Sao_Paulo:${toSaoPauloIcal(a.starts_at)}`
    const dtend = `TZID=America/Sao_Paulo:${toSaoPauloIcal(a.ends_at)}`
    const status = a.status === 'confirmado' ? 'CONFIRMED' : 'TENTATIVE'

    const eventLines = [
      'BEGIN:VEVENT',
      `UID:${a.id}@meutoki`,
      `DTSTART;${dtstart}`,
      `DTEND;${dtend}`,
      foldLine(`SUMMARY:${escapeIcal(summary)}`),
    ]
    if (description) eventLines.push(foldLine(`DESCRIPTION:${description}`))
    if (location) eventLines.push(foldLine(`LOCATION:${location}`))
    eventLines.push(`STATUS:${status}`)
    eventLines.push('END:VEVENT')

    events.push(eventLines.join('\r\n'))
  }

  const body = [
    header.join('\r\n'),
    VTIMEZONE,
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')

  return new Response(body, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${slug}.ics"`,
      'Cache-Control': 'no-cache, no-store',
    },
  })
})
