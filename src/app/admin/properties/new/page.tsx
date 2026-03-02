'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useWeb3Auth } from '@/lib/web3auth';
import { getDocumentViewUrl } from '@/lib/utils/documents';

interface FormData {
  name: string;
  location: string;
  mapUrl: string;
  propertyType: string;
  totalFractions: string;
  pricePerFraction: string;
  description: string;
  estimatedROI: string;
  timeline: string;
}

interface FormErrors {
  [key: string]: string;
}

interface UploadedFile {
  url: string;
  name?: string;
  uploading?: boolean;
}

export default function NewPropertyPage() {
  const router = useRouter();
  const { isConnected, address, isLoading: authLoading } = useWeb3Auth();
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mintStatus, setMintStatus] = useState<'idle' | 'creating' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [images, setImages] = useState<UploadedFile[]>([]);
  const [documents, setDocuments] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingDocs, setIsUploadingDocs] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    location: '',
    mapUrl: '',
    propertyType: 'RESIDENTIAL',
    totalFractions: '',
    pricePerFraction: '',
    description: '',
    estimatedROI: '',
    timeline: 'SHORT_TERM',
  });

  // Generate random test data (dev only)
  const generateRandomData = () => {
    const propertyNames = [
      'Casa del Sol', 'Villa Marina', 'Torre Skyline', 'Residencial Los Pinos',
      'Edificio Central', 'Loft Downtown', 'Penthouse Elite', 'Casa Moderna',
      'Apartamentos Vista', 'Complejo Residencial Aurora'
    ];
    const locations = [
      'Miami, FL', 'New York, NY', 'Los Angeles, CA', 'Austin, TX',
      'Denver, CO', 'Seattle, WA', 'Chicago, IL', 'Boston, MA',
      'San Francisco, CA', 'Phoenix, AZ'
    ];
    const propertyTypes = ['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'MIXED'];
    const timelines = ['SHORT_TERM', 'LONG_TERM'];
    const descriptions = [
      'Propiedad premium ubicada en zona exclusiva con acabados de lujo y amenidades de primer nivel.',
      'Excelente oportunidad de inversión con alto potencial de valorización y retorno garantizado.',
      'Moderna construcción con diseño arquitectónico innovador y tecnología smart home integrada.',
      'Ubicación estratégica cerca de centros comerciales, escuelas y transporte público.',
      'Propiedad completamente remodelada con materiales de alta calidad y eficiencia energética.',
    ];

    // Pool of varied property images from Unsplash
    const imagePool = [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80',
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80',
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80',
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80',
      'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&q=80',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80',
      'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=800&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80',
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80',
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80',
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80',
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
      'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80',
    ];

    const randomPick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
    const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

    // Random decimal for small test values (0.001 to 0.1)
    const randomSmallDecimal = () => {
      const values = [0.001, 0.005, 0.01, 0.02, 0.05, 0.1];
      return randomPick(values).toString();
    };

    setFormData({
      name: randomPick(propertyNames) + ' #' + randomInt(100, 999),
      location: randomPick(locations),
      mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d57482.223710891216!2d-80.2665929659122!3d25.782485486418416!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88d9b0a20ec8c111%3A0xff96f271ddad4f65!2sMiami%2C%20Florida%2C%20EE.%20UU.!5e0!3m2!1ses-419!2sco!4v1767526711397!5m2!1ses-419!2sco',
      propertyType: randomPick(propertyTypes),
      totalFractions: String(randomInt(1, 10)), // 1 to 10 tokens
      pricePerFraction: randomSmallDecimal(), // 0.001 to 0.1 USD
      description: randomPick(descriptions),
      estimatedROI: (Math.random() * 10 + 5).toFixed(2), // 5-15%
      timeline: randomPick(timelines),
    });

    // Select 3 random unique images from the pool
    const shuffled = [...imagePool].sort(() => Math.random() - 0.5);
    setImages([
      { url: shuffled[0] },
      { url: shuffled[1] },
      { url: shuffled[2] },
    ]);
  };

  useEffect(() => {
    if (authLoading) return;

    if (!isConnected) {
      router.replace('/#home');
      return;
    }

    async function checkAdmin() {
      try {
        const response = await fetch('/api/admin/check', {
          headers: { 'x-wallet-address': address || '' },
        });
        const data = await response.json();

        if (data.success && data.data.isAdmin) {
          setIsAdmin(true);
        } else {
          router.replace('/#home');
        }
      } catch {
        router.replace('/#home');
      } finally {
        setIsCheckingAdmin(false);
      }
    }

    checkAdmin();
  }, [isConnected, address, authLoading, router]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name) {
      newErrors.name = 'Nombre es un campo requerido';
    }

    if (!formData.location) {
      newErrors.location = 'Ubicación es un campo requerido';
    }

    if (!formData.totalFractions) {
      newErrors.totalFractions = 'Total de Fracciones es un campo requerido';
    }

    if (!formData.pricePerFraction) {
      newErrors.pricePerFraction = 'Precio por Fracción es un campo requerido';
    }

    if (!formData.description) {
      newErrors.description = 'Descripción es un campo requerido';
    }

    if (images.length === 0) {
      newErrors.images = 'Debes subir al menos una imagen';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Clear previous error
    if (errors.images) {
      setErrors((prev) => ({ ...prev, images: '' }));
    }

    setIsUploading(true);

    try {
      const formDataUpload = new FormData();
      Array.from(files).forEach((file) => {
        formDataUpload.append('files', file);
      });

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'x-wallet-address': address || '',
        },
        body: formDataUpload,
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error.message);
        return;
      }

      setImages((prev) => [
        ...prev,
        ...data.data.images.map((url: string) => ({ url })),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir imágenes');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === images.length - 1)
    ) {
      return;
    }

    const newImages = [...images];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
    setImages(newImages);
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingDocs(true);

    try {
      const formDataUpload = new FormData();
      Array.from(files).forEach((file) => {
        formDataUpload.append('files', file);
      });

      const response = await fetch('/api/upload/documents', {
        method: 'POST',
        headers: {
          'x-wallet-address': address || '',
        },
        body: formDataUpload,
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error.message);
        return;
      }

      setDocuments((prev) => [
        ...prev,
        ...data.data.documents.map((doc: { url: string; name: string }) => ({
          url: doc.url,
          name: doc.name,
        })),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir documentos');
    } finally {
      setIsUploadingDocs(false);
      if (docInputRef.current) {
        docInputRef.current.value = '';
      }
    }
  };

  const removeDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setMintStatus('creating');

    try {
      // Create property in database with PENDING_REVIEW status
      // No tokenId yet - will be assigned after approval and deploy
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': address || '',
        },
        body: JSON.stringify({
          name: formData.name,
          location: formData.location,
          mapUrl: formData.mapUrl || null,
          propertyType: formData.propertyType,
          totalFractions: parseInt(formData.totalFractions),
          pricePerFraction: formData.pricePerFraction,
          description: formData.description,
          estimatedROI: formData.estimatedROI ? parseFloat(formData.estimatedROI) : 0,
          timeline: formData.timeline,
          images: images.map((img) => img.url),
          documents: documents.map((doc) => doc.url),
          status: 'PENDING_REVIEW',
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error.message);
        setMintStatus('idle');
        return;
      }

      setMintStatus('done');

      // Redirect after success
      setTimeout(() => {
        router.push('/admin/properties');
      }, 1500);

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear la propiedad');
      setMintStatus('idle');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || isCheckingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-500">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary-600 mb-2">Nueva Propiedad</h1>
          <p className="text-gray-500">Crea una nueva propiedad tokenizada</p>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <button
            type="button"
            onClick={generateRandomData}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            Generar Datos Test
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-[15px] p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Images Section */}
        <div className="bg-white border border-gray-200 rounded-[15px] p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-primary-600 mb-4">Imágenes de la Propiedad</h2>
          <p className="text-gray-500 text-sm mb-4">
            Sube imágenes de la propiedad. La primera imagen será la principal. Formatos: JPG, PNG, WebP (máx. 10MB).
          </p>

          {/* Image Grid */}
          {images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
              {images.map((image, index) => (
                <div
                  key={index}
                  className={`relative aspect-video rounded-[10px] overflow-hidden border-2 ${
                    index === 0 ? 'border-primary-600' : 'border-gray-200'
                  }`}
                >
                  <Image
                    src={image.url}
                    alt={`Property image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  {index === 0 && (
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-1 bg-primary-600 text-white text-xs rounded-full">
                        Principal
                      </span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1">
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => moveImage(index, 'up')}
                        className="p-1 bg-white/90 hover:bg-white rounded text-gray-700"
                        title="Mover arriba"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                    )}
                    {index < images.length - 1 && (
                      <button
                        type="button"
                        onClick={() => moveImage(index, 'down')}
                        className="p-1 bg-white/90 hover:bg-white rounded text-gray-700"
                        title="Mover abajo"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="p-1 bg-red-500 hover:bg-red-600 rounded text-white"
                      title="Eliminar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upload Button */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-[10px] p-8 text-center cursor-pointer transition ${
              isUploading
                ? 'border-primary-600 bg-primary-600/5'
                : 'border-gray-300 hover:border-primary-600 hover:bg-gray-50'
            }`}
          >
            {isUploading ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-2" />
                <p className="text-primary-600">Subiendo imágenes...</p>
              </div>
            ) : (
              <>
                <svg
                  className="w-12 h-12 mx-auto text-gray-400 mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-gray-600 mb-1">Haz clic para subir imágenes</p>
                <p className="text-gray-400 text-sm">o arrastra y suelta</p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
          {errors.images && (
            <p className="mt-2 text-sm text-red-600">{errors.images}</p>
          )}
        </div>

        {/* Property Details */}
        <div className="bg-white border border-gray-200 rounded-[15px] p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-primary-600 mb-4">Detalles de la Propiedad</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-600 mb-2">
                Nombre *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-[10px] text-gray-800 placeholder-gray-400 focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none"
                placeholder="Casa del Sol"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-600 mb-2">
                Ubicación *
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-[10px] text-gray-800 placeholder-gray-400 focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none"
                placeholder="Miami, FL"
              />
              {errors.location && (
                <p className="mt-1 text-sm text-red-600">{errors.location}</p>
              )}
            </div>

            {/* Google Maps URL */}
            <div className="md:col-span-2">
              <label htmlFor="mapUrl" className="block text-sm font-medium text-gray-600 mb-2">
                URL de Google Maps
              </label>
              <input
                type="text"
                id="mapUrl"
                name="mapUrl"
                value={formData.mapUrl}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-[10px] text-gray-800 placeholder-gray-400 focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none"
                placeholder="https://www.google.com/maps/embed?pb=..."
              />
              <p className="mt-1 text-xs text-gray-500">
                Pega solo la URL del src del iframe de Google Maps (Compartir → Insertar un mapa → copiar solo la URL).
              </p>
            </div>

            {/* Property Type */}
            <div>
              <label htmlFor="propertyType" className="block text-sm font-medium text-gray-600 mb-2">
                Tipo de Propiedad *
              </label>
              <select
                id="propertyType"
                name="propertyType"
                value={formData.propertyType}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-[10px] text-gray-800 focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none"
              >
                <option value="RESIDENTIAL">Residencial</option>
                <option value="COMMERCIAL">Comercial</option>
                <option value="INDUSTRIAL">Industrial</option>
                <option value="MIXED">Mixto</option>
              </select>
            </div>

            {/* Total Fractions */}
            <div>
              <label htmlFor="totalFractions" className="block text-sm font-medium text-gray-600 mb-2">
                Total de Fracciones *
              </label>
              <input
                type="number"
                id="totalFractions"
                name="totalFractions"
                value={formData.totalFractions}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-[10px] text-gray-800 placeholder-gray-400 focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none"
                placeholder="1000"
              />
              {errors.totalFractions && (
                <p className="mt-1 text-sm text-red-600">{errors.totalFractions}</p>
              )}
            </div>

            {/* Price per Fraction */}
            <div>
              <label htmlFor="pricePerFraction" className="block text-sm font-medium text-gray-600 mb-2">
                Precio por Fracción (USD) *
              </label>
              <input
                type="text"
                id="pricePerFraction"
                name="pricePerFraction"
                value={formData.pricePerFraction}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-[10px] text-gray-800 placeholder-gray-400 focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none"
                placeholder="100.00"
              />
              {errors.pricePerFraction && (
                <p className="mt-1 text-sm text-red-600">{errors.pricePerFraction}</p>
              )}
            </div>

            {/* Estimated ROI */}
            <div>
              <label htmlFor="estimatedROI" className="block text-sm font-medium text-gray-600 mb-2">
                ROI Estimado (%)
              </label>
              <input
                type="text"
                id="estimatedROI"
                name="estimatedROI"
                value={formData.estimatedROI}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-[10px] text-gray-800 placeholder-gray-400 focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none"
                placeholder="8.5"
              />
            </div>

            {/* Timeline */}
            <div>
              <label htmlFor="timeline" className="block text-sm font-medium text-gray-600 mb-2">
                Horizonte de Inversión
              </label>
              <select
                id="timeline"
                name="timeline"
                value={formData.timeline}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-[10px] text-gray-800 focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none"
              >
                <option value="SHORT_TERM">Corto Plazo (1-2 años)</option>
                <option value="LONG_TERM">Largo Plazo (3-4 años)</option>
              </select>
            </div>
          </div>

          {/* Description - Full Width */}
          <div className="mt-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-600 mb-2">
              Descripción *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-[10px] text-gray-800 placeholder-gray-400 focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none resize-none"
              placeholder="Describe la propiedad, sus características, ubicación, beneficios de inversión..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>
        </div>

        {/* Documents Section */}
        <div className="bg-white border border-gray-200 rounded-[15px] p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-primary-600 mb-4">Documentos Legales</h2>
          <p className="text-gray-500 text-sm mb-4">
            Sube los documentos legales de la propiedad: escrituras, contratos, estudios de título, etc. Solo PDF (máx. 20MB por archivo).
          </p>

          {/* Documents List */}
          {documents.length > 0 && (
            <div className="space-y-2 mb-4">
              {documents.map((doc, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-[10px] border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zm-2.5 9.5a.5.5 0 01.5.5v3a.5.5 0 01-1 0v-3a.5.5 0 01.5-.5zm2 0a.5.5 0 01.5.5v3a.5.5 0 01-1 0v-3a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v3a.5.5 0 01-1 0v-3a.5.5 0 01.5-.5z" />
                    </svg>
                    <div>
                      <p className="text-gray-800 text-sm font-medium truncate max-w-[200px] md:max-w-[400px]">
                        {doc.name || 'Documento'}
                      </p>
                      <a
                        href={getDocumentViewUrl(doc.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 text-xs hover:underline"
                      >
                        Ver documento
                      </a>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDocument(index)}
                    className="p-2 text-gray-400 hover:text-red-500 transition"
                    title="Eliminar documento"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload Button */}
          <div
            onClick={() => docInputRef.current?.click()}
            className={`border-2 border-dashed rounded-[10px] p-6 text-center cursor-pointer transition ${
              isUploadingDocs
                ? 'border-primary-600 bg-primary-600/5'
                : 'border-gray-300 hover:border-primary-600 hover:bg-gray-50'
            }`}
          >
            {isUploadingDocs ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-2" />
                <p className="text-primary-600">Subiendo documentos...</p>
              </div>
            ) : (
              <>
                <svg
                  className="w-10 h-10 mx-auto text-gray-400 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-gray-500 text-sm">Haz clic para subir documentos PDF</p>
              </>
            )}
          </div>
          <input
            ref={docInputRef}
            type="file"
            accept="application/pdf"
            multiple
            onChange={handleDocumentUpload}
            className="hidden"
          />
        </div>

        {/* Creating Progress */}
        {mintStatus === 'creating' && (
          <div className="bg-primary-600/5 border border-primary-600/20 rounded-[15px] p-4">
            <div className="flex items-start gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-primary-600 font-medium">
                  Guardando propiedad...
                </h4>
                <p className="text-primary-600/70 text-sm mt-1">
                  La propiedad se enviará para revisión del equipo.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {mintStatus === 'done' && (
          <div className="bg-green-50 border border-green-200 rounded-[15px] p-6">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div className="flex-1">
                <h4 className="text-green-700 font-medium mb-2">¡Propiedad enviada para revisión!</h4>
                <p className="text-green-600 text-sm">
                  El equipo revisará la propiedad y la aprobará para su tokenización.
                  Redirigiendo a la lista de propiedades...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info Note */}
        {mintStatus === 'idle' && (
          <div className="bg-amber-50 border border-amber-200 rounded-[15px] p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h4 className="text-amber-700 font-medium">Flujo de aprobación</h4>
                <p className="text-amber-600 text-sm mt-1">
                  La propiedad será enviada para revisión. El proceso es:
                </p>
                <ol className="text-amber-600 text-sm mt-2 list-decimal list-inside space-y-1">
                  <li><strong>Crear</strong> - La propiedad queda pendiente de revisión</li>
                  <li><strong>Revisión</strong> - El equipo revisa y aprueba/rechaza</li>
                  <li><strong>Deploy</strong> - Si se aprueba, se tokeniza en blockchain</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4">
          <Link
            href="/admin/properties"
            className={`px-6 py-3 text-gray-500 hover:text-gray-700 transition ${isSubmitting ? 'pointer-events-none opacity-50' : ''}`}
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || isUploading || mintStatus === 'done'}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-[10px] transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mintStatus === 'creating' && 'Guardando...'}
            {mintStatus === 'done' && '¡Enviado!'}
            {mintStatus === 'idle' && 'Enviar para Revisión'}
          </button>
        </div>
      </form>
    </div>
  );
}
