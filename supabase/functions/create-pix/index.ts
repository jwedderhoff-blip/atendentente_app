const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const { appointment_id, amount, description, payer_email, payer_name } =
    await req.json() as {
      appointment_id: string
      amount: number
      description: string
      payer_email: string
      payer_name: string
    }

  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  }

  // Demo mode when no MP_ACCESS_TOKEN configured
  if (!MP_ACCESS_TOKEN) {
    const demoData = {
      qr_code:
        '00020126580014BR.GOV.BCB.PIX0136demo-pix-key-atendente-app52040000530398654071234.565802BR5925Atendente App Demo6009Sao Paulo62070503***63041D3D',
      qr_code_base64: '',
      ticket_url: '',
      payment_id: 'demo-' + crypto.randomUUID(),
      status: 'pending',
      demo: true,
    }
    return new Response(JSON.stringify(demoData), { headers: corsHeaders })
  }

  const pixPayload = {
    transaction_amount: amount,
    description,
    payment_method_id: 'pix',
    payer: {
      email: payer_email,
      first_name: payer_name,
    },
  }

  const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': appointment_id,
    },
    body: JSON.stringify(pixPayload),
  })

  const mpData = await mpRes.json() as {
    id?: number
    status?: string
    point_of_interaction?: {
      transaction_data?: {
        qr_code?: string
        qr_code_base64?: string
        ticket_url?: string
      }
    }
    error?: string
    message?: string
  }

  if (!mpRes.ok) {
    return new Response(
      JSON.stringify({ error: mpData.message ?? mpData.error ?? 'Erro ao criar pagamento PIX' }),
      { status: 500, headers: corsHeaders }
    )
  }

  const txData = mpData.point_of_interaction?.transaction_data ?? {}

  return new Response(
    JSON.stringify({
      qr_code: txData.qr_code ?? '',
      qr_code_base64: txData.qr_code_base64 ?? '',
      ticket_url: txData.ticket_url ?? '',
      payment_id: String(mpData.id ?? ''),
      status: mpData.status ?? 'pending',
      demo: false,
    }),
    { headers: corsHeaders }
  )
})
