'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { usePanelsStore } from '@/store';
import { useKYC } from '@/hooks/useKYC';

/**
 * KYCPanel - Panel de verificación KYC alineado con Figma
 *
 * Se muestra automáticamente después del login si el usuario no tiene KYC.
 * Diseño alineado con el estilo Figma (colores, tipografía, border-radius).
 */

interface FileUploadProps {
  id: string;
  label: string;
  description: string;
  file: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
}

function FileUpload({ id, label, description, file, onChange, disabled }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    onChange(selectedFile);

    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleRemove = () => {
    onChange(null);
    setPreview(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-primary-600 mb-1">
        {label}
      </label>
      <p className="text-xs text-gray-500 mb-2">{description}</p>

      {!file ? (
        <div
          onClick={() => !disabled && inputRef.current?.click()}
          className={`border-2 border-dashed border-gray-300 rounded-[15px] p-4 text-center transition ${
            disabled
              ? 'cursor-not-allowed opacity-50'
              : 'cursor-pointer hover:border-primary-600 hover:bg-gray-50'
          }`}
        >
          <svg
            className="w-8 h-8 mx-auto mb-2 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm text-gray-500">Clic para subir</p>
          <p className="text-xs text-gray-400">PNG, JPG (Max. 10MB)</p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-[15px] p-3 bg-gray-50">
          <div className="flex items-center gap-3">
            {preview && (
              <img
                src={preview}
                alt="Preview"
                className="w-16 h-16 object-cover rounded-lg"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              className="text-red-500 hover:text-red-600 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
      />
    </div>
  );
}

export function KYCPanel() {
  const { closePanel } = usePanelsStore();
  const { status, isLoading, uploadDocument, submitKYC, error, submission } = useKYC();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const allFilesUploaded = idFront && idBack && selfie;
  const isFormComplete = name.trim() && email.trim() && allFilesUploaded;

  // Show loading while fetching KYC status
  if (isLoading) {
    return (
      <div className="flex flex-col items-center text-center max-w-[280px] mx-auto min-h-full justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-primary-600 animate-spin mb-4" />
        <p className="text-gray-500 text-sm">Verificando estado KYC...</p>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!isFormComplete) return;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setSubmitError('Por favor, ingresa un correo electrónico válido');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      // Upload each document
      const [idFrontUrl, idBackUrl, selfieUrl] = await Promise.all([
        uploadDocument(idFront!, 'idFront'),
        uploadDocument(idBack!, 'idBack'),
        uploadDocument(selfie!, 'selfie'),
      ]);

      // Submit KYC with name and email
      await submitKYC({ name, email, idFrontUrl, idBackUrl, selfieUrl });

      // Close panel after successful submission
      closePanel();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Error al enviar documentos');
    } finally {
      setSubmitting(false);
    }
  };

  // If already pending or approved, show status
  if (status === 'PENDING') {
    const submittedDate = submission?.createdAt
      ? new Date(submission.createdAt).toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : null;

    return (
      <div className="flex flex-col items-center text-center max-w-[280px] mx-auto min-h-full justify-center">
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-primary-600 mb-2">En Revisión</h2>
        <p className="text-gray-500 text-sm mb-4">
          Tus documentos están siendo verificados. Este proceso puede tomar 24-48 horas.
        </p>
        {submittedDate && (
          <div className="bg-gray-50 rounded-[15px] p-3 mb-4 w-full">
            <p className="text-xs text-gray-400 mb-1">Enviado el</p>
            <p className="text-sm text-gray-700 font-medium">{submittedDate}</p>
          </div>
        )}
        <div className="bg-blue-50 border border-blue-200 rounded-[15px] p-3 mb-6 w-full">
          <div className="flex gap-2">
            <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-blue-700 text-left">
              En la plataforma podrás ver cuando el estado pase a aprobado.
            </p>
          </div>
        </div>
        <button
          onClick={closePanel}
          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-[15px] hover:bg-gray-200 transition-colors"
        >
          Cerrar
        </button>
      </div>
    );
  }

  if (status === 'APPROVED') {
    return (
      <div className="flex flex-col items-center text-center max-w-[280px] mx-auto min-h-full justify-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-[#16d63d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-primary-600 mb-2">Verificado</h2>
        <p className="text-gray-500 text-sm mb-6">
          Tu identidad ha sido verificada. Ya puedes comprar tokens.
        </p>
        <button
          onClick={closePanel}
          className="px-6 py-2 bg-[#16d63d] text-white rounded-[15px] hover:bg-[#12b534] transition-colors"
        >
          Continuar
        </button>
      </div>
    );
  }

  // REJECTED status - allow resubmission
  const isRejected = status === 'REJECTED';

  return (
    <div className="flex flex-col max-w-[300px] mx-auto">
      {/* Title */}
      <h2 className="text-xl font-bold text-primary-600 mb-2 text-center">
        Verificación KYC
      </h2>
      <p className="text-gray-500 text-sm mb-4 text-center">
        {isRejected
          ? 'Tu verificación fue rechazada. Por favor, envía nuevamente tus documentos.'
          : 'Para comprar tokens, necesitamos verificar tu identidad.'}
      </p>

      {isRejected && (
        <div className="bg-red-50 border border-red-200 rounded-[15px] p-3 mb-4">
          <div className="flex gap-2 mb-2">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-red-600">Verificación Rechazada</p>
          </div>
          {submission?.adminNotes ? (
            <div className="ml-7">
              <p className="text-xs text-red-500 mb-1">Motivo:</p>
              <p className="text-sm text-red-700 bg-red-100 rounded-lg p-2">
                {submission.adminNotes}
              </p>
            </div>
          ) : (
            <p className="text-sm text-red-600 ml-7">
              Asegúrate de que los documentos sean legibles y estén vigentes.
            </p>
          )}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-[15px] p-3 mb-4">
        <div className="flex gap-2">
          <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-blue-700">
            Los documentos deben estar vigentes y ser legibles. El proceso toma 24-48 horas.
          </p>
        </div>
      </div>

      {/* Personal Information */}
      <div className="mb-4">
        <label htmlFor="name" className="block text-sm font-medium text-primary-600 mb-1">
          Nombre Completo
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={submitting}
          placeholder="Juan Pérez García"
          className="w-full px-3 py-2 border border-gray-300 rounded-[10px] text-gray-700 placeholder-gray-400 focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none transition disabled:opacity-50 disabled:bg-gray-100"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="email" className="block text-sm font-medium text-primary-600 mb-1">
          Correo Electrónico
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting}
          placeholder="correo@ejemplo.com"
          className="w-full px-3 py-2 border border-gray-300 rounded-[10px] text-gray-700 placeholder-gray-400 focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none transition disabled:opacity-50 disabled:bg-gray-100"
        />
      </div>

      {/* File Uploads */}
      <FileUpload
        id="idFront"
        label="1. Documento - Frontal"
        description="Foto del frente de tu DNI o pasaporte"
        file={idFront}
        onChange={setIdFront}
        disabled={submitting}
      />

      <FileUpload
        id="idBack"
        label="2. Documento - Reverso"
        description="Foto del reverso de tu documento"
        file={idBack}
        onChange={setIdBack}
        disabled={submitting}
      />

      <FileUpload
        id="selfie"
        label="3. Selfie con Documento"
        description="Foto tuya sosteniendo el documento"
        file={selfie}
        onChange={setSelfie}
        disabled={submitting}
      />

      {/* Error Message */}
      {(submitError || error) && (
        <div className="bg-red-50 border border-red-200 rounded-[15px] p-3 mb-4">
          <p className="text-sm text-red-600">{submitError || error}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={!allFilesUploaded || submitting}
        className="w-full py-3 bg-primary-600 text-white font-semibold rounded-[20px] hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Enviando...
          </>
        ) : (
          'Enviar Documentos'
        )}
      </button>

      {/* Privacy Note */}
      <p className="text-xs text-gray-400 text-center mt-3">
        Tus datos son procesados de forma segura y confidencial.
      </p>
    </div>
  );
}
