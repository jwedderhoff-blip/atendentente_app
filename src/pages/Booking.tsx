import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, addMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Clock, DollarSign, User, CheckCircle, ChevronLeft, Scissors } from 'lucide-react'
import { useEstablishmentBySlug } from '../hooks/useEstablishment'
import { useServices } from '../hooks/useServices'
import { useProfessionals } from '../hooks/useProfessionals'
import { useAvailability } from '../hooks/useAvailability'
import { useClients } from '../hooks/useClients'
import { useAppointments } from '../hooks/useAppointments'
import { usePixPayment } from '../hooks/usePixPayment'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Calendar } from '../components/ui/Calendar'
import { TimeSlotGrid } from '../components/ui/TimeSlotGrid'
import { PixPayment } from '../components/ui/PixPayment'
import { formatCurrency, formatPhone } from '../lib/utils'
import type { Service, Professional } from '../types'

type Step = 1 | 2 | 3 | 4 | 5

const clientSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  phone: z.string().min(10, 'Telefone inválido'),
  email: z.string().email('Email inválido').or(z.literal('')),
  marketing_opt_in: z.boolean(),
})

type ClientData = z.infer<typeof clientSchema>

function StepIndicator({ current, total }: { current: Step; total: number }) {
  return (
    <div className="flex gap-1.5 mb-8">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`flex-1 h-1.5 rounded-full transition-all ${
            i + 1 < current ? 'bg-purple-300' : i + 1 === current ? 'bg-purple-600' : 'bg-gray-200'
          }`}
        />
      ))}
    </div>
  )
}

