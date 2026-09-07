import { useState, useEffect } from 'react'
import {
  useAllEstablishments,
  useProfessionalsForEstablishment,
  type SuperEstablishment,
} from '../../hooks/useSuperAdmin'
import {
  CheckCircle, XCircle, Clock, Search, ExternalLink,
  Edit, X, Plus, Trash2, Check, Users, Building2,
} from 'lucide-react'

const STATUS_LABELS: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  active:    { label: 'Ativo',    color: 'bg-green-100 text-green-700',  icon: CheckCircle },
  trial:     { label: 'Trial',    color: 'bg-amber-100 text-amber-700',  icon: Clock },
  suspended: { label: 'Suspenso', color: 'bg-red-100 text-red-700',      icon: XCircle },
}

const CATEGORY_LABELS: Record<string, string> = {
  salao: 'Salão de Beleza', barbearia: 'Barbearia', estetica: 'Estética',
  pilates: 'Pilates', avaliacao_fisica: 'Avaliação Física',
  avaliacao_nutricional: 'Avaliação Nutricional', academia: 'Academia', outro: 'Outro',
}

const CATEGORIES = Object.entries(CATEGORY_LABELS)

// ── Modal de edição ───────────────────────────────────────────────────────────
interface EditModalProps {
  establishment: SuperEstablishment
  onClose: () => void
  onSave: (id: string, updates: Partial<SuperEstablishment>) => Promise<{ error: string | null }>
}

