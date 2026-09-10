import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  Bell,
  Briefcase,
  Users,
  CreditCard,
  LayoutDashboard,
  ArrowRight,
  ArrowUpRight,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { cn } from '../lib/utils'

// Imagens do slideshow hero
const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1600&auto=format&fit=crop&q=80', // salão
  'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1600&auto=format&fit=crop&q=80', // barbearia
  'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1600&auto=format&fit=crop&q=80', // pilates
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1600&auto=format&fit=crop&q=80', // academia
  'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1600&auto=format&fit=crop&q=80', // estética
]

const features = [
  { icon: Calendar, title: 'Agendamento online', description: 'Clientes agendam pelo link do seu negócio, 24 horas por dia.' },
  { icon: Bell, title: 'Lembretes automáticos', description: 'Envio automático de lembretes por WhatsApp e e-mail antes do horário.' },
  { icon: Briefcase, title: 'Catálogo de serviços', description: 'Cadastre serviços com duração e preço para facilitar a escolha.' },
  { icon: Users, title: 'Gestão de clientes', description: 'Histórico completo, notas e exportação em CSV a qualquer momento.' },
  { icon: CreditCard, title: 'Pagamento integrado', description: 'Receba online no ato do agendamento com checkout integrado.' },
  { icon: LayoutDashboard, title: 'Painel completo', description: 'Visualize a agenda, equipe e desempenho em um só lugar.' },
]

const stats = [
  { value: 'Quem acredita,', label: 'cresce com a gente' },
  { value: '98%', label: 'Satisfação dos clientes' },
  { value: '< 5 min', label: 'Para configurar' },
  { value: 'Grátis', label: 'Para começar' },
]

const categories = [
  {
    label: 'Salão de Beleza',
    examples: ['Corte, escova e coloração', 'Manicure e pedicure'],
    img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=75',
  },
  {
    label: 'Barbearia',
    examples: ['Corte masculino e barba', 'Tratamento capilar'],
    img: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&auto=format&fit=crop&q=75',
  },
  {
    label: 'Serviços de Beleza',
    examples: ['Unhas e nail design', 'Cílios, sobrancelhas e micropigmentação'],
    img: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&auto=format&fit=crop&q=75',
  },
  {
    label: 'Centro de Estética',
    examples: ['Limpeza de pele e depilação', 'Massagem e drenagem'],
    img: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&auto=format&fit=crop&q=75',
  },
  {
    label: 'Estúdio de Pilates',
    examples: ['Pilates individual e em grupo', 'Avaliação postural'],
    img: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&auto=format&fit=crop&q=75',
  },
  {
    label: 'Aulas Coletivas',
    examples: ['Balé, dança e zumba', 'Jiu-jitsu, karatê e artes marciais'],
    img: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=600&auto=format&fit=crop&q=75',
  },
  {
    label: 'Avaliação Física',
    examples: ['Bioimpedância e antropometria', 'Prescrição de treino'],
    img: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&auto=format&fit=crop&q=75',
  },
  {
    label: 'Avaliação Nutricional',
    examples: ['Consulta e plano alimentar', 'Acompanhamento nutricional'],
    img: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&auto=format&fit=crop&q=75',
  },
  {
    label: 'Academia',
    examples: ['Personal trainer e musculação', 'Aulas funcionais e crossfit'],
    img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=75',
  },
]

const testimonials = [
  {
    name: 'Mariana Costa',
    role: 'Salão da Mari',
    text: 'Reduzi faltas em 70% com os lembretes automáticos. Minha agenda nunca esteve tão organizada.',
    avatar: 'MC',
  },
  {
    name: 'Rafael Mendes',
    role: 'Barbearia RM',
    text: 'Meus clientes adoraram poder agendar pelo celular a qualquer hora. Aumentei os agendamentos em 40%.',
    avatar: 'RM',
  },
  {
    name: 'Juliana Freitas',
    role: 'Studio Pilates Flex',
    text: 'A gestão de turmas e avaliações ficou simples. Economizo horas por semana que antes gastava no WhatsApp.',
    avatar: 'JF',
  },
]

