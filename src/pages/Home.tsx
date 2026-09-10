import { useEffect, useRef, useState } from 'react'
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
  Star,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { cn } from '../lib/utils'

/* ──────────────────────────────────────────────────────────────
   Paleta: seis tons profundos de croma parecido. Lidos como uma
   família, não como arco-íris — é isso que separa cor de ruído.
   ────────────────────────────────────────────────────────────── */
const HUES = {
  indigo: '#4f46e5',
  plum: '#7e3f8f',
  rose: '#b5476b',
  clay: '#c26a3c',
  brass: '#a8843c',
  sage: '#5a7d64',
}

const INK = '#14131c'
const INK_SOFT = '#57535f'
const MUTED = '#8d8893'
const PAPER = '#fbfaf8'
const PAPER_2 = '#f3f1ec'
const LINE = '#e5e1d9'

const HERO_IMAGES = [
  { src: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1600&auto=format&fit=crop&q=80', label: 'Salão de Beleza', tint: HUES.rose },
  { src: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1600&auto=format&fit=crop&q=80', label: 'Barbearia', tint: HUES.brass },
  { src: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1600&auto=format&fit=crop&q=80', label: 'Estúdio de Pilates', tint: HUES.sage },
  { src: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1600&auto=format&fit=crop&q=80', label: 'Academia', tint: HUES.indigo },
  { src: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1600&auto=format&fit=crop&q=80', label: 'Centro de Estética', tint: HUES.plum },
]

const features = [
  { icon: Calendar, title: 'Agendamento online', description: 'Clientes agendam pelo link do seu negócio, 24 horas por dia.', color: HUES.indigo },
  { icon: Bell, title: 'Lembretes automáticos', description: 'Envio automático de lembretes por WhatsApp e e-mail antes do horário.', color: HUES.plum },
  { icon: Briefcase, title: 'Catálogo de serviços', description: 'Cadastre serviços com duração e preço para facilitar a escolha.', color: HUES.rose },
  { icon: Users, title: 'Gestão de clientes', description: 'Histórico completo, notas e exportação em CSV a qualquer momento.', color: HUES.sage },
  { icon: CreditCard, title: 'Pagamento integrado', description: 'Receba online no ato do agendamento com checkout integrado.', color: HUES.clay },
  { icon: LayoutDashboard, title: 'Painel completo', description: 'Visualize a agenda, equipe e desempenho em um só lugar.', color: HUES.brass },
]

const stats = [
  { value: 'Quem acredita,', label: 'cresce com a gente', color: HUES.plum },
  { value: '98%', num: 98, suffix: '%', label: 'Satisfação dos clientes', color: HUES.rose },
  { value: '< 5 min', prefix: '< ', num: 5, suffix: ' min', label: 'Para configurar', color: HUES.sage },
  { value: 'Grátis', label: 'Para começar', color: HUES.clay },
]

const categories = [
  { label: 'Salão de Beleza', examples: ['Corte, escova e coloração', 'Manicure e pedicure'], img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=75', color: HUES.rose },
  { label: 'Barbearia', examples: ['Corte masculino e barba', 'Tratamento capilar'], img: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&auto=format&fit=crop&q=75', color: HUES.brass },
  { label: 'Serviços de Beleza', examples: ['Unhas e nail design', 'Cílios, sobrancelhas e micropigmentação'], img: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&auto=format&fit=crop&q=75', color: HUES.plum },
  { label: 'Centro de Estética', examples: ['Limpeza de pele e depilação', 'Massagem e drenagem'], img: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&auto=format&fit=crop&q=75', color: HUES.rose },
  { label: 'Estúdio de Pilates', examples: ['Pilates individual e em grupo', 'Avaliação postural'], img: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&auto=format&fit=crop&q=75', color: HUES.sage },
  { label: 'Aulas Coletivas', examples: ['Balé, dança e zumba', 'Jiu-jitsu, karatê e artes marciais'], img: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=600&auto=format&fit=crop&q=75', color: HUES.indigo },
  { label: 'Avaliação Física', examples: ['Bioimpedância e antropometria', 'Prescrição de treino'], img: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&auto=format&fit=crop&q=75', color: HUES.clay },
  { label: 'Avaliação Nutricional', examples: ['Consulta e plano alimentar', 'Acompanhamento nutricional'], img: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&auto=format&fit=crop&q=75', color: HUES.sage },
  { label: 'Academia', examples: ['Personal trainer e musculação', 'Aulas funcionais e crossfit'], img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=75', color: HUES.indigo },
]

const testimonials = [
  { name: 'Mariana Costa', role: 'Salão da Mari', text: 'Reduzi faltas em 70% com os lembretes automáticos. Minha agenda nunca esteve tão organizada.', avatar: 'MC', color: HUES.rose },
  { name: 'Rafael Mendes', role: 'Barbearia RM', text: 'Meus clientes adoraram poder agendar pelo celular a qualquer hora. Aumentei os agendamentos em 40%.', avatar: 'RM', color: HUES.brass },
  { name: 'Juliana Freitas', role: 'Studio Pilates Flex', text: 'A gestão de turmas e avaliações ficou simples. Economizo horas por semana que antes gastava no WhatsApp.', avatar: 'JF', color: HUES.plum },
]

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Revela elementos [data-reveal] conforme entram na viewport. */
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal], [data-reveal-img]')
    if (prefersReduced()) {
      els.forEach((el) => el.classList.add('is-visible'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible')
            io.unobserve(e.target)
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}

/** Deslocamento sutil no scroll para elementos [data-parallax]. */
function useParallax() {
  useEffect(() => {
    if (prefersReduced()) return
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'))
    if (els.length === 0) return

    let frame = 0
    const apply = () => {
      frame = 0
      const vh = window.innerHeight
      for (const el of els) {
        const rect = el.getBoundingClientRect()
        if (rect.bottom < -200 || rect.top > vh + 200) continue
        const speed = Number(el.dataset.parallax) || 0.08
        // -1 no topo da viewport, +1 embaixo
        const progress = (rect.top + rect.height / 2 - vh / 2) / vh
        el.style.transform = `translate3d(0, ${(progress * speed * 100).toFixed(2)}px, 0)`
      }
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(apply)
    }
    apply()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])
}

/** Conta de 0 até o valor quando entra na viewport. */
function CountUp({ to, prefix = '', suffix = '' }: { to: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [n, setN] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReduced()) { setN(to); return }

    const io = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return
      io.disconnect()
      const start = performance.now()
      const dur = 1400
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / dur)
        // easeOutExpo: rápido no começo, assenta no fim
        const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
        setN(Math.round(eased * to))
        if (t < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, { threshold: 0.5 })

    io.observe(el)
    return () => io.disconnect()
  }, [to])

  return <span ref={ref}>{prefix}{n}{suffix}</span>
}

function SectionIntro({ eyebrow, title, italic, lead, color = HUES.indigo }: {
  eyebrow: string
  title: string
  italic?: string
  lead?: string
  color?: string
}) {
  return (
    <div className="max-w-2xl mb-14" data-reveal>
      <div className="flex items-center gap-3 mb-5">
        <span className="h-px w-8" style={{ background: color }} />
        <span className="text-xs uppercase tracking-[0.2em] font-medium" style={{ color }}>{eyebrow}</span>
      </div>
      <h2 className="font-display text-4xl sm:text-5xl leading-[1.08] tracking-tight" style={{ color: INK }}>
        {title}
        {italic && <><br /><em className="font-normal italic" style={{ color }}>{italic}</em></>}
      </h2>
      {lead && <p className="mt-5 text-base leading-relaxed" style={{ color: INK_SOFT }}>{lead}</p>}
    </div>
  )
}

export default function Home() {
  const { session } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [activeQuote, setActiveQuote] = useState(0)

  useScrollReveal()
  useParallax()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Depoimentos giram sozinhos
  useEffect(() => {
    if (prefersReduced()) return
    const id = setInterval(() => setActiveQuote((q) => (q + 1) % testimonials.length), 6000)
    return () => clearInterval(id)
  }, [])

  const n = HERO_IMAGES.length
  const slideDuration = 6
  const fadeDuration = 1.5
  const totalCycle = n * slideDuration
  const slidePct = (slideDuration / totalCycle) * 100

  return (
    <div className="min-h-screen" style={{ background: PAPER }}>

      <style>{`
        @keyframes kenburns-1 { 0% { transform: scale(1)    translate(0%, 0%);   } 100% { transform: scale(1.14) translate(-2%, -1%); } }
        @keyframes kenburns-2 { 0% { transform: scale(1.10) translate(1%, 1%);   } 100% { transform: scale(1)    translate(-1%, 2%);  } }
        @keyframes kenburns-3 { 0% { transform: scale(1)    translate(-1%, 1%);  } 100% { transform: scale(1.12) translate(2%, -2%);  } }
        @keyframes kenburns-4 { 0% { transform: scale(1.06) translate(0%, -1%);  } 100% { transform: scale(1)    translate(-2%, 1%);  } }
        @keyframes kenburns-5 { 0% { transform: scale(1)    translate(1%, 0%);   } 100% { transform: scale(1.14) translate(-1%, -2%); } }
        @keyframes slide-fade {
          0%   { opacity: 0; }
          ${(fadeDuration / totalCycle * 100).toFixed(1)}% { opacity: 1; }
          ${((slideDuration - fadeDuration) / totalCycle * 100).toFixed(1)}% { opacity: 1; }
          ${slidePct.toFixed(1)}% { opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes bar-fill {
          0% { transform: scaleX(0); }
          ${slidePct.toFixed(2)}% { transform: scaleX(1); }
          ${(slidePct + 0.01).toFixed(2)}% { transform: scaleX(0); }
          100% { transform: scaleX(0); }
        }
        @keyframes drift { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(2%,-2%) scale(1.06); } }
        @keyframes hue-pulse { 0%,100% { opacity:.28 } 50% { opacity:.5 } }
        .link-arrow svg { transition: transform .35s cubic-bezier(.16,1,.3,1); }
        .link-arrow:hover svg { transform: translate(3px,-3px); }
        .rail-card img { transition: transform 1.4s cubic-bezier(.16,1,.3,1); }
        .rail-card:hover img { transform: scale(1.08); }
        .feat:hover .feat-chip { transform: translateY(-3px) rotate(-4deg); }
        .feat-chip { transition: transform .5s cubic-bezier(.16,1,.3,1); }
        @media (prefers-reduced-motion: reduce) {
          [style*="kenburns"], [style*="slide-fade"], [style*="bar-fill"], [style*="drift"], [style*="hue-pulse"] { animation: none !important; }
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
          <span className="font-display text-xl tracking-tight transition-colors duration-500" style={{ color: scrolled ? INK : '#fff' }}>
            Meridio
          </span>
          <div className="flex items-center gap-6">
            {session ? (
              <Link to="/selecionar" className="text-sm font-medium transition-colors duration-500" style={{ color: scrolled ? INK : 'rgba(255,255,255,0.9)' }}>
                Minha conta
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium transition-colors duration-500 hidden sm:block" style={{ color: scrolled ? INK_SOFT : 'rgba(255,255,255,0.85)' }}>
                  Entrar
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-medium px-5 py-2 rounded-full transition-all duration-300 hover:opacity-90"
                  style={{
                    background: scrolled ? HUES.indigo : 'rgba(255,255,255,0.14)',
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
        {HERO_IMAGES.map(({ src, tint }, i) => (
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
            {/* Banho de cor por slide — dá temperatura sem apagar a foto */}
            <div className="absolute inset-0 mix-blend-soft-light" style={{ background: tint, opacity: 0.55 }} />
          </div>
        ))}

        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(14,12,20,0.48) 0%, rgba(14,12,20,0.56) 45%, rgba(14,12,20,0.88) 100%)',
            zIndex: 1,
          }}
        />

        <div className="relative w-full max-w-6xl mx-auto px-6 pt-24" style={{ zIndex: 2 }}>
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-8" data-reveal>
              <span className="h-px w-10" style={{ background: 'rgba(255,255,255,0.45)' }} />
              <span className="text-xs uppercase tracking-[0.22em] text-white/75">Desenvolvida para o seu negócio</span>
            </div>

            <h1 className="font-display text-white leading-[1.02] tracking-tight mb-8" style={{ fontSize: 'clamp(2.75rem, 7vw, 5.5rem)' }} data-reveal>
              Seu negócio,
              <br />
              <em
                className="font-normal italic"
                style={{
                  background: 'linear-gradient(100deg, #f2c4d4 0%, #e8c9a0 45%, #c9b8f0 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                sem complicações
              </em>
            </h1>

            <p className="text-lg sm:text-xl text-white/80 max-w-xl mb-12 leading-relaxed font-light" data-reveal style={{ transitionDelay: '120ms' }}>
              Agendamento online, lembretes automáticos e gestão completa para salões,
              barbearias, estética, pilates, aulas coletivas e muito mais.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-16" data-reveal style={{ transitionDelay: '200ms' }}>
              {session ? (
                <Link
                  to="/selecionar"
                  className="link-arrow inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full font-medium text-[15px] text-white transition-all duration-300 hover:gap-4"
                  style={{ background: HUES.indigo, boxShadow: '0 10px 40px rgba(79,70,229,0.45)' }}
                >
                  Acessar minha conta <ArrowRight size={17} />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="link-arrow inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full font-medium text-[15px] text-white transition-all duration-300 hover:gap-4"
                    style={{
                      background: `linear-gradient(120deg, ${HUES.indigo}, ${HUES.plum})`,
                      boxShadow: '0 10px 40px rgba(79,70,229,0.45)',
                    }}
                  >
                    Começar grátis agora <ArrowRight size={17} />
                  </Link>
                  <Link
                    to="/demo"
                    className="link-arrow inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full font-medium text-[15px] text-white transition-all duration-300 hover:bg-white/10 hover:gap-4"
                    style={{ border: '1px solid rgba(255,255,255,0.3)' }}
                  >
                    Ver demonstração <ArrowRight size={17} />
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
                      background: [HUES.rose, HUES.brass, HUES.plum, HUES.sage, HUES.clay][i],
                      border: '1.5px solid rgba(255,255,255,0.3)',
                      zIndex: 5 - i,
                    }}
                  >
                    {initials}
                  </div>
                ))}
              </div>
              <p className="text-white/70 text-sm font-light">
                Junte-se a quem já acredita e <span className="text-white font-normal">cresce com a gente</span>
              </p>
            </div>
          </div>
        </div>

        {/* Rótulo do slide + indicadores */}
        <div className="absolute bottom-10 inset-x-0 px-6" style={{ zIndex: 2 }}>
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-6">
            <div className="relative h-5 flex-1 hidden sm:block">
              {HERO_IMAGES.map(({ src, label }, i) => (
                <span
                  key={src}
                  className="absolute left-0 top-0 text-xs uppercase tracking-[0.2em] text-white/70 whitespace-nowrap"
                  style={{
                    animation: `slide-fade ${totalCycle}s ease-in-out ${i * slideDuration}s infinite`,
                    opacity: i === 0 ? 1 : 0,
                  }}
                >
                  {label}
                </span>
              ))}
            </div>
            <div className="flex gap-2 mx-auto sm:mx-0">
              {HERO_IMAGES.map(({ src }, i) => (
                <div key={src} className="h-px w-10 bg-white/25 overflow-hidden">
                  <div className="h-full bg-white origin-left" style={{ animation: `bar-fill ${totalCycle}s linear ${i * slideDuration}s infinite` }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ MARQUEE DE TEXTO ══════════════ */}
      <div className="overflow-hidden py-5" style={{ background: INK }}>
        <div className="marquee-track flex gap-10 w-max" style={{ animation: 'marquee-scroll 42s linear infinite' }}>
          {[...categories, ...categories].map((c, i) => (
            <span key={`${c.label}-${i}`} className="font-display text-lg whitespace-nowrap flex items-center gap-10" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {c.label}
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.color }} />
            </span>
          ))}
        </div>
      </div>

      {/* ══════════════ NÚMEROS ══════════════ */}
      <section className="py-20 px-6" style={{ background: PAPER }}>
        <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="px-6 py-6 lg:py-2"
              style={{ borderLeft: i === 0 ? 'none' : `1px solid ${LINE}` }}
              data-reveal
            >
              <p className="font-display text-3xl sm:text-4xl leading-tight tracking-tight" style={{ color: s.color }}>
                {s.num !== undefined
                  ? <CountUp to={s.num} prefix={s.prefix} suffix={s.suffix} />
                  : s.value}
              </p>
              <p className="text-sm mt-2 font-light" style={{ color: MUTED }}>{s.label}</p>
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
            {features.map(({ icon: Icon, title, description, color }, i) => (
              <div
                key={title}
                // Filete à esquerda some no primeiro item da linha — e o
                // "primeiro" muda entre 2 e 3 colunas, daí as duas regras.
                className={cn(
                  'feat group relative px-7 py-9 transition-colors duration-500 hover:bg-white border-t border-[#e5e1d9]',
                  i % 2 !== 0 && 'sm:border-l sm:border-[#e5e1d9]',
                  i % 3 === 0 ? 'lg:border-l-0' : 'lg:border-l lg:border-[#e5e1d9]',
                )}
                data-reveal
                style={{ transitionDelay: `${(i % 3) * 80}ms` }}
              >
                {/* Filete de cor que cresce no hover */}
                <span
                  className="absolute top-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-700"
                  style={{ background: color, transitionTimingFunction: 'cubic-bezier(.16,1,.3,1)' }}
                />
                <div className="flex items-start justify-between mb-7">
                  <span
                    className="feat-chip w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ background: `${color}1a` }}
                  >
                    <Icon size={19} strokeWidth={1.6} style={{ color }} />
                  </span>
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

      {/* ══════════════ SEGMENTOS — CARROSSEL ROLANTE ══════════════ */}
      <section className="py-24" style={{ background: PAPER }}>
        <div className="max-w-6xl mx-auto px-6">
          <SectionIntro
            eyebrow="Segmentos"
            title="Para quem é?"
            lead="Do salão ao estúdio de pilates, o Meridio se adapta ao seu negócio. Passe o mouse para pausar."
            color={HUES.clay}
          />
        </div>

        {/* Dois trilhos em direções opostas */}
        {[0, 1].map((row) => {
          const items = row === 0 ? categories : [...categories].reverse()
          return (
            <div key={row} className="rail overflow-hidden mb-6 last:mb-0">
              <div
                className="rail-track flex gap-6 w-max px-3"
                style={{
                  animation: `${row === 0 ? 'marquee-scroll' : 'marquee-scroll-rev'} ${row === 0 ? 64 : 78}s linear infinite`,
                }}
              >
                {[...items, ...items].map((c, i) => (
                  <article
                    key={`${c.label}-${row}-${i}`}
                    className="rail-card group shrink-0 w-[300px] sm:w-[340px]"
                  >
                    <div className="overflow-hidden rounded-2xl mb-4 relative" style={{ aspectRatio: '4/3' }}>
                      <img src={c.img} alt={c.label} className="w-full h-full object-cover" loading="lazy" />
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{ background: `linear-gradient(to top, ${c.color}cc, transparent 60%)` }}
                      />
                      <span
                        className="absolute top-3 left-3 text-[10px] uppercase tracking-[0.16em] px-2.5 py-1 rounded-full font-medium text-white"
                        style={{ background: `${c.color}e6`, backdropFilter: 'blur(4px)' }}
                      >
                        {c.label}
                      </span>
                    </div>
                    <h3 className="font-display text-lg tracking-tight mb-2" style={{ color: INK }}>{c.label}</h3>
                    <ul className="space-y-1.5">
                      {c.examples.map((ex) => (
                        <li key={ex} className="text-sm font-light flex gap-2.5" style={{ color: INK_SOFT }}>
                          <span className="mt-2 w-1 h-1 rounded-full shrink-0" style={{ background: c.color }} />
                          {ex}
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </div>
          )
        })}
      </section>

      {/* ══════════════ DEPOIMENTOS — ROTATIVO ══════════════ */}
      <section className="py-24 px-6 relative overflow-hidden" style={{ background: PAPER_2 }}>
        <div
          className="absolute -right-32 top-1/4 w-[420px] h-[420px] rounded-full blur-3xl pointer-events-none"
          style={{ background: testimonials[activeQuote].color, opacity: 0.13, transition: 'background 1s ease' }}
          data-parallax="0.12"
        />
        <div className="max-w-6xl mx-auto relative">
          <SectionIntro eyebrow="Depoimentos" title="Quem usa," italic="recomenda" color={HUES.rose} />

          <div className="max-w-3xl" data-reveal>
            <div className="flex gap-1 mb-7">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={15} fill={HUES.brass} style={{ color: HUES.brass }} />
              ))}
            </div>

            {/* Altura reservada evita o salto de layout na troca */}
            <div className="relative min-h-[190px] sm:min-h-[160px]">
              {testimonials.map((t, i) => (
                <div
                  key={t.name}
                  className="absolute inset-0 transition-all duration-700"
                  style={{
                    opacity: i === activeQuote ? 1 : 0,
                    transform: i === activeQuote ? 'none' : 'translateY(14px)',
                    pointerEvents: i === activeQuote ? 'auto' : 'none',
                  }}
                >
                  <blockquote className="font-display text-2xl sm:text-3xl leading-[1.35] tracking-tight mb-7" style={{ color: INK }}>
                    &ldquo;{t.text}&rdquo;
                  </blockquote>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-medium text-white shrink-0"
                      style={{ background: t.color }}
                    >
                      {t.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: INK }}>{t.name}</p>
                      <p className="text-xs font-light" style={{ color: MUTED }}>{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2.5 mt-10">
              {testimonials.map((t, i) => (
                <button
                  key={t.name}
                  onClick={() => setActiveQuote(i)}
                  aria-label={`Depoimento de ${t.name}`}
                  className="h-1 rounded-full transition-all duration-500"
                  style={{
                    width: i === activeQuote ? 40 : 16,
                    background: i === activeQuote ? t.color : LINE,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ CTA FINAL ══════════════ */}
      <section className="relative py-32 px-6 overflow-hidden" style={{ background: INK }}>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 15% 35%, ${HUES.indigo} 0%, transparent 45%), radial-gradient(circle at 85% 65%, ${HUES.plum} 0%, transparent 42%), radial-gradient(circle at 50% 100%, ${HUES.rose} 0%, transparent 40%)`,
            animation: 'drift 11s ease-in-out infinite, hue-pulse 7s ease-in-out infinite',
          }}
        />
        <div className="relative max-w-3xl mx-auto text-center" style={{ zIndex: 1 }}>
          <div className="flex items-center justify-center gap-3 mb-7" data-reveal>
            <span className="h-px w-8 bg-white/30" />
            <span className="text-xs uppercase tracking-[0.22em] text-white/65">Comece hoje</span>
            <span className="h-px w-8 bg-white/30" />
          </div>

          <h2 className="font-display text-white leading-[1.06] tracking-tight mb-6" style={{ fontSize: 'clamp(2.25rem, 5.5vw, 4rem)' }} data-reveal>
            Seu negócio merece uma
            <br />
            <em
              className="font-normal italic"
              style={{
                background: 'linear-gradient(100deg, #f2c4d4, #e8c9a0 50%, #c9b8f0)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              gestão profissional
            </em>
          </h2>

          <p className="text-white/60 mb-12 text-lg font-light" data-reveal style={{ transitionDelay: '100ms' }}>
            Sem cartão de crédito. Configure em menos de 5 minutos.
          </p>

          <div data-reveal style={{ transitionDelay: '180ms' }}>
            <Link
              to="/register"
              className="link-arrow inline-flex items-center gap-3 px-10 py-4 rounded-full font-medium text-base transition-all duration-300 hover:gap-5"
              style={{ background: '#fff', color: INK, boxShadow: '0 12px 44px rgba(0,0,0,0.35)' }}
            >
              Criar minha conta grátis <ArrowUpRight size={18} />
            </Link>
            <p className="text-white/40 text-sm mt-6 font-light">
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
