'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePanelsStore } from '@/store';
import { IconArrowClose } from '@/components/icons';
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
    role: 'Head de Real Estate',
    description: 'Selección de proyectos y due diligence.',
    imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&q=80',
    bgColor: 'from-teal-400 to-teal-600',
  },
  {
    name: 'Tomás Agüero',
    role: 'Compliance & Legal',
    description: 'KYC/AML y estructuras legales.',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80',
    bgColor: 'from-green-400 to-green-600',
  },
  {
    name: 'Camila Rinaldi',
    role: 'CTO / Blockchain Lead',
    description: 'Smart contracts y tokenización.',
    imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&q=80',
    bgColor: 'from-orange-400 to-orange-600',
  },
];

const investmentSteps = [
  { number: '01', title: 'Regístrate', description: `Crea tu cuenta en ${brandConfig.identity.companyName}.` },
  { number: '02', title: 'Verifica (KYC)', description: 'Completa la verificación.' },
  { number: '03', title: 'Explora', description: 'Revisa los proyectos.' },
  { number: '04', title: 'Selecciona', description: 'Elige tus fracciones.' },
  { number: '05', title: 'Paga', description: 'Cripto o transferencia.' },
];

export function AboutPanel() {
  const { activePanel, closePanel } = usePanelsStore();
  const isOpen = activePanel === 'about';

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closePanel}
            className="fixed inset-0 bg-black/40 z-50"
            aria-hidden="true"
          />

          {/* Panel - responsive width */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full md:w-[85vw] lg:w-[80vw] z-50 overflow-hidden flex flex-col"
          >
            {/* White background with curved left edge - no curve on mobile */}
            <div className="absolute inset-0 bg-white md:rounded-l-[40px] lg:rounded-l-[80px]" />

            {/* Close Button */}
            <button
              onClick={closePanel}
              className="absolute top-4 md:top-6 left-4 md:left-6 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center transition-all duration-200 z-20 shadow-sm"
              aria-label="Cerrar"
            >
              <IconArrowClose size={16} className="md:w-5 md:h-5" color={brandConfig.colors.primary[600]} />
            </button>

            {/* Header */}
            <div className="relative z-10 flex items-center justify-center md:justify-end p-3 md:p-4 border-b border-gray-200/50">
              <BrandLogo width={100} className="md:w-[140px]" />
              <span className="mx-2 text-gray-300 hidden md:inline">|</span>
              <p className="text-xs md:text-sm text-gray-500 hidden md:block">{brandConfig.identity.tagline} | by {brandConfig.identity.appName}</p>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex-1 overflow-y-auto bg-white/80">
              <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8">
                {/* About Section */}
                <section className="mb-8 md:mb-12">
                  <h2 className="text-xl md:text-2xl font-bold text-primary-600 mb-4 md:mb-6">Quiénes Somos</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
                    <div>
                      <p className="text-sm md:text-base text-gray-600 leading-relaxed mb-3 md:mb-4">
                        <strong className="text-primary-600">{brandConfig.identity.companyName} es la tokenizadora de inmuebles y bienes raíces dentro de {brandConfig.identity.appName}</strong>, el grupo pionero en la tokenización de activos reales.
                      </p>
                      <p className="text-sm md:text-base text-gray-600 leading-relaxed mb-3 md:mb-4">
                        Transformamos propiedades físicas en activos digitales accesibles, seguros y transparentes para todos.
                      </p>
                      <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                        Además de inmuebles, {brandConfig.identity.appName} también ofrece la tokenización de otros activos como oro, vino y aceite de oliva.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 md:gap-3">
                      <div className="rounded-xl md:rounded-[15px] overflow-hidden h-24 md:h-36">
                        <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&q=80" alt="Building" className="w-full h-full object-cover" />
                      </div>
                      <div className="rounded-xl md:rounded-[15px] overflow-hidden h-24 md:h-36">
                        <img src="https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=400&q=80" alt="Architecture" className="w-full h-full object-cover" />
                      </div>
                      <div className="col-span-2 rounded-xl md:rounded-[15px] overflow-hidden h-24 md:h-36">
                        <img src="https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=600&q=80" alt="Gardens" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Investment Steps */}
                <section className="mb-8 md:mb-12 bg-gray-50 rounded-xl md:rounded-[20px] p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mb-4 md:mb-6">
                    <h2 className="text-base md:text-xl font-bold text-primary-600">Guía Paso a Paso para</h2>
                    <span className="px-3 md:px-4 py-1 md:py-1.5 rounded-full border border-primary-600 text-primary-600 font-medium text-sm md:text-base w-fit">
                      Invertir →
                    </span>
                  </div>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-4">
                    {investmentSteps.map((step) => (
                      <button
                        key={step.number}
                        className="flex flex-col items-center text-center group cursor-pointer hover:scale-105 transition-transform"
                      >
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-primary-600/30 flex items-center justify-center mb-2 md:mb-3 bg-white group-hover:border-primary-600 group-hover:bg-primary-600/5 transition-all">
                          <span className="text-xs md:text-sm font-bold text-primary-600">{step.number}</span>
                        </div>
                        <h3 className="font-semibold text-primary-600 text-xs md:text-sm mb-0.5 md:mb-1 group-hover:underline">{step.title}</h3>
                        <p className="text-[10px] md:text-xs text-gray-500 group-hover:text-primary-600 transition-colors hidden md:block">{step.description}</p>
                      </button>
                    ))}
                  </div>
                </section>

                {/* Benefits */}
                <section className="mb-8 md:mb-12">
                  <div className="text-center mb-4 md:mb-8">
                    <p className="text-primary-600 font-medium mb-1 md:mb-2 text-sm md:text-base">Beneficios Clave</p>
                    <h2 className="text-lg md:text-2xl font-bold text-primary-600">Inversión inmobiliaria en Tokens</h2>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                    {[
                      { title: 'Accesibilidad', description: 'Invierte desde $100 USD en propiedades premium' },
                      { title: 'Liquidez', description: 'Vende tus tokens cuando quieras en el marketplace' },
                      { title: 'Transparencia', description: 'Todas las transacciones en blockchain' },
                      { title: 'Dividendos', description: 'Recibe ingresos por alquiler mensualmente' },
                    ].map((benefit) => (
                      <div key={benefit.title} className="bg-white border border-gray-200 rounded-xl md:rounded-[15px] p-3 md:p-5 text-center shadow-sm">
                        <h3 className="font-semibold text-primary-600 mb-1 md:mb-2 text-sm md:text-base">{benefit.title}</h3>
                        <p className="text-xs md:text-sm text-gray-500">{benefit.description}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Team */}
                <section className="mb-8 md:mb-12">
                  <h2 className="text-lg md:text-2xl font-bold text-primary-600 text-center mb-4 md:mb-8">Nuestro Equipo</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    {teamMembers.map((member) => (
                      <div key={member.name} className="text-center">
                        <div className={`relative w-20 h-20 md:w-32 md:h-32 mx-auto mb-2 md:mb-3 rounded-xl md:rounded-[15px] overflow-hidden bg-gradient-to-br ${member.bgColor}`}>
                          <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover mix-blend-overlay" />
                        </div>
                        <h3 className="font-bold text-primary-600 text-xs md:text-sm">{member.name}</h3>
                        <p className="text-[10px] md:text-xs text-gray-500 mb-0.5 md:mb-1">{member.role}</p>
                        <p className="text-[10px] md:text-xs text-gray-400 hidden md:block">{member.description}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Trust Section */}
                <section className="bg-primary-600 rounded-xl md:rounded-[20px] p-4 md:p-8 text-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 items-center">
                    <div className="rounded-xl md:rounded-[15px] overflow-hidden h-32 md:h-48 order-2 md:order-1">
                      <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80" alt="Building" className="w-full h-full object-cover" />
                    </div>
                    <div className="order-1 md:order-2">
                      <h2 className="text-lg md:text-2xl font-bold mb-2 md:mb-4">Invertir con confianza, paso a paso</h2>
                      <p className="text-white/80 leading-relaxed text-xs md:text-sm">
                        En {brandConfig.identity.companyName}, el Real Estate se transforma en una inversión fraccionada, accesible y transparente. Cada proyecto se publica con documentación, seguimiento y métricas claras. Más claridad. Más acceso. Más confianza.
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
