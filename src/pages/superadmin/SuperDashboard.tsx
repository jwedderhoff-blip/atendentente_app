import { useMemo, useState } from 'react'
import { useAllEstablishments, useAllSubscriptions, usePlans, type Plan, type Subscription } from '../../hooks/useSuperAdmin'
import { Building2, TrendingUp, CreditCard, AlertTriangle, CheckCircle2, Clock, XCircle, CalendarClock } from 'lucide-react'
import { formatCurrency } from '../../lib/utils'

// Paleta validada contra a superfície escura do painel (#181b24)
const SERIES = '#3987e5'
const INK = '#e8eaf0'
const INK_MUTED = '#9aa1b1'
const GRID = '#2a2f3d'

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

/** Dias de um ciclo de cobrança do plano. */
function cycleDays(plan: Plan | undefined): number {
  if (!plan) return 30
  if (plan.billing_type === 'package' && plan.package_days) return plan.package_days
  return 30
}

/** Valor cobrado a cada ciclo. */
function cycleValue(plan: Plan | undefined): number {
  if (!plan) return 0
  if (plan.billing_type === 'package') return plan.price_package ?? 0
  return plan.price_monthly ?? 0
}

/** Valor normalizado para 30 dias — permite somar planos de ciclos diferentes. */
function monthlyValue(plan: Plan | undefined): number {
  if (!plan) return 0
  const days = cycleDays(plan)
  return days > 0 ? (cycleValue(plan) / days) * 30 : 0
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null
  const diff = new Date(iso).getTime() - Date.now()
  return Math.ceil(diff / 86_400_000)
}

type BucketKey = 'vencida' | 'ate7' | 'ate30' | 'emdia' | 'sem'

const BUCKETS: { key: BucketKey; label: string; color: string; icon: typeof XCircle }[] = [
  { key: 'vencida', label: 'Vencidas', color: '#d03b3b', icon: XCircle },
  { key: 'ate7', label: 'Vencem em 7 dias', color: '#ec835a', icon: AlertTriangle },
  { key: 'ate30', label: 'Vencem em 30 dias', color: '#fab219', icon: Clock },
  { key: 'emdia', label: 'Em dia', color: '#0ca30c', icon: CheckCircle2 },
  { key: 'sem', label: 'Sem validade', color: INK_MUTED, icon: CalendarClock },
]

function bucketOf(expiresAt: string | null): BucketKey {
  const d = daysUntil(expiresAt)
  if (d === null) return 'sem'
  if (d < 0) return 'vencida'
  if (d <= 7) return 'ate7'
  if (d <= 30) return 'ate30'
  return 'emdia'
}

/** Caminho de barra com topo arredondado e base reta na linha zero. */
function barPath(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.max(0, Math.min(r, h, w / 2))
  return `M${x},${y + h} L${x},${y + rr} Q${x},${y} ${x + rr},${y} L${x + w - rr},${y} Q${x + w},${y} ${x + w},${y + rr} L${x + w},${y + h} Z`
}

interface ForecastMonth {
  label: string
  full: string
  total: number
  renewals: number
}