function EditModal({ establishment, onClose, onSave }: EditModalProps) {
  const [tab, setTab] = useState<'dados' | 'profissionais'>('dados')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Campos do estabelecimento
  const [name, setName]       = useState(establishment.name)
  const [email, setEmail]     = useState(establishment.email ?? '')
  const [phone, setPhone]     = useState(establishment.phone ?? '')
  const [address, setAddress] = useState(establishment.address ?? '')
  const [category, setCategory] = useState(establishment.category)
  const [slug, setSlug]       = useState(establishment.slug)

  // Profissionais
  const { professionals, loading: loadingProfs, addProfessional, updateProfessional, deleteProfessional } =
    useProfessionalsForEstablishment(establishment.id)
  const [newProfName, setNewProfName] = useState('')
  const [addingProf, setAddingProf]   = useState(false)
  const [editingProfId, setEditingProfId] = useState<string | null>(null)
  const [editingProfName, setEditingProfName] = useState('')

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    const { error: err } = await onSave(establishment.id, {
      name: name.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      address: address.trim() || null,
      category,
      slug: slug.trim(),
    })
    if (err) setError(err)
    else onClose()
    setSaving(false)
  }

  const handleAddProf = async () => {
    if (!newProfName.trim()) return
    setAddingProf(true)
    await addProfessional(establishment.id, newProfName.trim())
    setNewProfName('')
    setAddingProf(false)
  }

  const handleUpdateProf = async (id: string) => {
    if (!editingProfName.trim()) return
    await updateProfessional(id, establishment.id, editingProfName.trim())
    setEditingProfId(null)
  }

  const handleDeleteProf = async (id: string) => {
    if (!confirm('Remover este profissional?')) return
    await deleteProfessional(id, establishment.id)
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={onClose} />

      {/* Drawer lateral */}
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-white shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Building2 size={18} className="text-indigo-600" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-tight">{establishment.name}</p>
              <p className="text-xs text-gray-400">{CATEGORY_LABELS[establishment.category]}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 shrink-0">
          {([
            { key: 'dados',         label: 'Dados',          Icon: Building2 },
            { key: 'profissionais', label: 'Profissionais',  Icon: Users },
          ] as const).map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition ${
                tab === key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-400 hover:text-gray-700'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* Conteúdo rolável */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Aba Dados ── */}
          {tab === 'dados' && (
            <div className="p-6 space-y-4">
              <Field label="Nome do estabelecimento">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputCls}
                  placeholder="Nome"
                />
              </Field>

              <Field label="Categoria">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={inputCls}
                >
                  {CATEGORIES.map(([val, lbl]) => (
                    <option key={val} value={val}>{lbl}</option>
                  ))}
                </select>
              </Field>

              <Field label="Slug (URL pública)">
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  className={inputCls}
                  placeholder="meu-estabelecimento"
                />
                <p className="text-xs text-gray-400 mt-1">/agendar/<strong>{slug || '...'}</strong></p>
              </Field>

              <Field label="E-mail">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputCls}
                  placeholder="contato@exemplo.com"
                />
              </Field>

              <Field label="Telefone / WhatsApp">
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputCls}
                  placeholder="(47) 99999-9999"
                />
              </Field>

              <Field label="Endereço">
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={inputCls}
                  placeholder="Rua, número, bairro, cidade"
                />
              </Field>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>
              )}
            </div>
          )}

          {/* ── Aba Profissionais ── */}
          {tab === 'profissionais' && (
            <div className="p-6 space-y-4">
              {/* Adicionar novo */}
              <div className="flex gap-2">
                <input
                  value={newProfName}
                  onChange={(e) => setNewProfName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddProf()}
                  className={`${inputCls} flex-1`}
                  placeholder="Nome do profissional"
                />
                <button
                  onClick={handleAddProf}
                  disabled={!newProfName.trim() || addingProf}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 transition"
                >
                  <Plus size={15} />
                  Adicionar
                </button>
              </div>

              {/* Lista */}
              {loadingProfs ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                </div>
              ) : professionals.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-8">
                  Nenhum profissional cadastrado.
                </p>
              ) : (
                <ul className="space-y-2">
                  {professionals.map((p) => (
                    <li key={p.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 text-sm font-bold text-indigo-600">
                        {p.name.charAt(0).toUpperCase()}
                      </div>

                      {editingProfId === p.id ? (
                        <input
                          autoFocus
                          value={editingProfName}
                          onChange={(e) => setEditingProfName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdateProf(p.id)
                            if (e.key === 'Escape') setEditingProfId(null)
                          }}
                          className="flex-1 text-sm border border-indigo-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      ) : (
                        <span className="flex-1 text-sm font-medium text-gray-900">{p.name}</span>
                      )}

                      <div className="flex items-center gap-1 shrink-0">
                        {editingProfId === p.id ? (
                          <>
                            <button
                              onClick={() => handleUpdateProf(p.id)}
                              className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => setEditingProfId(null)}
                              className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition"
                            >
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => { setEditingProfId(p.id); setEditingProfName(p.name) }}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteProf(p.id)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Footer com botão salvar (só na aba dados) */}
        {tab === 'dados' && (
          <div className="px-6 py-4 border-t border-gray-100 shrink-0">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}

// helpers locais
const inputCls = 'w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function SuperEstabelecimentos() {
  const { establishments, loading, updateStatus, updateEstablishment } = useAllEstablishments()
  const [search, setSearch]     = useState('')
  const [updating, setUpdating] = useState<string | null>(null)
  const [editing, setEditing]   = useState<SuperEstablishment | null>(null)

  // sincroniza o item em edição se o refetch atualizar os dados
  useEffect(() => {
    if (!editing) return
    const fresh = establishments.find((e) => e.id === editing.id)
    if (fresh) setEditing(fresh)
  }, [establishments])

  const filtered = establishments.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.email?.toLowerCase().includes(search.toLowerCase())
  )

  const handleStatus = async (id: string, status: string) => {
    setUpdating(id)
    await updateStatus(id, status)
    setUpdating(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Estabelecimentos</h1>
        <p className="text-sm text-gray-500 mt-1">Todos os cadastros na plataforma</p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          {filtered.length === 0 ? (
            <p className="text-center text-gray-400 py-10">Nenhum estabelecimento encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Estabelecimento</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Categoria</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Plano</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Cadastro</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((e) => {
                    const st = STATUS_LABELS[e.status] ?? STATUS_LABELS.trial
                    const StatusIcon = st.icon
                    const planName = e.subscriptions?.[0]?.plans?.name ?? '—'
                    return (
                      <tr key={e.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{e.name}</p>
                          <p className="text-xs text-gray-400">{e.email ?? '—'}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {CATEGORY_LABELS[e.category] ?? e.category}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{planName}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${st.color}`}>
                            <StatusIcon size={12} />
                            {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {new Date(e.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            {/* Editar */}
                            <button
                              onClick={() => setEditing(e)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                              title="Editar"
                            >
                              <Edit size={14} />
                            </button>
                            {/* Ver página pública */}
                            <a
                              href={`/agendar/${e.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                              title="Ver página pública"
                            >
                              <ExternalLink size={14} />
                            </a>
                            {/* Status */}
                            {e.status !== 'active' && (
                              <button
                                onClick={() => handleStatus(e.id, 'active')}
                                disabled={updating === e.id}
                                className="text-xs px-2.5 py-1 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition font-medium disabled:opacity-50"
                              >
                                Ativar
                              </button>
                            )}
                            {e.status !== 'suspended' && (
                              <button
                                onClick={() => handleStatus(e.id, 'suspended')}
                                disabled={updating === e.id}
                                className="text-xs px-2.5 py-1 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition font-medium disabled:opacity-50"
                              >
                                Suspender
                              </button>
                            )}
                          </div>
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

      {/* Drawer de edição */}
      {editing && (
        <EditModal
          establishment={editing}
          onClose={() => setEditing(null)}
          onSave={updateEstablishment}
        />
      )}
    </div>
  )
}
