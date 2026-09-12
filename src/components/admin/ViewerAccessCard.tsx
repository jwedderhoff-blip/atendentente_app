import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Eye, Trash2, UserPlus, KeyRound } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'

declare const __SUPABASE_URL__: string
declare const __SUPABASE_KEY__: string

type Member = { id: string; email: string; created_at: string }

// Cria a conta do visualizador num cliente isolado, para NÃO trocar a sessão do
// dono que está logado (signUp no cliente principal substituiria a sessão atual).
function isolatedClient() {
  return createClient(__SUPABASE_URL__, __SUPABASE_KEY__, {
    auth: { persistSession: false, autoRefreshToken: false, storageKey: 'viewer-signup' },
  })
}

export default function ViewerAccessCard({ establishmentId }: { establishmentId: string }) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err' | 'info'; text: string } | null>(null)

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('establishment_members')
      .select('id, email, created_at')
      .eq('establishment_id', establishmentId)
      .order('created_at')
    setMembers((data ?? []) as Member[])
    setLoading(false)
  }

  useEffect(() => {
    if (establishmentId) void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [establishmentId])

  const addMember = async () => {
    const mail = email.trim().toLowerCase()
    if (!mail) return
    setBusy(true)
    setMsg(null)

    // 1) Se veio senha, cria a conta de acesso (login compartilhado dos professores).
    if (password) {
      if (password.length < 6) {
        setMsg({ type: 'err', text: 'A senha precisa ter ao menos 6 caracteres.' })
        setBusy(false)
        return
      }
      const iso = isolatedClient()
      const { error: signErr } = await iso.auth.signUp({ email: mail, password })
      // "User already registered" não é erro para o nosso fluxo: a conta já existe,
      // basta liberar o acesso abaixo.
      if (signErr && !/already registered|already exists/i.test(signErr.message)) {
        setMsg({ type: 'err', text: `Não foi possível criar o login: ${signErr.message}` })
        setBusy(false)
        return
      }
    }

    // 2) Libera o acesso (linha em establishment_members).
    const { error: insErr } = await supabase
      .from('establishment_members')
      .insert({ establishment_id: establishmentId, email: mail, role: 'viewer' })

    if (insErr && !/duplicate|unique/i.test(insErr.message)) {
      setMsg({ type: 'err', text: insErr.message })
      setBusy(false)
      return
    }

    setMsg({
      type: 'info',
      text: password
        ? 'Login liberado. Se o seu projeto exige confirmação de e-mail, confirme esta conta uma vez (no e-mail ou no painel do Supabase) antes do primeiro acesso.'
        : 'Acesso liberado para este e-mail.',
    })
    setEmail('')
    setPassword('')
    setBusy(false)
    void load()
  }

  const removeMember = async (id: string) => {
    if (!confirm('Remover o acesso deste login visualizador?')) return
    await supabase.from('establishment_members').delete().eq('id', id)
    void load()
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
        <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
          <Eye size={16} className="text-emerald-600" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900 text-sm">Login dos professores (somente leitura)</h2>
          <p className="text-xs text-gray-400">
            Vê agenda, aulas e o link de compartilhamento. Não cancela, não exclui, não cria aulas.
          </p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Lista de acessos liberados */}
        {loading ? (
          <p className="text-sm text-gray-400">Carregando...</p>
        ) : members.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhum login visualizador liberado ainda.</p>
        ) : (
          <ul className="divide-y divide-gray-50 border border-gray-100 rounded-xl overflow-hidden">
            {members.map((m) => (
              <li key={m.id} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-sm text-gray-800">{m.email}</span>
                <button
                  onClick={() => removeMember(m.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Remover acesso"
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Formulário */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
              <UserPlus size={12} /> E-mail do login
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="professores@suaacademia.com"
              className="rounded-xl border border-gray-200 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
              <KeyRound size={12} /> Senha (só ao criar)
            </label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="mín. 6 caracteres"
              className="rounded-xl border border-gray-200 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        <p className="text-xs text-gray-400">
          Preencha a senha para <strong>criar</strong> um login compartilhado novo. Se o login já existe,
          deixe a senha em branco — assim apenas liberamos o acesso deste e-mail.
        </p>

        {msg && (
          <div
            className={
              'rounded-xl px-4 py-3 text-sm ' +
              (msg.type === 'err'
                ? 'bg-red-50 border border-red-200 text-red-700'
                : msg.type === 'ok'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-blue-50 border border-blue-200 text-blue-700')
            }
          >
            {msg.text}
          </div>
        )}

        <Button size="sm" onClick={addMember} loading={busy} disabled={!email.trim()}>
          <UserPlus size={16} />
          Liberar acesso
        </Button>
      </div>
    </div>
  )
}
