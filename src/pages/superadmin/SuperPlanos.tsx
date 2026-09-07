import { useState } from 'react'
import { usePlans } from '../../hooks/useSuperAdmin'
import type { Plan } from '../../hooks/useSuperAdmin'
import { Pencil, Check, X } from 'lucide-react'

function PlanCard({ plan, onSave }: { plan: Plan; onSave: (id: string, updates: Partial<Plan>) => Promise<{ error: string | null }> }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: plan.name,
    description: plan.description ?? '',
    price_monthly: plan.price_monthly,
    max_services: plan.max_services ?? '',
    max_professionals: plan.max_professionals ?? '',
    max_appointments_per_month: plan.max_appointments_per_month ?? '',
    is_active: plan.is_active,
  })

  const handleSave = async () => {
    setSaving(true)
    await onSave(plan.id, {
      name: form.name,
      description: form.description || null,
      price_monthly: Number(form.price_monthly),
      max_services: form.max_services === '' ? null : Number(form.max_services),
      max_professionals: form.max_professionals === '' ? null : Number(form.max_professionals),
      max_appointments_per_month: form.max_appointments_per_month === '' ? null : Number(form.max_appointments_per_month),
      is_active: form.is_active,
    })
    setSaving(false)
    setEditing(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-gray-50 flex items-center justify-between">
        {editing ? (
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="text-base font-semibold text-gray-900 border-b border-indigo-400 outline-none w-full mr-4"
          />
        ) : (
          <h3 className="font-semibold text-gray-900">{plan.name}</h3>
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

      <div className="p-5 space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Descrição</label>
          {editing ? (
            <input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Descrição do plano"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
          ) : (
            <p className="text-sm text-gray-600">{plan.description ?? <span className="text-gray-300 italic">Sem descrição</span>}</p>
          )}
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Preço mensal (R$)</label>
          {editing ? (
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price_monthly}
              onChange={(e) => setForm((f) => ({ ...f, price_monthly: Number(e.target.value) }))}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
          ) : (
            <p className="text-lg font-bold text-indigo-600">
              {plan.price_monthly === 0 ? 'Grátis' : `R$ ${plan.price_monthly.toFixed(2)}/mês`}
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { key: 'max_services', label: 'Serviços' },
            { key: 'max_professionals', label: 'Profissionais' },
            { key: 'max_appointments_per_month', label: 'Agend./mês' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="text-xs font-medium text-gray-500 mb-1 block">{label}</label>
              {editing ? (
                <input
                  type="number"
                  min="0"
                  value={form[key as keyof typeof form] as string}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder="∞"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                />
              ) : (
                <p className="text-sm font-semibold text-gray-900">
                  {plan[key as keyof Plan] ?? <span className="text-gray-400">Ilimitado</span>}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-gray-500">Status</span>
          {editing ? (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                className="accent-indigo-600"
              />
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

export default function SuperPlanos() {
  const { plans, loading, updatePlan } = usePlans()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Planos</h1>
        <p className="text-sm text-gray-500 mt-1">Gerencie os planos disponíveis na plataforma. Clique no lápis para editar.</p>
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
        </div>
      )}
    </div>
  )
}
