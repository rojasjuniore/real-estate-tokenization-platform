'use client';

import { BrandLogo } from '@/components/ui/BrandLogo';
import { brandConfig } from '@/config/brand.config';

const teamMembers = [
  {
    name: 'Santiago Fernández',
    role: 'CEO / Fundador(a)',
    description: 'Visión, estrategia y alianzas.',
    imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&q=80',
    bgColor: 'from-blue-400 to-blue-600',
  },
  {
    name: 'Valentina Pereyra',
    role: 'Head de Real Estate (Director/a Inmobiliario)',
    description: 'Selección de proyectos, due diligence inmobiliario y relación con desarrolladores.',
    imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&q=80',
    bgColor: 'from-teal-400 to-teal-600',
  },
  {
    name: 'Tomás Agüero',
    role: 'Compliance & Legal (Cumplimiento / Regulatorio)',
    description: 'KYC/AML, estructuras legales, documentación y gobierno del proyecto.',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80',
    bgColor: 'from-green-400 to-green-600',
  },
  {
    name: 'Camila Rinaldi',
    role: 'CTO / Blockchain Lead (Tecnología)',
    description: 'Smart contracts, tokenización, seguridad técnica e infraestructura.',
    imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&q=80',
    bgColor: 'from-orange-400 to-orange-600',
  },
];

const investmentSteps = [
  {
    number: '01',
    title: 'Regístrate o Inicia sesión',
    description: `Crea tu cuenta en ${brandConfig.identity.companyName}.`,
  },
  {
    number: '02',
    title: 'Verifica tu identidad (KYC)',
    description: 'Completa la verificación de identidad.',
  },
  {
    number: '03',
    title: 'Explora los proyectos',
    description: 'Revisa los proyectos disponibles.',
  },
  {
    number: '04',
    title: 'Selecciona tu inversión',
    description: 'Elige el número de fracciones que deseas.',
  },
  {
    number: '05',
    title: 'Realiza el pago',
    description: 'Paga con cripto o transferencia.',
  },
];

