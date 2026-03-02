'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useWeb3Auth } from '@/lib/web3auth';
import { getDocumentViewUrl } from '@/lib/utils/documents';

interface Property {
  id: string;
  tokenId: number | null;
  name: string;
  location: string;
  mapUrl: string | null;
  propertyType: string;
  status: string;
  totalFractions: number;
  availableFractions: number;
  pricePerFraction: string;
  description: string;
  metadataUri: string | null;
  estimatedROI: number;
  images: string[];
  documents: string[];
  timeline: string;
  mintTxHash: string | null;
  approveTxHash: string | null;
  listingTxHash: string | null;
  mintBlockNumber: number | null;
  contractAddress: string | null;
  chainId: number | null;
  mintedAt: string | null;
}

interface FormData {
  name: string;
  location: string;
  mapUrl: string;
  propertyType: string;
  description: string;
  estimatedROI: string;
  timeline: string;
  status: string;
  totalFractions: string;
  availableFractions: string;
  pricePerFraction: string;
}

interface UploadedFile {
  url: string;
  name?: string;
}

export default function EditPropertyPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params?.id as string;

  const { isConnected, address, isLoading: authLoading } = useWeb3Auth();
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoadingProperty, setIsLoadingProperty] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [property, setProperty] = useState<Property | null>(null);

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
    description: '',
    estimatedROI: '',
    timeline: 'SHORT_TERM',
    status: 'DRAFT',
    totalFractions: '',
    availableFractions: '',
    pricePerFraction: '',
  });

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

  useEffect(() => {
    if (!isAdmin || !propertyId) return;

    async function loadProperty() {
      try {
        const response = await fetch(`/api/properties/${propertyId}`);
        const data = await response.json();

        if (!data.success) {
          setError(data.error.message);
          return;
        }

        const prop = data.data as Property;
        setProperty(prop);
        setFormData({
          name: prop.name,
          location: prop.location,
          mapUrl: prop.mapUrl || '',
          propertyType: prop.propertyType,
          description: prop.description,
          estimatedROI: prop.estimatedROI?.toString() || '',
          timeline: prop.timeline || 'SHORT_TERM',
          status: prop.status,
          totalFractions: prop.totalFractions.toString(),
          availableFractions: prop.availableFractions.toString(),
          pricePerFraction: prop.pricePerFraction,
        });
        setImages(prop.images?.map((url) => ({ url })) || []);
        setDocuments(prop.documents?.map((url) => ({ url, name: url.split('/').pop() })) || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error loading property');
      } finally {
        setIsLoadingProperty(false);
      }
    }

    loadProperty();
  }, [isAdmin, propertyId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

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
      setError(err instanceof Error ? err.message : 'Error al subir imagenes');
    } finally {
      setIsUploading(false);
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

    if (images.length === 0) {
      setError('Debes tener al menos una imagen');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': address || '',
        },
        body: JSON.stringify({
          name: formData.name,
          location: formData.location,
          mapUrl: formData.mapUrl || null,
          propertyType: formData.propertyType,
          description: formData.description,
          estimatedROI: formData.estimatedROI ? parseFloat(formData.estimatedROI) : 0,
          timeline: formData.timeline,
          status: formData.status,
          totalFractions: parseInt(formData.totalFractions),
          availableFractions: parseInt(formData.availableFractions),
          pricePerFraction: formData.pricePerFraction,
          images: images.map((img) => img.url),
          documents: documents.map((doc) => doc.url),
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error.message);
        return;
      }

      router.push('/admin/properties');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error updating property');
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

  if (isLoadingProperty) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error && !property) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-[15px] p-4">
          <p className="text-red-600">{error}</p>
        </div>
        <Link
          href="/admin/properties"
          className="mt-4 inline-block text-primary-600 hover:text-primary-700"
        >
          ← Volver a propiedades
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary-600 mb-2">Editar Propiedad</h1>
          <p className="text-gray-500">Modifica los datos de la propiedad</p>
        </div>
        <div className="bg-gray-100 px-4 py-2 rounded-[10px] border border-gray-200">
          <span className="text-gray-500 text-sm">Token ID:</span>
          <span className="ml-2 text-primary-600 font-mono font-medium">
            {property?.tokenId ? `#${property.tokenId}` : 'Sin asignar'}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-[15px] p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Images Section */}
        <div className="bg-white border border-gray-200 rounded-[15px] p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-primary-600 mb-4">Imagenes de la Propiedad</h2>
          <p className="text-gray-500 text-sm mb-4">
            La primera imagen sera la principal. Formatos: JPG, PNG, WebP (max. 10MB).
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
                        className="p-1 bg-white/90 hover:bg-white rounded text-gray-600 shadow-sm"
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
                        className="p-1 bg-white/90 hover:bg-white rounded text-gray-600 shadow-sm"
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
                <p className="text-primary-600">Subiendo imagenes...</p>
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
                <p className="text-gray-500 mb-1">Haz clic para subir mas imagenes</p>
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
              />
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-600 mb-2">
                Ubicacion *
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-[10px] text-gray-800 placeholder-gray-400 focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none"
              />
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
              <p className="mt-1 text-xs text-gray-400">
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

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-600 mb-2">
                Estado
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-[10px] text-gray-800 focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none"
              >
                <option value="DRAFT">Borrador</option>
                <option value="ACTIVE">Activo</option>
                <option value="PAUSED">Pausado</option>
                <option value="SOLD_OUT">Agotado</option>
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
              />
            </div>

            {/* Available Fractions */}
            <div>
              <label htmlFor="availableFractions" className="block text-sm font-medium text-gray-600 mb-2">
                Fracciones Disponibles
              </label>
              <input
                type="number"
                id="availableFractions"
                name="availableFractions"
                value={formData.availableFractions}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-[10px] text-gray-800 placeholder-gray-400 focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none"
              />
              <p className="mt-1 text-sm text-gray-400">
                Vendidas: {parseInt(formData.totalFractions || '0') - parseInt(formData.availableFractions || '0')}
              </p>
            </div>

            {/* Price per Fraction */}
            <div>
              <label htmlFor="pricePerFraction" className="block text-sm font-medium text-gray-600 mb-2">
                Precio por Fraccion (USD) *
              </label>
              <input
                type="text"
                id="pricePerFraction"
                name="pricePerFraction"
                value={formData.pricePerFraction}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-[10px] text-gray-800 placeholder-gray-400 focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none"
              />
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
                Horizonte de Inversion
              </label>
              <select
                id="timeline"
                name="timeline"
                value={formData.timeline}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-[10px] text-gray-800 focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none"
              >
                <option value="SHORT_TERM">Corto Plazo (1-2 anos)</option>
                <option value="LONG_TERM">Largo Plazo (3-4 anos)</option>
              </select>
            </div>
          </div>

          {/* Description - Full Width */}
          <div className="mt-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-600 mb-2">
              Descripcion *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-[10px] text-gray-800 placeholder-gray-400 focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none resize-none"
            />
          </div>
        </div>

        {/* Documents Section */}
        <div className="bg-white border border-gray-200 rounded-[15px] p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-primary-600 mb-4">Documentos Legales</h2>
          <p className="text-gray-500 text-sm mb-4">
            Escrituras, contratos, estudios de titulo, etc. Solo PDF (max. 20MB por archivo).
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

        {/* Blockchain Info Section */}
        {property?.mintTxHash && (
          <div className="bg-white border border-gray-200 rounded-[15px] p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-primary-600 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              Registro Blockchain
            </h2>

            {/* Transaction Hashes */}
            <div className="space-y-3 mb-6">
              {/* Mint Transaction */}
              <div className="bg-gray-50 rounded-[10px] p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wide">Mint (createProperty)</p>
                      <code className="text-primary-600 text-sm font-mono">
                        {property.mintTxHash?.slice(0, 20)}...{property.mintTxHash?.slice(-8)}
                      </code>
                    </div>
                  </div>
                  <a
                    href={`https://${property.chainId === 80001 ? 'mumbai.' : ''}polygonscan.com/tx/${property.mintTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-primary-600 text-white text-xs rounded-lg hover:bg-primary-700 transition flex items-center gap-1"
                  >
                    Ver
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Approve Transaction */}
              {property.approveTxHash && (
                <div className="bg-gray-50 rounded-[10px] p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">Approval (setApprovalForAll)</p>
                        <code className="text-green-600 text-sm font-mono">
                          {property.approveTxHash.slice(0, 20)}...{property.approveTxHash.slice(-8)}
                        </code>
                      </div>
                    </div>
                    <a
                      href={`https://${property.chainId === 80001 ? 'mumbai.' : ''}polygonscan.com/tx/${property.approveTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition flex items-center gap-1"
                    >
                      Ver
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              )}

              {/* Listing Transaction */}
              {property.listingTxHash && (
                <div className="bg-gray-50 rounded-[10px] p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">Listing (createListing)</p>
                        <code className="text-purple-600 text-sm font-mono">
                          {property.listingTxHash.slice(0, 20)}...{property.listingTxHash.slice(-8)}
                        </code>
                      </div>
                    </div>
                    <a
                      href={`https://${property.chainId === 80001 ? 'mumbai.' : ''}polygonscan.com/tx/${property.listingTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition flex items-center gap-1"
                    >
                      Ver
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Property Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Contract Address */}
              {property.contractAddress && (
                <div className="bg-gray-50 rounded-[10px] p-4 border border-gray-200">
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Contrato</p>
                  <div className="flex items-center gap-2">
                    <code className="text-green-600 text-sm font-mono">
                      {property.contractAddress.slice(0, 6)}...{property.contractAddress.slice(-4)}
                    </code>
                    <a
                      href={`https://${property.chainId === 80001 ? 'mumbai.' : ''}polygonscan.com/address/${property.contractAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 p-1 text-gray-400 hover:text-green-600 transition"
                      title="Ver contrato en PolygonScan"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              )}

              {/* Token ID */}
              <div className="bg-gray-50 rounded-[10px] p-4 border border-gray-200">
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Token ID</p>
                <p className="text-primary-600 text-lg font-mono font-bold">#{property.tokenId}</p>
              </div>

              {/* Network */}
              <div className="bg-gray-50 rounded-[10px] p-4 border border-gray-200">
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Red</p>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${property.chainId === 137 ? 'bg-purple-500' : 'bg-yellow-500'}`} />
                  <p className="text-gray-800">
                    {property.chainId === 137 ? 'Polygon Mainnet' : property.chainId === 80001 ? 'Mumbai Testnet' : `Chain ${property.chainId}`}
                  </p>
                </div>
              </div>

              {/* Minted At */}
              {property.mintedAt && (
                <div className="bg-gray-50 rounded-[10px] p-4 border border-gray-200">
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Fecha de Mint</p>
                  <p className="text-gray-800">
                    {new Date(property.mintedAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              )}

              {/* Block Number */}
              {property.mintBlockNumber && (
                <div className="bg-gray-50 rounded-[10px] p-4 border border-gray-200">
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Bloque</p>
                  <a
                    href={`https://${property.chainId === 80001 ? 'mumbai.' : ''}polygonscan.com/block/${property.mintBlockNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline font-mono"
                  >
                    #{property.mintBlockNumber}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info Note - Only show if not tokenized */}
        {!property?.tokenId && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-[15px] p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h4 className="text-yellow-700 font-medium">Pendiente de tokenizacion</h4>
                <p className="text-yellow-600 text-sm mt-1">
                  Esta propiedad aun no ha sido tokenizada en el blockchain. Ve a <strong>Contratos → Interactuar</strong> para hacer el mint.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4">
          <Link
            href="/admin/properties"
            className="px-6 py-3 text-gray-500 hover:text-primary-600 transition"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || isUploading || isUploadingDocs}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-[10px] transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}
