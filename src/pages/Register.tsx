import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Scissors, Mail, Lock, Building2, Phone, MapPin } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  category: z.enum(['salao', 'barbearia', 'estetica', 'pilates', 'outro']),
  phone: z.string().min(10, 'Telefone inválido'),
  address: z.string().min(5, 'Endereço obrigatório'),
  email: z.string().min(1, 'Email obrigatório').email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

type FormData = z.infer<typeof schema>

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    // Tenta signup; se o usuário já existe, tenta login direto
    const { error: authError } = await signUp(data.email, data.password)
    if (authError && !authError.message.includes('already registered')) {
      setError('root', { message: authError.message })
      return
    }

    // Garante sessão ativa fazendo login após signup
    const { error: loginError, data: loginData } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (loginError || !loginData.user) {
      setError('root', { message: loginError?.message ?? 'Erro ao autenticar. Tente novamente.' })
      return
    }

    const user = loginData.user
    const slug = `${slugify(data.name)}-${Math.random().toString(36).slice(2, 6)}`

    const { error: dbError } = await supabase.from('establishments').insert({
      owner_id: user.id,
      name: data.name,
      slug,
      category: data.category,
      phone: data.phone,
      address: data.address,
      email: data.email,
    })

    if (dbError) {
      setError('root', { message: dbError.message })
      return
    }

    navigate('/admin')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center mb-4">
            <Scissors size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Criar conta</h1>
          <p className="text-sm text-gray-500 mt-1">Cadastre seu estabelecimento gratuitamente</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nome do estabelecimento"
            placeholder="Ex: Salão da Maria"
            icon={<Building2 size={16} />}
            error={errors.name?.message}
            {...register('name')}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Categoria</label>
            <select
              className="w-full rounded-xl border border-gray-300 bg-white py-2.5 px-4 text-sm text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition"
              {...register('category')}
            >
              <option value="salao">Salão de beleza</option>
              <option value="barbearia">Barbearia</option>
              <option value="estetica">Estética</option>
              <option value="pilates">Pilates</option>
              <option value="outro">Outro</option>
            </select>
            {errors.category && <p className="text-xs text-red-600">{errors.category.message}</p>}
          </div>

          <Input
            label="Telefone"
            placeholder="(11) 99999-9999"
            icon={<Phone size={16} />}
            error={errors.phone?.message}
            {...register('phone')}
          />

          <Input
            label="Endereço"
            placeholder="Rua, número, bairro, cidade"
            icon={<MapPin size={16} />}
            error={errors.address?.message}
            {...register('address')}
          />

          <Input
            label="Email de acesso"
            type="email"
            placeholder="seu@email.com"
            icon={<Mail size={16} />}
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Senha"
            type="password"
            placeholder="••••••••"
            icon={<Lock size={16} />}
            error={errors.password?.message}
            {...register('password')}
          />

          {errors.root && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
              {errors.root.message}
            </p>
          )}

          <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
            Criar conta
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Já tem conta?{' '}
          <Link to="/login" className="text-purple-600 font-medium hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