export function AboutSection() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="px-8 py-6">
        <BrandLogo width={180} />
        <p className="text-sm text-[var(--foreground-secondary)] mt-1">{brandConfig.identity.tagline} | by {brandConfig.identity.appName}</p>
      </header>

      {/* About Section */}
      <section className="px-8 py-12">
        <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6">Quiénes Somos</h2>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div>
            <p className="text-[var(--foreground-secondary)] leading-relaxed mb-4">
              <strong className="text-[var(--foreground)]">{brandConfig.identity.companyName} es la tokenizadora de inmuebles y bienes raíces dentro de {brandConfig.identity.appName}</strong>, el grupo argentino pionero en la tokenización de activos reales. A través de {brandConfig.identity.companyName}, ofrecemos acceso a inversiones fraccionadas en el mercado inmobiliario, permitiendo que tanto inversores particulares como institucionales participen en proyectos de alto potencial, con un respaldo regulado y garantizado por tecnología blockchain.
            </p>
            <p className="text-[var(--foreground-secondary)] leading-relaxed mb-4">
              Transformamos propiedades físicas en activos digitales accesibles, seguros y transparentes para todos, democratizando la inversión inmobiliaria en Latinoamérica.
            </p>
            <p className="text-[var(--foreground-secondary)] leading-relaxed">
              Además de inmuebles, {brandConfig.identity.appName} también ofrece la tokenización de otros activos como oro, vino y aceite de oliva.
            </p>
          </div>

          {/* Image Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl overflow-hidden h-48">
              <img
                src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&q=80"
                alt="Building"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="rounded-2xl overflow-hidden h-48">
              <img
                src="https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=400&q=80"
                alt="Architecture"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="col-span-2 rounded-2xl overflow-hidden h-48">
              <img
                src="https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=600&q=80"
                alt="Gardens"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How to Invest Section */}
      <section className="px-8 py-12 bg-[var(--neutral-50)]">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Guía Paso a Paso para</h2>
            <span className="px-4 py-1 rounded-full border border-[var(--primary-600)] text-[var(--primary-600)] font-medium">
              Invertir →
            </span>
          </div>

          <div className="flex justify-between items-start relative">
            {investmentSteps.map((step, index) => (
              <button
                key={step.number}
                className="flex flex-col items-center text-center max-w-[150px] group cursor-pointer hover:scale-105 transition-transform"
                onClick={() => {
                  // Scroll to relevant section or trigger action based on step
                  if (step.number === '01') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
              >
                <div className="w-14 h-14 rounded-full border-2 border-[var(--neutral-300)] flex items-center justify-center mb-4 group-hover:border-[var(--primary-600)] group-hover:bg-[var(--primary-600)]/5 transition-all">
                  <span className="text-lg font-semibold text-[var(--neutral-600)] group-hover:text-[var(--primary-600)]">{step.number}</span>
                </div>
                <h3 className="font-semibold text-[var(--foreground)] text-sm mb-2 group-hover:text-[var(--primary-600)] transition-colors">{step.title}</h3>
                <p className="text-xs text-[var(--primary-600)] group-hover:underline cursor-pointer">{step.description}</p>

                {/* Connector line */}
                {index < investmentSteps.length - 1 && (
                  <div className="hidden md:block absolute top-7 h-px bg-[var(--neutral-300)]" style={{ left: `calc(${(index + 0.5) * 20}% + 28px)`, width: 'calc(20% - 56px)' }} />
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="px-8 py-12">
        <div className="text-center mb-12">
          <p className="text-[var(--primary-600)] font-medium mb-2">Beneficios Clave</p>
          <h2 className="text-3xl font-bold text-[var(--primary-600)]">
            Inversión inmobiliaria en Tokens
          </h2>
        </div>

        <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {[
            { title: 'Accesibilidad', description: 'Invierte desde $100 USD en propiedades premium' },
            { title: 'Liquidez', description: 'Vende tus tokens cuando quieras en el marketplace' },
            { title: 'Transparencia', description: 'Todas las transacciones en blockchain' },
            { title: 'Dividendos', description: 'Recibe ingresos por alquiler mensualmente' },
          ].map((benefit) => (
            <div key={benefit.title} className="bg-[var(--neutral-100)] rounded-2xl p-6 text-center">
              <h3 className="font-semibold text-[var(--foreground)] mb-2">{benefit.title}</h3>
              <p className="text-sm text-[var(--foreground-secondary)]">{benefit.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team Section */}
      <section className="px-8 py-12 bg-[var(--neutral-50)]">
        <h2 className="text-2xl font-semibold text-[var(--foreground)] text-center mb-12">Nuestro Equipo</h2>

        <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {teamMembers.map((member) => (
            <div key={member.name} className="text-center">
              <div className={`relative w-40 h-40 mx-auto mb-4 rounded-2xl overflow-hidden bg-gradient-to-br ${member.bgColor}`}>
                <img
                  src={member.imageUrl}
                  alt={member.name}
                  className="w-full h-full object-cover mix-blend-overlay"
                />
              </div>
              <h3 className="font-bold text-[var(--foreground)]">{member.name}</h3>
              <p className="text-sm font-medium text-[var(--foreground-secondary)] mb-2">{member.role}</p>
              <p className="text-xs text-[var(--foreground-secondary)]">{member.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Section */}
      <section className="px-8 py-12">
        <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
          <div className="rounded-2xl overflow-hidden h-64">
            <img
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80"
              alt="Building"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">
              Invertir con confianza, paso a paso
            </h2>
            <p className="text-[var(--foreground-secondary)] leading-relaxed">
              En {brandConfig.identity.companyName}, el Real Estate se transforma en una inversión fraccionada, accesible y transparente. Cada proyecto se publica con documentación, seguimiento y métricas claras, bajo marcos de cumplimiento y buenas prácticas. El proceso es simple: elegir un proyecto, definir el monto e invertir desde una sola plataforma, con información y control en cada etapa. Más claridad. Más acceso. Más confianza.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