// Paleta contida: tinta quente, papel e um único acento
const INK = '#14131c'
const INK_SOFT = '#57535f'
const MUTED = '#8d8893'
const PAPER = '#fbfaf8'
const PAPER_2 = '#f3f1ec'
const LINE = '#e5e1d9'
const ACCENT = '#4f46e5'

/** Revela elementos [data-reveal] conforme entram na viewport. */
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal], [data-reveal-img]')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduced) {
      els.forEach((el) => el.classList.add('is-visible'))
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            io.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' },
    )

    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}

/** Cabeçalho de seção alinhado à esquerda, com filete e numeração. */
function SectionIntro({ eyebrow, title, italic, lead }: {
  eyebrow: string
  title: string
  italic?: string
  lead?: string
}) {
  return (
    <div className="max-w-2xl mb-14" data-reveal>
      <div className="flex items-center gap-3 mb-5">
        <span className="h-px w-8" style={{ background: ACCENT }} />
        <span className="text-xs uppercase tracking-[0.2em] font-medium" style={{ color: ACCENT }}>
          {eyebrow}
        </span>
      </div>
      <h2 className="font-display text-4xl sm:text-5xl leading-[1.08] tracking-tight" style={{ color: INK }}>
        {title}
        {italic && <><br /><em className="font-normal italic" style={{ color: ACCENT }}>{italic}</em></>}
      </h2>
      {lead && (
        <p className="mt-5 text-base leading-relaxed" style={{ color: INK_SOFT }}>{lead}</p>
      )}
    </div>
  )
}

