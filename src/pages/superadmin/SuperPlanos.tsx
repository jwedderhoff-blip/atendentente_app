import { useState } from 'react'
import { usePlans } from '../../hooks/useSuperAdmin'
import type { Plan } from '../../hooks/useSuperAdmin'
import { Pencil, Check, X, Plus, Calendar, RefreshCw } from 'lucide-react'

const inputCls =
  'w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400'

type BillingType = 'monthly' | 'package'

interface PlanForm {
  name: string
  description: string
  billing_type: BillingType
  price_monthly: number | string
  price_package: number | string
  package_days: number | string
  max_services: number | string
  max_professionals: number | string
  max_appointments_per_month: number | string
  is_active: boolean
}

function emptyForm(): PlanForm {
  return {
    name: '',
    description: '',
    billing_type: 'monthly',
    price_monthly: '',
    price_package: '',
    package_days: 30,
    max_services: '',
    max_professionals: '',
    max_appointments_per_month: '',
    is_active: true,
  }
}

function formToPayload(form: PlanForm): Omit<Plan, 'id' | 'created_at'> {
  return {
    name: form.name,
    description: form.description || null,
    billing_type: form.billing_type,
    price_monthly: form.billing_type === 'monthly' ? Number(form.price_monthly) : 0,
    price_package: form.billing_type === 'package' ? Number(form.price_package) : null,
    package_days: form.billing_type === 'package' ? Number(form.package_days) : null,
    max_services: form.max_services === '' ? null : Number(form.max_services),
    max_professionals: form.max_professionals === '' ? null : Number(form.max_professionals),
    max_appointments_per_month: form.max_appointments_per_month === '' ? null : Number(form.max_appointments_per_month),
    is_active: form.is_active,
  }
}