export default function Booking() {
  const { slug } = useParams<{ slug: string }>()
  const { establishment, loading: estLoading } = useEstablishmentBySlug(slug)
  const { services } = useServices(establishment?.id)
  const { professionals } = useProfessionals(establishment?.id)

  const [step, setStep] = useState<Step>(1)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [appointmentId, setAppointmentId] = useState<string | null>(null)
  const [confirmedClientData, setConfirmedClientData] = useState<ClientData | null>(null)
  const [bookingError, setBookingError] = useState<string | null>(null)

  const eligibleProfessionals = selectedService
    ? professionals.filter((p) => p.services.includes(selectedService.id))
    : professionals

  const { slots, loading: slotsLoading } = useAvailability({
    establishmentId: establishment?.id,
    professionalId: selectedProfessional?.id,
    serviceId: selectedService?.id,
    date: selectedDate,
    durationMinutes: selectedService?.duration_minutes ?? 0,
  })

  const { createClient } = useClients(establishment?.id)
  const { createAppointment } = useAppointments(establishment?.id)
  const { pixData, loading: pixLoading, generatePix } = usePixPayment()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ClientData>({
    resolver: zodResolver(clientSchema),
    defaultValues: { marketing_opt_in: false },
  })

  // Auto-generate PIX when arriving at step 5
  useEffect(() => {
    if (
      step === 5 &&
      appointmentId &&
      selectedService &&
      establishment &&
      confirmedClientData &&
      !pixData &&
      !pixLoading
    ) {
      void generatePix({
        appointment_id: appointmentId,
        amount: selectedService.price,
        description: `${selectedService.name} - ${establishment.name}`,
        payer_email: confirmedClientData.email || 'cliente@atendente.app',
        payer_name: confirmedClientData.name,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  const activeServices = services.filter((s) => s.active)

  const goBack = () => {
    if (step === 2) setStep(1)
    else if (step === 3) {
      if (selectedService?.schedule_type === 'fixed') setStep(1)
      else setStep(eligibleProfessionals.length > 1 ? 2 : 1)
    }
    else if (step === 4) setStep(3)
  }

  const selectService = (s: Service) => {
    setSelectedService(s)
    if (s.schedule_type === 'fixed') {
      setSelectedProfessional(null)
      setStep(3)
      return
    }
    const eligible = professionals.filter((p) => p.services.includes(s.id))
    if (eligible.length === 1) {
      setSelectedProfessional(eligible[0])
      setStep(3)
    } else if (eligible.length === 0) {
      setSelectedProfessional(professionals[0] ?? null)
      setStep(3)
    } else {
      setStep(2)
    }
  }

  const selectProfessional = (p: Professional) => {
    setSelectedProfessional(p)
    setStep(3)
  }

  const selectTime = (time: string) => {
    setSelectedTime(time)
  }

  const submitBooking = async (clientData: ClientData) => {
    if (!establishment || !selectedService || !selectedDate || !selectedTime) return
    setBookingError(null)

    const { client, error: clientError } = await createClient({
      establishment_id: establishment.id,
      name: clientData.name,
      phone: clientData.phone.replace(/\D/g, ''),
      email: clientData.email || undefined,
      marketing_opt_in: clientData.marketing_opt_in,
    })

    if (!client) {
      setBookingError(clientError ?? 'Erro ao salvar seus dados. Tente novamente.')
      return
    }

    const [h, m] = selectedTime.split(':').map(Number)
    const startsAt = new Date(selectedDate)
    startsAt.setHours(h, m, 0, 0)
    const endsAt = addMinutes(startsAt, selectedService.duration_minutes)

    const { appointment, error: apptError } = await createAppointment({
      establishment_id: establishment.id,
      client_id: client.id,
      ...(selectedProfessional ? { professional_id: selectedProfessional.id } : {}),
      service_id: selectedService.id,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
    })

    if (!appointment) {
      setBookingError(apptError ?? 'Erro ao confirmar agendamento. Tente novamente.')
      return
    }

    setAppointmentId(appointment.id)
    setConfirmedClientData(clientData)
    setStep(5)
  }

  if (estLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Carregando...</div>
      </div>
    )
  }

  if (!establishment) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-500">Estabelecimento não encontrado.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center">
            <Scissors size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{establishment.name}</p>
            <p className="text-xs text-gray-400 capitalize">{establishment.category}</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        {step < 5 && <StepIndicator current={step} total={4} />}

        {step > 1 && step < 5 && (
          <button
            onClick={goBack}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-purple-700 mb-4 transition"
          >
            <ChevronLeft size={16} /> Voltar
          </button>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Escolha o serviço</h2>
            <p className="text-sm text-gray-400 mb-6">Selecione o que deseja realizar</p>
            {activeServices.length === 0 ? (
              <p className="text-center text-gray-400 py-10">Nenhum serviço disponível.</p>
            ) : (
              <div className="space-y-3">
                {activeServices.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => selectService(s)}
                    className={`w-full text-left bg-white rounded-2xl border p-4 transition hover:border-purple-400 hover:shadow-sm ${
                      selectedService?.id === s.id
                        ? 'border-purple-600 ring-2 ring-purple-200'
                        : 'border-gray-200'
                    }`}
                  >
                    <p className="font-semibold text-gray-900">{s.name}</p>
                    {s.description && <p className="text-xs text-gray-400 mt-0.5">{s.description}</p>}
                    <div className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Clock size={14} /> {s.duration_minutes}min
                      </span>
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-purple-700">
                        <DollarSign size={14} /> {formatCurrency(s.price)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Escolha o profissional</h2>
            <p className="text-sm text-gray-400 mb-6">Com quem deseja ser atendido?</p>
            <div className="space-y-3">
              {eligibleProfessionals.map((p) => (
                <button
                  key={p.id}
                  onClick={() => selectProfessional(p)}
                  className={`w-full text-left bg-white rounded-2xl border p-4 flex items-center gap-4 transition hover:border-purple-400 hover:shadow-sm ${
                    selectedProfessional?.id === p.id
                      ? 'border-purple-600 ring-2 ring-purple-200'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                    <User size={20} className="text-purple-600" />
                  </div>
                  <p className="font-semibold text-gray-900">{p.name}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Escolha a data e horário</h2>
            <p className="text-sm text-gray-400 mb-6">Selecione quando deseja ser atendido</p>

            <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4">
              <Calendar
                selected={selectedDate}
                onSelect={(d) => {
                  setSelectedDate(d)
                  setSelectedTime(null)
                }}
              />
            </div>

            {selectedDate && (
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <p className="text-sm font-semibold text-gray-700 mb-3 capitalize">
                  {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                </p>
                {slotsLoading ? (
                  <p className="text-sm text-gray-400 text-center py-4">Verificando horários...</p>
                ) : (
                  <TimeSlotGrid
                    slots={slots}
                    selected={selectedTime}
                    onSelect={selectTime}
                  />
                )}
              </div>
            )}

            {selectedDate && selectedTime && (
              <Button className="w-full mt-4" size="lg" onClick={() => setStep(4)}>
                Continuar
              </Button>
            )}
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Seus dados</h2>
            <p className="text-sm text-gray-400 mb-6">Preencha para confirmar o agendamento</p>

            <div className="bg-purple-50 rounded-2xl p-4 mb-6 text-sm">
              <p className="font-semibold text-purple-800">{selectedService?.name}</p>
              <p className="text-purple-600 mt-0.5">
                {selectedProfessional?.name} ·{' '}
                {selectedDate &&
                  format(selectedDate, "d 'de' MMMM", { locale: ptBR })}{' '}
                às {selectedTime}
              </p>
            </div>

            <form onSubmit={handleSubmit(submitBooking)} className="space-y-4">
              <Input
                label="Nome completo *"
                placeholder="Seu nome"
                error={errors.name?.message}
                {...register('name')}
              />
              <Input
                label="WhatsApp *"
                placeholder="(11) 99999-9999"
                error={errors.phone?.message}
                {...register('phone')}
              />
              <Input
                label="Email (opcional)"
                type="email"
                placeholder="seu@email.com"
                error={errors.email?.message}
                {...register('email')}
              />
              <label className="flex items-start gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" {...register('marketing_opt_in')} className="mt-0.5 rounded" />
                Quero receber promoções e novidades por WhatsApp
              </label>

              {bookingError && (
                <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{bookingError}</p>
              )}

              <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
                Confirmar agendamento
              </Button>
            </form>
          </div>
        )}

        {step === 5 && (
          <div className="py-4">
            <div className="text-center mb-6">
              <CheckCircle size={56} className="text-green-500 mx-auto mb-3" />
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Agendamento confirmado!</h2>
              <p className="text-sm text-gray-500">
                Você receberá um lembrete por WhatsApp antes do horário.
              </p>
            </div>

            {selectedService && selectedDate && selectedTime && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5">
                <p className="font-semibold text-gray-900 mb-3">Resumo</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Serviço</span>
                    <span className="font-medium">{selectedService.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Profissional</span>
                    <span className="font-medium">{selectedProfessional?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Data</span>
                    <span className="font-medium capitalize">
                      {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Horário</span>
                    <span className="font-medium">{selectedTime}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-100 pt-2 mt-2">
                    <span className="text-gray-500">Valor</span>
                    <span className="font-semibold text-purple-700">
                      {formatCurrency(selectedService.price)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {selectedService && selectedService.price > 0 && (
              <div className="mb-4">
                <p className="font-semibold text-gray-900 mb-3">Pagamento via PIX</p>
                {pixData ? (
                  <PixPayment
                    pixData={pixData}
                    amount={selectedService.price}
                    loading={false}
                  />
                ) : (
                  <PixPayment
                    pixData={{ qr_code: '', qr_code_base64: '', ticket_url: '', payment_id: '', status: 'pending' }}
                    amount={selectedService.price}
                    loading={pixLoading}
                  />
                )}
              </div>
            )}

            <p className="text-xs text-gray-400 text-center mt-2">
              {establishment.phone && `Dúvidas? Fale conosco: ${formatPhone(establishment.phone)}`}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
