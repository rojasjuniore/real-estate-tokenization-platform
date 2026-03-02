"use client";

export type KYCStatusType = "NONE" | "PENDING" | "APPROVED" | "REJECTED";

interface KYCStatusProps {
  status: KYCStatusType;
  message?: string;
  className?: string;
}

const statusConfig = {
  NONE: {
    label: "No Verificado",
    bgColor: "bg-gray-700/50",
    borderColor: "border-gray-600",
    textColor: "text-gray-300",
    iconColor: "text-gray-400",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    ),
  },
  PENDING: {
    label: "En Revision",
    bgColor: "bg-blue-900/30",
    borderColor: "border-blue-700/50",
    textColor: "text-blue-300",
    iconColor: "text-blue-400",
    icon: (
      <svg
        className="w-5 h-5 animate-spin"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
    ),
  },
  APPROVED: {
    label: "Verificado",
    bgColor: "bg-green-900/30",
    borderColor: "border-green-700/50",
    textColor: "text-green-300",
    iconColor: "text-green-400",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  REJECTED: {
    label: "Rechazado",
    bgColor: "bg-red-900/30",
    borderColor: "border-red-700/50",
    textColor: "text-red-300",
    iconColor: "text-red-400",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
};

export function KYCStatus({ status, message, className = "" }: KYCStatusProps) {
  const config = statusConfig[status];

  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${config.bgColor} ${config.borderColor} ${className}`}
    >
      <div className={config.iconColor}>{config.icon}</div>
      <div>
        <p className={`font-semibold text-sm ${config.textColor}`}>
          {config.label}
        </p>
        {message && (
          <p className="text-xs text-gray-400 mt-0.5">{message}</p>
        )}
      </div>
    </div>
  );
}