export default function SuperDashboard() {
  const { establishments } = useAllEstablishments()
  const { subscriptions } = useAllSubscriptions()
  const { plans } = usePlans()
  const [activeBucket, setActiveBucket] = useState<BucketKey | null>(null)
  const [hovered, setHovered] = useState<number | null>(null)

  const planById = useMemo(() => new Map(plans.map((p) => [p.id, p])), [plans])

  // ── Receita ──────────────────────────────────────────────────────────────
  const revenue = useMemo(() => {
    const actives = subscriptions.filter((s) => s.status === 'active')
    const mrr = actives.reduce((sum, s) => sum + monthlyValue(planById.get(s.plan_id ?? '')), 0)
    const atRisk = actives
      .filter((s) => {
        const d = daysUntil(s.expires_at)
        return d !== null && d <= 30
      })
      .reduce((sum, s) => sum + monthlyValue(planById.get(s.plan_id ?? '')), 0)
    const trialMrr = subscriptions
      .filter((s) => s.status === 'trial')
      .reduce((sum, s) => sum + monthlyValue(planById.get(s.plan_id ?? '')), 0)
    return {
      mrr,
      arr: mrr * 12,
      ticket: actives.length > 0 ? mrr / actives.length : 0,
      atRisk,
      trialMrr,
      activeCount: actives.length,
    }
  }, [subscriptions, planById])

  // ── Previsibilidade: receita contratada a renovar nos próximos 6 meses ───
  // Projeta cada assinatura ativa a partir da data de vencimento, avançando
  // pelo ciclo do plano. É receita já contratada, não estimativa de vendas.
  const forecast = useMemo<ForecastMonth[]>(() => {
    const now = new Date()
    const months: ForecastMonth[] = []
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
      months.push({
        label: MONTHS[d.getMonth()],
        full: `${MONTHS[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`,
        total: 0,
        renewals: 0,
      })
    }
    const horizon = new Date(now.getFullYear(), now.getMonth() + 6, 1).getTime()

    for (const s of subscriptions) {
      if (s.status !== 'active' && s.status !== 'trial') continue
      const plan = planById.get(s.plan_id ?? '')
      if (!plan) continue
      const value = cycleValue(plan)
      if (value <= 0) continue
      const step = cycleDays(plan)
      if (step <= 0) continue

      const cursor = s.expires_at ? new Date(s.expires_at) : new Date()
      // Traz vencimentos passados para o ciclo corrente
      while (cursor.getTime() < now.getTime()) cursor.setDate(cursor.getDate() + step)

      let guard = 0
      while (cursor.getTime() < horizon && guard < 400) {
        const idx = (cursor.getFullYear() - now.getFullYear()) * 12 + cursor.getMonth() - now.getMonth()
        if (idx >= 0 && idx < 6) {
          months[idx].total += value
          months[idx].renewals += 1
        }
        cursor.setDate(cursor.getDate() + step)
        guard++
      }
    }
    return months
  }, [subscriptions, planById])

  // ── Licenças por faixa de validade ───────────────────────────────────────
  const buckets = useMemo(() => {
    const counts: Record<BucketKey, Subscription[]> = {
      vencida: [], ate7: [], ate30: [], emdia: [], sem: [],
    }
    for (const s of subscriptions) {
      if (s.status === 'cancelled') continue
      counts[bucketOf(s.expires_at)].push(s)
    }
    return counts
  }, [subscriptions])

  const listed = activeBucket ? buckets[activeBucket] : []

  const stats = [
    { label: 'Receita recorrente (MRR)', value: formatCurrency(revenue.mrr), sub: `${revenue.activeCount} assinaturas ativas`, icon: TrendingUp, color: '#4ade80' },
    { label: 'Projeção anual (ARR)', value: formatCurrency(revenue.arr), sub: 'MRR × 12', icon: CreditCard, color: '#a5b4fc' },
    { label: 'Ticket médio', value: formatCurrency(revenue.ticket), sub: 'por estabelecimento ativo', icon: Building2, color: '#c084fc' },
    { label: 'Receita em risco', value: formatCurrency(revenue.atRisk), sub: 'vence nos próximos 30 dias', icon: AlertTriangle, color: '#fb923c' },
  ]

  // Geometria do gráfico
  const W = 720, H = 220, PAD_L = 8, PAD_R = 8, PAD_T = 28, PAD_B = 28
  const plotW = W - PAD_L - PAD_R
  const plotH = H - PAD_T - PAD_B
  const maxVal = Math.max(...forecast.map((m) => m.total), 1)
  const band = plotW / forecast.length
  const barW = Math.max(8, band - 10) // folga de 10px => >2px de respiro entre barras

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard da Plataforma</h1>
        <p className="text-sm text-gray-500 mt-1">Receita, previsibilidade e validade das licenças</p>
      </div>

      {/* ── Indicadores de receita ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Icon size={16} style={{ color }} />
              <p className="text-xs text-gray-500">{label}</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Previsibilidade ── */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
          <h2 className="font-semibold text-gray-900">Receita contratada a renovar</h2>
          <span className="text-xs text-gray-400">próximos 6 meses</span>
        </div>
        <p className="text-xs text-gray-500 mb-5">
          Renovações já contratadas, projetadas pelo ciclo de cada plano. Não inclui vendas novas.
        </p>

        <div className="relative">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img"
            aria-label="Receita contratada a renovar nos próximos seis meses">
            {/* Grade recessiva */}
            {[0, 0.25, 0.5, 0.75, 1].map((t) => {
              const y = PAD_T + plotH - t * plotH
              return <line key={t} x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke={GRID} strokeWidth={1} />
            })}

            {forecast.map((m, i) => {
              // piso de 3px: um valor pequeno ainda precisa registrar como marca
              const h = m.total > 0 ? Math.max(3, (m.total / maxVal) * plotH) : 0
              const x = PAD_L + i * band + (band - barW) / 2
              const y = PAD_T + plotH - h
              const isHot = hovered === i
              return (
                <g key={m.full}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  style={{ cursor: 'default' }}>
                  {/* Alvo de hover maior que a marca */}
                  <rect x={PAD_L + i * band} y={PAD_T} width={band} height={plotH} fill="transparent" />
                  {m.total > 0 && (
                    <path d={barPath(x, y, barW, h, 4)} fill={SERIES} opacity={isHot ? 1 : 0.88} />
                  )}
                  {/* Rótulo direto — só 6 barras, mantém legível sem tooltip */}
                  <text x={x + barW / 2} y={y - 8} textAnchor="middle"
                    fill={isHot ? INK : INK_MUTED} fontSize={11} fontWeight={isHot ? 600 : 400}>
                    {m.total > 0 ? formatCurrency(m.total).replace(/\s/g, ' ') : '—'}
                  </text>
                  <text x={x + barW / 2} y={H - 8} textAnchor="middle" fill={INK_MUTED} fontSize={11}>
                    {m.full}
                  </text>
                </g>
              )
            })}
          </svg>

          {hovered !== null && forecast[hovered].total > 0 && (
            <div className="absolute top-0 pointer-events-none text-xs rounded-lg px-3 py-2 border whitespace-nowrap -translate-x-1/2"
              style={{
                left: `${((PAD_L + hovered * band + band / 2) / W) * 100}%`,
                background: '#1f2330',
                borderColor: GRID,
                color: INK,
              }}>
              <span className="font-semibold">{forecast[hovered].full}</span>
              {' — '}
              {forecast[hovered].renewals} renovaç{forecast[hovered].renewals === 1 ? 'ão' : 'ões'}
            </div>
          )}
        </div>

        {revenue.trialMrr > 0 && (
          <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-gray-100">
            Trials em andamento somam {formatCurrency(revenue.trialMrr)}/mês em receita potencial se converterem.
          </p>
        )}
      </div>

      {/* ── Validade das licenças ── */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <h2 className="font-semibold text-gray-900 mb-1">Validade das licenças</h2>
        <p className="text-xs text-gray-500 mb-5">Clique em uma faixa para ver os estabelecimentos.</p>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {BUCKETS.map(({ key, label, color, icon: Icon }) => {
            const count = buckets[key].length
            const selected = activeBucket === key
            return (
              <button key={key}
                onClick={() => setActiveBucket(selected ? null : key)}
                className="text-left rounded-xl p-4 border transition"
                style={{
                  borderColor: selected ? color : GRID,
                  background: selected ? `${color}22` : 'transparent',
                }}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={15} style={{ color }} />
                  <span className="text-xs text-gray-500">{label}</span>
                </div>
                <p className="text-xl font-bold text-gray-900">{count}</p>
              </button>
            )
          })}
        </div>

        {activeBucket && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            {listed.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhum estabelecimento nesta faixa.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500">
                      <th className="pb-2 font-medium">Estabelecimento</th>
                      <th className="pb-2 font-medium">Plano</th>
                      <th className="pb-2 font-medium">Valor/mês</th>
                      <th className="pb-2 font-medium">Vence em</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {listed.map((s) => {
                      const plan = planById.get(s.plan_id ?? '')
                      const d = daysUntil(s.expires_at)
                      return (
                        <tr key={s.id}>
                          <td className="py-2 text-gray-900">{s.establishments?.name ?? '—'}</td>
                          <td className="py-2 text-gray-500">{plan?.name ?? 'Sem plano'}</td>
                          <td className="py-2 text-gray-500">{formatCurrency(monthlyValue(plan))}</td>
                          <td className="py-2 text-gray-500">
                            {s.expires_at
                              ? `${new Date(s.expires_at).toLocaleDateString('pt-BR')}${d !== null ? ` (${d}d)` : ''}`
                              : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Base de estabelecimentos ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">Base de estabelecimentos</h2>
          <div className="space-y-3">
            {[
              { label: 'Ativos', count: establishments.filter((e) => e.status === 'active' || e.status === 'ativo').length, color: '#0ca30c' },
              { label: 'Em trial', count: establishments.filter((e) => e.status === 'trial').length, color: '#fab219' },
              { label: 'Suspensos', count: establishments.filter((e) => e.status === 'suspended' || e.status === 'suspenso').length, color: '#d03b3b' },
            ].map(({ label, count, color }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                <span className="text-sm text-gray-600 flex-1">{label}</span>
                <span className="text-sm font-semibold text-gray-900">{count}</span>
              </div>
            ))}
            <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
              <span className="text-sm text-gray-600 flex-1">Total cadastrado</span>
              <span className="text-sm font-semibold text-gray-900">{establishments.length}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">Planos e preços</h2>
          {plans.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhum plano cadastrado ainda.</p>
          ) : (
            <div className="space-y-2">
              {plans.map((p) => {
                const assinantes = subscriptions.filter((s) => s.plan_id === p.id && s.status === 'active').length
                return (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                      <p className="text-xs text-gray-400">
                        {assinantes} assinante{assinantes === 1 ? '' : 's'}
                        {' · '}
                        {formatCurrency(monthlyValue(p))}/mês
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.is_active ? 'ativo' : 'inativo'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
