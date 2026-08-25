import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

function formatICalDate(iso: string): string {
  // "2026-08-25T09:00:00.000Z" → "20260825T090000Z"
  return iso.replace(/[-:]/g, '').replace(/\.\d{3}/, '').replace(' ', 'T')
}

function escapeIcal(str: string): string {
  return str.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n')
}

Deno.serve(async (req: Request) => {
  // URL: /functions/v1/ical/{slug}
  const slug = new URL(req.url).pathname.split('/').pop()

  if (!slug) {
    return new Response('slug obrigatório', { status: 400 })
  }

  // Busca estabelecimento
  const { data: est, error: estErr } = await supabase
    .from('establishments')
    .select('id, name')
    .eq('slug', slug)
    .single()

  if (estErr || !est) {
    return new Response('Estabelecimento não encontrado', { status: 404 })
  }

  // Busca agendamentos dos próximos 90 dias + últimos 30 dias
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

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//MeuToki//${est.name}//PT`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcal(est.name)}`,
    'X-WR-TIMEZONE:America/Sao_Paulo',
    'X-WR-CALDESC:Agendamentos via MeuToki',
  ]

  for (const a of (appointments ?? [])) {
    const client = a.client as { name: string; phone?: string } | null
    const service = a.service as { name: string } | null
    const professional = a.professional as { name: string } | null

    const summary = [service?.name, client?.name].filter(Boolean).join(' — ')
    const descParts = [
      client?.phone ? `Tel: ${client.phone}` : null,
      professional?.name ? `Profissional: ${professional.name}` : null,
      a.notes ? `Obs: ${a.notes}` : null,
    ].filter(Boolean)

    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${a.id}@meutoki`)
    lines.push(`DTSTART:${formatICalDate(a.starts_at)}`)
    lines.push(`DTEND:${formatICalDate(a.ends_at)}`)
    lines.push(`SUMMARY:${escapeIcal(summary)}`)
    if (descParts.length > 0) {
      lines.push(`DESCRIPTION:${escapeIcal(descParts.join(' | '))}`)
    }
    lines.push(`STATUS:${a.status === 'confirmado' ? 'CONFIRMED' : 'TENTATIVE'}`)
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')

  return new Response(lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${slug}.ics"`,
      'Cache-Control': 'no-cache',
    },
  })
})
