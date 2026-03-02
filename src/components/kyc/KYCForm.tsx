"use client";

import { useState, useRef, ChangeEvent, FormEvent } from "react";

interface KYCFormData {
  name: string;
  email: string;
  idFront: File | null;
  idBack: File | null;
  selfie: File | null;
}

interface KYCFormProps {
  onSubmit: (data: KYCFormData) => Promise<void>;
  isSubmitting?: boolean;
}

interface FileUploadProps {
  id: string;
  label: string;
  description: string;
  file: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
}

function FileUpload({
  id,
  label,
  description,
  file,
  onChange,
  disabled,
}: FileUploadProps) {
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
      inputRef.current.value = "";
    }
  };

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-2">
        {label}
      </label>
      <p className="text-xs text-gray-400 mb-3">{description}</p>

      {!file ? (
        <div
          onClick={() => !disabled && inputRef.current?.click()}
          className={`border-2 border-dashed border-gray-700 rounded-lg p-8 text-center transition ${
            disabled
              ? "cursor-not-allowed opacity-50"
              : "cursor-pointer hover:border-gray-600 hover:bg-gray-800/30"
          }`}
        >
          <svg
            className="w-12 h-12 mx-auto mb-3 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="text-sm text-gray-400 mb-1">
            Haz clic para seleccionar o arrastra aqui
          </p>
          <p className="text-xs text-gray-500">PNG, JPG o PDF (Max. 10MB)</p>
        </div>
      ) : (
        <div className="border border-gray-700 rounded-lg p-4 bg-gray-800/50">
          <div className="flex items-start gap-4">
            {preview && (
              <img
                src={preview}
                alt="Preview"
                className="w-24 h-24 object-cover rounded-lg"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-300 truncate">
                {file.name}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled}
                className="text-xs text-red-400 hover:text-red-300 mt-2 disabled:opacity-50"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/*,.pdf"
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
      />
    </div>
  );
}

export function KYCForm({ onSubmit, isSubmitting = false }: KYCFormProps) {
  const [formData, setFormData] = useState<KYCFormData>({
    name: "",
    email: "",
    idFront: null,
    idBack: null,
    selfie: null,
  });
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleFileChange = (field: keyof KYCFormData, file: File | null) => {
    setFormData((prev) => ({
      ...prev,
      [field]: file,
    }));
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError("Por favor, ingresa tu nombre completo");
      return false;
    }

    if (!formData.email.trim()) {
      setError("Por favor, ingresa tu correo electrónico");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Por favor, ingresa un correo electrónico válido");
      return false;
    }

    if (!formData.idFront || !formData.idBack || !formData.selfie) {
      setError("Por favor, sube todos los documentos requeridos");
      return false;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    const files = [formData.idFront, formData.idBack, formData.selfie];

    for (const file of files) {
      if (file.size > maxSize) {
        setError(`El archivo ${file.name} supera el tamaño máximo de 10MB`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al enviar los documentos"
      );
    }
  };

  const allFilesUploaded =
    formData.idFront && formData.idBack && formData.selfie;

  const isFormComplete =
    formData.name.trim() && formData.email.trim() && allFilesUploaded;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
        <div className="flex gap-3">
          <svg
            className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-sm text-blue-200">
            <p className="font-medium mb-1">Información importante:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-200/80">
              <li>Los documentos deben estar vigentes y legibles</li>
              <li>La selfie debe mostrar claramente tu rostro</li>
              <li>Los archivos serán procesados de forma segura</li>
              <li>El proceso de verificación toma 24-48 horas</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-300">Información Personal</h3>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
            Nombre Completo
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            disabled={isSubmitting}
            placeholder="Juan Pérez García"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition disabled:opacity-50"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
            Correo Electrónico
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            disabled={isSubmitting}
            placeholder="correo@ejemplo.com"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition disabled:opacity-50"
          />
        </div>
      </div>

      {/* Document Uploads */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-300">Documentos de Verificación</h3>
      </div>

      <FileUpload
        id="idFront"
        label="Documento de Identidad - Frontal"
        description="Sube la foto del frente de tu documento de identidad, pasaporte o licencia de conducir"
        file={formData.idFront}
        onChange={(file) => handleFileChange("idFront", file)}
        disabled={isSubmitting}
      />

      <FileUpload
        id="idBack"
        label="Documento de Identidad - Reverso"
        description="Sube la foto del reverso de tu documento de identidad o licencia"
        file={formData.idBack}
        onChange={(file) => handleFileChange("idBack", file)}
        disabled={isSubmitting}
      />

      <FileUpload
        id="selfie"
        label="Selfie con Documento"
        description="Toma una selfie sosteniendo tu documento de identidad junto a tu rostro"
        file={formData.selfie}
        onChange={(file) => handleFileChange("selfie", file)}
        disabled={isSubmitting}
      />

      {error && (
        <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4">
          <div className="flex gap-3">
            <svg
              className="w-5 h-5 text-red-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-red-200">{error}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          type="submit"
          disabled={!isFormComplete || isSubmitting}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Procesando...
            </span>
          ) : (
            "Enviar Documentos"
          )}
        </button>
      </div>

      <p className="text-xs text-gray-500 text-center">
        Al enviar tus documentos, aceptas nuestros términos de privacidad y el
        procesamiento seguro de tu información personal.
      </p>
    </form>
  );
}
