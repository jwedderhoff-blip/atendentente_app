import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')!

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const { appointment_id } = await req.json() as { appointment_id: string }

  const { data: appt, error } = await supabase
    .from('appointments')
    .select('*, client:clients(name,email), service:services(name,price), establishment:establishments(name)')
    .eq('id', appointment_id)
    .single()

  if (error || !appt) {
    return new Response(JSON.stringify({ error: 'Agendamento não encontrado' }), { status: 404 })
  }

  const client = appt.client as { name: string; email?: string }
  const service = appt.service as { name: string; price: number }
  const establishment = appt.establishment as { name: string }

  const preference = {
    items: [
      {
        title: `${service.name} — ${establishment.name}`,
        quantity: 1,
        currency_id: 'BRL',
        unit_price: service.price,
      },
    ],
    payer: {
      name: client.name,
      email: client.email ?? 'cliente@atendente.app',
    },
    external_reference: appointment_id,
    notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/payment-webhook`,
    back_urls: {
      success: `${Deno.env.get('APP_URL')}/agendar/success`,
      failure: `${Deno.env.get('APP_URL')}/agendar/failure`,
    },
    auto_return: 'approved',
  }

  const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(preference),
  })

  const mpData = await mpRes.json() as { id?: string; init_point?: string; error?: string }

  if (!mpRes.ok || !mpData.init_point) {
    return new Response(JSON.stringify({ error: mpData.error ?? 'Erro ao criar preferência' }), {
      status: 500,
    })
  }

  await supabase
    .from('appointments')
    .update({ payment_status: 'pendente' })
    .eq('id', appointment_id)

  return new Response(
    JSON.stringify({ preference_id: mpData.id, init_point: mpData.init_point }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
