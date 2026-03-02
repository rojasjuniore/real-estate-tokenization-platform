"use client";

import { useState, useCallback, useEffect } from "react";
import { useWeb3Auth } from "@/lib/web3auth";

export type KYCStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED";

interface KYCSubmission {
  id: string;
  status: KYCStatus;
  adminNotes: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

interface KYCState {
  status: KYCStatus;
  submission: KYCSubmission | null;
  isLoading: boolean;
  error: string | null;
  hasFetched: boolean;
}

export function useKYC() {
  const { address } = useWeb3Auth();
  const [state, setState] = useState<KYCState>({
    status: "NONE",
    submission: null,
    isLoading: true,
    error: null,
    hasFetched: false,
  });

  const fetchStatus = useCallback(async () => {
    if (!address) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch("/api/kyc/status", {
        headers: {
          "x-wallet-address": address,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || "Failed to fetch KYC status");
      }

      setState({
        status: data.data.kycStatus,
        submission: data.data.submission,
        isLoading: false,
        error: null,
        hasFetched: true,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
        hasFetched: true,
      }));
    }
  }, [address]);

  // Auto-fetch status on mount when address is available
  useEffect(() => {
    if (address && !state.hasFetched) {
      fetchStatus();
    } else if (!address) {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [address, state.hasFetched, fetchStatus]);

  const uploadDocument = useCallback(
    async (file: File, documentType: "idFront" | "idBack" | "selfie") => {
      if (!address) throw new Error("Wallet not connected");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", documentType);

      const response = await fetch("/api/kyc/upload", {
        method: "POST",
        headers: {
          "x-wallet-address": address,
        },
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || "Failed to upload document");
      }

      return data.data.url;
    },
    [address]
  );

  const submitKYC = useCallback(
    async (data: {
      name: string;
      email: string;
      idFrontUrl: string;
      idBackUrl: string;
      selfieUrl: string;
    }) => {
      if (!address) throw new Error("Wallet not connected");

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch("/api/kyc", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-wallet-address": address,
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || "Failed to submit KYC");
        }

        setState({
          status: "PENDING",
          submission: result.data,
          isLoading: false,
          error: null,
          hasFetched: true,
        });

        return result.data;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: message,
        }));
        throw error;
      }
    },
    [address]
  );

  return {
    ...state,
    fetchStatus,
    uploadDocument,
    submitKYC,
    isApproved: state.status === "APPROVED",
    isPending: state.status === "PENDING",
    isRejected: state.status === "REJECTED",
    needsKYC: state.status === "NONE",
  };
}
