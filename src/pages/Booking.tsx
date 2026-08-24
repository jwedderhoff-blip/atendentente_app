import { useState } from 'react'

type Step = 'servico' | 'horario' | 'dados' | 'confirmacao'

export default function Booking() {
  const [step, setStep] = useState<Step>('servico')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Fazer agendamento</h1>

        <div className="flex gap-2 mb-8">
          {(['servico', 'horario', 'dados', 'confirmacao'] as Step[]).map((s, i) => (
            <div key={s} className={`flex-1 h-2 rounded-full ${step === s ? 'bg-purple-600' : i < ['servico','horario','dados','confirmacao'].indexOf(step) ? 'bg-purple-300' : 'bg-gray-200'}`} />
          ))}
        </div>

        {step === 'servico' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Escolha o serviço</h2>
            <p className="text-gray-500 text-sm">Catálogo de serviços será carregado do Supabase</p>
            <button onClick={() => setStep('horario')} className="mt-6 w-full bg-purple-600 text-white py-3 rounded-xl font-medium">
              Próximo
            </button>
          </div>
        )}

        {step === 'horario' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Escolha o horário</h2>
            <p className="text-gray-500 text-sm">Grade de horários livres será exibida aqui</p>
            <button onClick={() => setStep('dados')} className="mt-6 w-full bg-purple-600 text-white py-3 rounded-xl font-medium">
              Próximo
            </button>
          </div>
        )}

        {step === 'dados' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Seus dados</h2>
            <p className="text-gray-500 text-sm">Formulário de cadastro do cliente</p>
            <button onClick={() => setStep('confirmacao')} className="mt-6 w-full bg-purple-600 text-white py-3 rounded-xl font-medium">
              Confirmar
            </button>
          </div>
        )}

        {step === 'confirmacao' && (
          <div className="text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Agendamento confirmado!</h2>
            <p className="text-gray-500">Você receberá um lembrete por WhatsApp e email.</p>
          </div>
        )}
      </div>
    </div>
  )
}