export default function Home() {
  const { session } = useAuth()
  const [scrolled, setScrolled] = useState(false)

  useScrollReveal()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const n = HERO_IMAGES.length
  const slideDuration = 6
  const fadeDuration = 1.5
  const totalCycle = n * slideDuration
  const slidePct = (slideDuration / totalCycle) * 100

  return (
    <div className="min-h-screen" style={{ background: PAPER }}>

      <style>{`
        @keyframes kenburns-1 { 0% { transform: scale(1)    translate(0%, 0%);   } 100% { transform: scale(1.12) translate(-2%, -1%); } }
        @keyframes kenburns-2 { 0% { transform: scale(1.08) translate(1%, 1%);   } 100% { transform: scale(1)    translate(-1%, 2%);  } }
        @keyframes kenburns-3 { 0% { transform: scale(1)    translate(-1%, 1%);  } 100% { transform: scale(1.10) translate(2%, -2%);  } }
        @keyframes kenburns-4 { 0% { transform: scale(1.05) translate(0%, -1%);  } 100% { transform: scale(1)    translate(-2%, 1%);  } }
        @keyframes kenburns-5 { 0% { transform: scale(1)    translate(1%, 0%);   } 100% { transform: scale(1.12) translate(-1%, -2%); } }
        @keyframes slide-fade {
          0%                                                { opacity: 0; }
          ${(fadeDuration / totalCycle * 100).toFixed(1)}%   { opacity: 1; }
          ${((slideDuration - fadeDuration) / totalCycle * 100).toFixed(1)}% { opacity: 1; }
          ${slidePct.toFixed(1)}%                           { opacity: 0; }
          100%                                              { opacity: 0; }
        }
        @keyframes bar-fill {
          0%                            { transform: scaleX(0); }
          ${slidePct.toFixed(2)}%       { transform: scaleX(1); }
          ${(slidePct + 0.01).toFixed(2)}% { transform: scaleX(0); }
          100%                          { transform: scaleX(0); }
        }
        @keyframes drift { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        .link-arrow svg { transition: transform .35s cubic-bezier(.16,1,.3,1); }
        .link-arrow:hover svg { transform: translate(3px,-3px); }
        .cat-card img { transition: transform 1.2s cubic-bezier(.16,1,.3,1); }
        .cat-card:hover img { transform: scale(1.06); }
        @media (prefers-reduced-motion: reduce) {
          [style*="kenburns"], [style*="slide-fade"], [style*="bar-fill"], [style*="drift"] { animation: none !important; }
        }
      `}</style>

      {/* ══════════════ NAV ══════════════ */}
      <nav
        className="fixed top-0 inset-x-0 z-50 transition-all duration-500"
        style={{
          background: scrolled ? 'rgba(251,250,248,0.88)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: scrolled ? `1px solid ${LINE}` : '1px solid transparent',
        }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span
            className="font-display text-xl tracking-tight transition-colors duration-500"
            style={{ color: scrolled ? INK : '#fff' }}
          >
            Meridio
          </span>
          <div className="flex items-center gap-6">
            {session ? (
              <Link
                to="/selecionar"
                className="text-sm font-medium transition-colors duration-500"
                style={{ color: scrolled ? INK : 'rgba(255,255,255,0.9)' }}
              >
                Minha conta
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium transition-colors duration-500 hidden sm:block"
                  style={{ color: scrolled ? INK_SOFT : 'rgba(255,255,255,0.85)' }}
                >
                  Entrar
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-medium px-5 py-2 rounded-full transition-all duration-300 hover:opacity-90"
                  style={{
                    background: scrolled ? INK : 'rgba(255,255,255,0.14)',
                    color: '#fff',
                    border: scrolled ? 'none' : '1px solid rgba(255,255,255,0.3)',
                    backdropFilter: scrolled ? 'none' : 'blur(8px)',
                  }}
                >
                  Começar grátis
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ══════════════ HERO ══════════════ */}
      <section className="relative min-h-screen flex flex-col justify-center overflow-hidden">
        {HERO_IMAGES.map((src, i) => (
          <div
            key={src}
            className="absolute inset-0"
            style={{
              animation: `slide-fade ${totalCycle}s ease-in-out ${i * slideDuration}s infinite`,
              opacity: i === 0 ? 1 : 0,
              zIndex: 0,
            }}
          >
            <img
              src={src}
              alt=""
              className="w-full h-full object-cover"
              style={{ animation: `kenburns-${i + 1} ${totalCycle}s ease-in-out ${i * slideDuration}s infinite alternate` }}
            />
          </div>
        ))}

        {/* Overlay quente, mais aberto no topo para a imagem respirar */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(14,12,20,0.52) 0%, rgba(14,12,20,0.60) 45%, rgba(14,12,20,0.88) 100%)',
            zIndex: 1,
          }}
        />

        <div className="relative w-full max-w-6xl mx-auto px-6 pt-24" style={{ zIndex: 2 }}>
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-8" data-reveal>
              <span className="h-px w-10 bg-white/40" />
              <span className="text-xs uppercase tracking-[0.22em] text-white/70">
                Desenvolvida para o seu negócio
              </span>
            </div>

            <h1
              className="font-display text-white leading-[1.02] tracking-tight mb-8"
              style={{ fontSize: 'clamp(2.75rem, 7vw, 5.5rem)' }}
              data-reveal
            >
              Seu negócio,
              <br />
              <em className="font-normal italic text-white/85">sem complicações</em>
            </h1>

            <p
              className="text-lg sm:text-xl text-white/75 max-w-xl mb-12 leading-relaxed font-light"
              data-reveal
              style={{ transitionDelay: '120ms' }}
            >
              Agendamento online, lembretes automáticos e gestão completa para salões,
              barbearias, estética, pilates, aulas coletivas e muito mais.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-16" data-reveal style={{ transitionDelay: '200ms' }}>
              {session ? (
                <Link
                  to="/selecionar"
                  className="link-arrow inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full font-medium text-[15px] text-white transition-all duration-300 hover:gap-4"
                  style={{ background: ACCENT }}
                >
                  Acessar minha conta <ArrowRight size={17} />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="link-arrow inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full font-medium text-[15px] text-white transition-all duration-300 hover:gap-4"
                    style={{ background: ACCENT }}
                  >
                    Começar grátis agora <ArrowRight size={17} />
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center px-8 py-4 rounded-full font-medium text-[15px] text-white transition-all duration-300 hover:bg-white/10"
                    style={{ border: '1px solid rgba(255,255,255,0.28)' }}
                  >
                    Já tenho conta
                  </Link>
                </>
              )}
            </div>

            <div className="flex items-center gap-4" data-reveal style={{ transitionDelay: '280ms' }}>
              <div className="flex -space-x-2.5">
                {['MC', 'RM', 'JF', 'AS', 'PL'].map((initials, i) => (
                  <div
                    key={initials}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-medium text-white"
                    style={{
                      background: ['#7c6f64', '#4a4540', '#5c5470', '#3f4a3c', '#6b5b4a'][i],
                      border: '1.5px solid rgba(255,255,255,0.25)',
                      zIndex: 5 - i,
                    }}
                  >
                    {initials}
                  </div>
                ))}
              </div>
              <p className="text-white/65 text-sm font-light">
                Junte-se a quem já acredita e{' '}
                <span className="text-white font-normal">cresce com a gente</span>
              </p>
            </div>
          </div>
        </div>

        {/* Indicadores de slide */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2" style={{ zIndex: 2 }}>
          {HERO_IMAGES.map((src, i) => (
            <div key={src} className="h-px w-10 bg-white/25 overflow-hidden">
              <div
                className="h-full bg-white origin-left"
                style={{ animation: `bar-fill ${totalCycle}s linear ${i * slideDuration}s infinite` }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════ MARQUEE DE SEGMENTOS ══════════════ */}
      <div className="overflow-hidden py-6 border-y" style={{ background: INK, borderColor: 'rgba(255,255,255,0.08)' }}>
        <div
          className="marquee-track flex gap-12 w-max"
          style={{ animation: 'marquee-scroll 42s linear infinite' }}
        >
          {[...categories, ...categories].map((c, i) => (
            <span
              key={`${c.label}-${i}`}
              className="font-display text-lg whitespace-nowrap flex items-center gap-12"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              {c.label}
              <span className="w-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.25)' }} />
            </span>
          ))}
        </div>
      </div>

      {/* ══════════════ STATS ══════════════ */}
      <section className="py-20 px-6" style={{ background: PAPER }}>
        <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4">
          {stats.map(({ value, label }, i) => (
            <div
              key={label}
              className="px-6 py-6 lg:py-2"
              style={{ borderLeft: i === 0 ? 'none' : `1px solid ${LINE}` }}
              data-reveal
            >
              <p className="font-display text-3xl sm:text-4xl leading-tight tracking-tight" style={{ color: INK }}>
                {value}
              </p>
              <p className="text-sm mt-2 font-light" style={{ color: MUTED }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════ RECURSOS ══════════════ */}
      <section className="py-24 px-6" style={{ background: PAPER_2 }}>
        <div className="max-w-6xl mx-auto">
          <SectionIntro
            eyebrow="Recursos"
            title="Tudo que você precisa"
            italic="em um só lugar"
            lead="Ferramentas profissionais pensadas para quem trabalha com serviços e precisa de tempo livre."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description }, i) => (
              <div
                key={title}
                // Filete à esquerda some no primeiro item de cada linha — e o
                // "primeiro" muda entre 2 e 3 colunas, por isso as duas regras.
                className={cn(
                  'group px-7 py-9 transition-colors duration-500 hover:bg-white border-t border-[#e5e1d9]',
                  i % 2 !== 0 && 'sm:border-l sm:border-[#e5e1d9]',
                  i % 3 === 0 ? 'lg:border-l-0' : 'lg:border-l lg:border-[#e5e1d9]',
                )}
                data-reveal
              >
                <div className="flex items-start justify-between mb-7">
                  <Icon size={20} strokeWidth={1.5} style={{ color: ACCENT }} />
                  <span className="font-display text-sm tabular-nums" style={{ color: '#c3bdb2' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <h3 className="font-display text-xl mb-3 tracking-tight" style={{ color: INK }}>{title}</h3>
                <p className="text-sm leading-relaxed font-light" style={{ color: INK_SOFT }}>{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ DEPOIMENTOS ══════════════ */}
      <section className="py-24 px-6" style={{ background: PAPER }}>
        <div className="max-w-6xl mx-auto">
          <SectionIntro eyebrow="Depoimentos" title="Quem usa," italic="recomenda" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {testimonials.map(({ name, role, text, avatar }, i) => (
              <figure
                key={name}
                className="flex flex-col"
                style={{ borderTop: `1px solid ${LINE}`, paddingTop: '2rem' }}
                data-reveal
              >
                <span className="font-display text-5xl leading-none mb-5" style={{ color: LINE }}>&ldquo;</span>
                <blockquote
                  className="font-display text-lg leading-relaxed flex-1 tracking-tight"
                  style={{ color: INK }}
                >
                  {text}
                </blockquote>
                <figcaption className="flex items-center gap-3 mt-7">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-medium text-white shrink-0"
                    style={{ background: ['#7c6f64', '#4a4540', '#5c5470'][i] }}
                  >
                    {avatar}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: INK }}>{name}</p>
                    <p className="text-xs font-light" style={{ color: MUTED }}>{role}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ SEGMENTOS ══════════════ */}
      <section className="py-24 px-6" style={{ background: PAPER_2 }}>
        <div className="max-w-6xl mx-auto">
          <SectionIntro
            eyebrow="Segmentos"
            title="Para quem é?"
            lead="Do salão ao estúdio de pilates, o Meridio se adapta ao seu negócio."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
            {categories.map(({ label, examples, img }, i) => (
              <article key={label} className="cat-card group" data-reveal style={{ transitionDelay: `${(i % 3) * 90}ms` }}>
                <div className="overflow-hidden mb-5" style={{ aspectRatio: '4/3' }} data-reveal-img>
                  <img src={img} alt={label} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="flex items-baseline justify-between gap-3 mb-3">
                  <h3 className="font-display text-xl tracking-tight" style={{ color: INK }}>{label}</h3>
                  <span className="font-display text-xs tabular-nums shrink-0" style={{ color: MUTED }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {examples.map((ex) => (
                    <li key={ex} className="text-sm font-light flex gap-2.5" style={{ color: INK_SOFT }}>
                      <span className="mt-2 w-1 h-1 rounded-full shrink-0" style={{ background: ACCENT }} />
                      {ex}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ CTA FINAL ══════════════ */}
      <section className="relative py-32 px-6 overflow-hidden" style={{ background: INK }}>
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 18% 40%, #4f46e5 0%, transparent 45%), radial-gradient(circle at 82% 70%, #6d28d9 0%, transparent 42%)',
            animation: 'drift 9s ease-in-out infinite',
          }}
        />
        <div className="relative max-w-3xl mx-auto text-center" style={{ zIndex: 1 }}>
          <div className="flex items-center justify-center gap-3 mb-7" data-reveal>
            <span className="h-px w-8 bg-white/30" />
            <span className="text-xs uppercase tracking-[0.22em] text-white/60">Comece hoje</span>
            <span className="h-px w-8 bg-white/30" />
          </div>

          <h2
            className="font-display text-white leading-[1.06] tracking-tight mb-6"
            style={{ fontSize: 'clamp(2.25rem, 5.5vw, 4rem)' }}
            data-reveal
          >
            Seu negócio merece uma
            <br />
            <em className="font-normal italic text-white/80">gestão profissional</em>
          </h2>

          <p className="text-white/55 mb-12 text-lg font-light" data-reveal style={{ transitionDelay: '100ms' }}>
            Sem cartão de crédito. Configure em menos de 5 minutos.
          </p>

          <div data-reveal style={{ transitionDelay: '180ms' }}>
            <Link
              to="/register"
              className="link-arrow inline-flex items-center gap-3 px-10 py-4 rounded-full font-medium text-base transition-all duration-300 hover:gap-5"
              style={{ background: '#fff', color: INK }}
            >
              Criar minha conta grátis <ArrowUpRight size={18} />
            </Link>
            <p className="text-white/35 text-sm mt-6 font-light">
              Sem complicações. Do cadastro ao primeiro agendamento em minutos.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer className="py-10 px-6" style={{ background: PAPER, borderTop: `1px solid ${LINE}` }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-display text-lg tracking-tight" style={{ color: INK }}>Meridio</span>
          <p className="text-sm font-light" style={{ color: MUTED }}>
            © {new Date().getFullYear()} Meridio. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