// ── Card de plano existente ───────────────────────────────────────────────────
function PlanCard({ plan, onSave }: { plan: Plan; onSave: (id: string, updates: Partial<Plan>) => Promise<{ error: string | null }> }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [form, setForm] = useState<PlanForm>({
    name: plan.name,
    description: plan.description ?? '',
    billing_type: plan.billing_type ?? 'monthly',
    price_monthly: plan.price_monthly,
    price_package: plan.price_package ?? '',
    package_days: plan.package_days ?? 30,
    max_services: plan.max_services ?? '',
    max_professionals: plan.max_professionals ?? '',
    max_appointments_per_month: plan.max_appointments_per_month ?? '',
    is_active: plan.is_active,
  })

  const set = (k: keyof PlanForm, v: PlanForm[keyof PlanForm]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    await onSave(plan.id, formToPayload(form))
    setSaving(false)
    setEditing(false)
  }

  const isMonthly = form.billing_type === 'monthly'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-gray-50 flex items-center justify-between gap-3">
        {editing ? (
          <input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            className="text-base font-semibold text-gray-900 border-b border-indigo-400 outline-none flex-1"
            placeholder="Nome do plano"
          />
        ) : (
          <h3 className="font-semibold text-gray-900 flex-1">{plan.name}</h3>
        )}
        <div className="flex gap-1.5 shrink-0">
          {editing ? (
            <>
              <button onClick={handleSave} disabled={saving} className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition">
                <Check size={15} />
              </button>
              <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition">
                <X size={15} />
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
              <Pencil size={15} />
            </button>
          )}
        </div>
      </div>

      <div className="p-5 space-y-4 flex-1">

        {/* Tipo de cobrança */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-2 block">Tipo de cobrança</label>
          {editing ? (
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: 'monthly', label: 'Mensal', Icon: RefreshCw },
                { value: 'package', label: 'Pacote',  Icon: Calendar },
              ] as const).map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set('billing_type', value)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition ${
                    form.billing_type === value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
              (plan.billing_type ?? 'monthly') === 'monthly'
                ? 'bg-blue-50 text-blue-700'
                : 'bg-violet-50 text-violet-700'
            }`}>
              {(plan.billing_type ?? 'monthly') === 'monthly'
                ? <><RefreshCw size={11} /> Mensal</>
                : <><Calendar size={11} /> Pacote {plan.package_days} dias</>
              }
            </span>
          )}
        </div>

        {/* Descrição */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Descrição</label>
          {editing ? (
            <input value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Descrição" className={inputCls} />
          ) : (
            <p className="text-sm text-gray-600">{plan.description ?? <span className="text-gray-300 italic">—</span>}</p>
          )}
        </div>

        {/* Preço */}
        {editing ? (
          isMonthly ? (
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Preço mensal (R$)</label>
              <input type="number" min="0" step="0.01" value={form.price_monthly} onChange={(e) => set('price_monthly', e.target.value)} className={inputCls} placeholder="0.00" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Preço do pacote (R$)</label>
                <input type="number" min="0" step="0.01" value={form.price_package} onChange={(e) => set('price_package', e.target.value)} className={inputCls} placeholder="0.00" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Duração (dias)</label>
                <input type="number" min="1" value={form.package_days} onChange={(e) => set('package_days', e.target.value)} className={inputCls} placeholder="30" />
              </div>
            </div>
          )
        ) : (
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              {(plan.billing_type ?? 'monthly') === 'monthly' ? 'Preço mensal' : 'Preço do pacote'}
            </label>
            <p className="text-lg font-bold text-indigo-600">
              {(plan.billing_type ?? 'monthly') === 'monthly'
                ? plan.price_monthly === 0 ? 'Grátis' : `R$ ${plan.price_monthly.toFixed(2)}/mês`
                : plan.price_package === 0 || plan.price_package == null ? 'Grátis' : `R$ ${plan.price_package.toFixed(2)}`
              }
            </p>
          </div>
        )}

        {/* Limites */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { key: 'max_services',                label: 'Serviços' },
            { key: 'max_professionals',           label: 'Profis.' },
            { key: 'max_appointments_per_month',  label: 'Agend./mês' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="text-xs font-medium text-gray-500 mb-1 block">{label}</label>
              {editing ? (
                <input
                  type="number" min="0"
                  value={form[key as keyof PlanForm] as string}
                  onChange={(e) => set(key as keyof PlanForm, e.target.value)}
                  placeholder="∞"
                  className={inputCls}
                />
              ) : (
                <p className="text-sm font-semibold text-gray-900">
                  {plan[key as keyof Plan] != null ? String(plan[key as keyof Plan]) : <span className="text-gray-400">∞</span>}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Status */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-gray-500">Status</span>
          {editing ? (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} className="accent-indigo-600" />
              <span className="text-sm text-gray-700">Ativo</span>
            </label>
          ) : (
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${plan.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {plan.is_active ? 'Ativo' : 'Inativo'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Card "Novo plano" ─────────────────────────────────────────────────────────
function NewPlanCard({ onCreate }: { onCreate: (data: Omit<Plan, 'id' | 'created_at'>) => Promise<{ error: string | null }> }) {
  const [open, setOpen]     = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const [form, setForm]     = useState<PlanForm>(emptyForm())

  const set = (k: keyof PlanForm, v: PlanForm[keyof PlanForm]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const handleCreate = async () => {
    if (!form.name.trim()) { setError('Informe o nome do plano'); return }
    setSaving(true)
    setError(null)
    const { error: err } = await onCreate(formToPayload(form))
    if (err) { setError(err); setSaving(false); return }
    setForm(emptyForm())
    setOpen(false)
    setSaving(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="bg-white rounded-2xl border-2 border-dashed border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/30 text-gray-400 hover:text-indigo-600 transition flex flex-col items-center justify-center gap-3 p-8 min-h-[320px]"
      >
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
          <Plus size={22} />
        </div>
        <span className="text-sm font-medium">Novo plano</span>
      </button>
    )
  }

  const isMonthly = form.billing_type === 'monthly'

  return (
    <div className="bg-white rounded-2xl border-2 border-indigo-200 shadow-md overflow-hidden flex flex-col">
      <div className="p-5 border-b border-gray-50 flex items-center justify-between gap-3">
        <input
          autoFocus
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="Nome do plano"
          className="text-base font-semibold text-gray-900 border-b border-indigo-400 outline-none flex-1"
        />
        <div className="flex gap-1.5 shrink-0">
          <button onClick={handleCreate} disabled={saving} className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition">
            <Check size={15} />
          </button>
          <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition">
            <X size={15} />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4 flex-1">
        {/* Tipo */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-2 block">Tipo de cobrança</label>
          <div className="grid grid-cols-2 gap-2">
            {([
              { value: 'monthly', label: 'Mensal', Icon: RefreshCw },
              { value: 'package', label: 'Pacote',  Icon: Calendar },
            ] as const).map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => set('billing_type', value)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition ${
                  form.billing_type === value
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Descrição */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Descrição</label>
          <input value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Descrição (opcional)" className={inputCls} />
        </div>

        {/* Preço */}
        {isMonthly ? (
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Preço mensal (R$)</label>
            <input type="number" min="0" step="0.01" value={form.price_monthly} onChange={(e) => set('price_monthly', e.target.value)} className={inputCls} placeholder="0.00" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Preço do pacote (R$)</label>
              <input type="number" min="0" step="0.01" value={form.price_package} onChange={(e) => set('price_package', e.target.value)} className={inputCls} placeholder="0.00" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Duração (dias)</label>
              <input type="number" min="1" value={form.package_days} onChange={(e) => set('package_days', e.target.value)} className={inputCls} placeholder="30" />
            </div>
          </div>
        )}

        {/* Limites */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { key: 'max_services',               label: 'Serviços' },
            { key: 'max_professionals',          label: 'Profis.' },
            { key: 'max_appointments_per_month', label: 'Agend./mês' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="text-xs font-medium text-gray-500 mb-1 block">{label}</label>
              <input
                type="number" min="0"
                value={form[key as keyof PlanForm] as string}
                onChange={(e) => set(key as keyof PlanForm, e.target.value)}
                placeholder="∞"
                className={inputCls}
              />
            </div>
          ))}
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} className="accent-indigo-600" id="new-active" />
          <label htmlFor="new-active" className="text-sm text-gray-700 cursor-pointer">Plano ativo</label>
        </div>

        {error && <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>}

        <button
          onClick={handleCreate}
          disabled={saving}
          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition disabled:opacity-50"
        >
          {saving ? 'Criando...' : 'Criar plano'}
        </button>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function SuperPlanos() {
  const { plans, loading, updatePlan, createPlan } = usePlans()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Planos</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gerencie os planos disponíveis na plataforma. Clique no lápis para editar.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} onSave={updatePlan} />
          ))}
          <NewPlanCard onCreate={createPlan} />
        </div>
      )}
    </div>
  )
}
