'use client';

import { useState } from 'react';

export function ContactPanel() {
  const [formData, setFormData] = useState({
    email: '',
    nombre: '',
    telefono: '',
    servicio: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Reset form
    setFormData({
      email: '',
      nombre: '',
      telefono: '',
      servicio: '',
    });
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col">
      <h2 className="text-xl font-bold text-[#1e3a5f] mb-6">
        Contáctanos / Soporte
      </h2>

      <form onSubmit={handleSubmit} className="w-full space-y-5">
        <div>
          <label className="block text-[#1e3a5f] text-sm font-medium mb-1.5">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 border border-[#1e3a5f]/40 rounded-3xl focus:border-[#1e3a5f] focus:outline-none transition-colors bg-white text-sm"
          />
        </div>

        <div>
          <label className="block text-[#1e3a5f] text-sm font-medium mb-1.5">
            Nombre
          </label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 border border-[#1e3a5f]/40 rounded-3xl focus:border-[#1e3a5f] focus:outline-none transition-colors bg-white text-sm"
          />
        </div>

        <div>
          <label className="block text-[#1e3a5f] text-sm font-medium mb-1.5">
            Teléfono
          </label>
          <input
            type="tel"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-[#1e3a5f]/40 rounded-3xl focus:border-[#1e3a5f] focus:outline-none transition-colors bg-white text-sm"
          />
        </div>

        <div>
          <label className="block text-[#1e3a5f] text-sm font-medium mb-1.5">
            Servicio
          </label>
          <div className="relative">
            <select
              name="servicio"
              value={formData.servicio}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 border border-[#1e3a5f]/40 rounded-3xl focus:border-[#1e3a5f] focus:outline-none transition-colors bg-white appearance-none pr-10 text-sm"
            >
              <option value="">Seleccionar...</option>
              <option value="inversiones">Inversiones</option>
              <option value="soporte-tecnico">Soporte Técnico</option>
              <option value="kyc">Verificación KYC</option>
              <option value="dividendos">Dividendos</option>
              <option value="otro">Otro</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-[#1e3a5f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-[#1e3a5f] text-white font-semibold rounded-3xl hover:bg-[#152a45] disabled:opacity-50 transition-colors uppercase tracking-wider text-sm mt-2"
        >
          {isSubmitting ? 'Enviando...' : 'ENVIAR'}
        </button>
      </form>
    </div>
  );
}
