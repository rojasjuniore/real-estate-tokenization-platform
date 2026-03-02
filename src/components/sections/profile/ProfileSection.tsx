'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWeb3Auth } from '@/lib/web3auth';
import { useNavigationStore, usePanelsStore } from '@/store';
import { brandConfig } from '@/config/brand.config';
import { CHAIN_CONFIG } from '@/lib/web3auth/config';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { useKYC } from '@/hooks/useKYC';

// Types from API - matches /api/users/[address] response
interface PortfolioProperty {
  id: string;
  tokenAmount: number;
  purchasePrice: number; // Calculated by API from transactions
  purchasedAt: string;
  property: {
    id: string;
    tokenId: number;
    name: string;
    location: string;
    pricePerFraction: string;
    totalFractions: number;
    status: string;
    images?: string[];
  };
}

interface UserProperty {
  id: string;
  name: string;
  location: string;
  imageUrl: string;
  tokensOwned: number;
  totalTokens: number;
  currentValue: number;
  purchasePrice: number;
  status: 'active' | 'pending' | 'sold';
}

interface RoyaltyPayment {
  id: string;
  propertyName: string;
  amount: number;
  date: string;
  status: 'paid' | 'pending' | 'processing';
  txHash?: string;
  onChainDistributionId?: number;
}

interface Transaction {
  id: string;
  type: 'BUY' | 'SELL' | 'DIVIDEND_CLAIM' | 'DIVIDEND_DISTRIBUTION';
  amount: number;
  tokenAmount?: number;
  txHash: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  createdAt: string;
  propertyName?: string;
  propertyId?: string;
  pricePerToken?: number;
}

interface PropertyPurchaseDetail {
  propertyId: string;
  propertyName: string;
  transactions: Transaction[];
  totalTokens: number;
  totalInvested: number;
  averagePrice: number;
}

interface PortfolioTotals {
  totalTokens: number;
  totalValue: number;
  properties: number;
}

type TabType = 'portfolio' | 'royalties' | 'activity' | 'settings';

// Icons
const PortfolioIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
);

const RoyaltiesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ActivityIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const CopyIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
  </svg>
);

export function ProfileSection() {
  const { isConnected, userInfo, address, getBalances, logout, claimRoyalty } = useWeb3Auth();
  const { navigate } = useNavigationStore();
  const { openPanel } = usePanelsStore();
  const { status: kycStatus, isApproved: kycApproved, isPending: kycPending } = useKYC();
  const [activeTab, setActiveTab] = useState<TabType>('portfolio');
  const [balances, setBalances] = useState<{ matic: string; usdt: string }>({ matic: '0', usdt: '0' });
  const [copied, setCopied] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimResult, setClaimResult] = useState<{ success: boolean; message: string } | null>(null);

  // Real data from API
  const [userProperties, setUserProperties] = useState<UserProperty[]>([]);
  const [royalties, setRoyalties] = useState<RoyaltyPayment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totals, setTotals] = useState<PortfolioTotals>({ totalTokens: 0, totalValue: 0, properties: 0 });
  const [loading, setLoading] = useState(true);
  const [totalRoyaltiesClaimed, setTotalRoyaltiesClaimed] = useState(0);

  // Profile image
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // User profile info (name, email from database)
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  // Purchase details modal
  const [selectedPropertyDetail, setSelectedPropertyDetail] = useState<PropertyPurchaseDetail | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  // KYC config
  const kycConfig = {
    NONE: { label: 'No Verificado', color: 'text-gray-500', bg: 'bg-gray-100', action: 'Verificar Identidad' },
    PENDING: { label: 'En Revisión', color: 'text-amber-600', bg: 'bg-amber-50', action: null },
    APPROVED: { label: 'Verificado', color: 'text-green-600', bg: 'bg-green-50', action: null },
    REJECTED: { label: 'Rechazado', color: 'text-red-600', bg: 'bg-red-50', action: 'Reintentar' },
  };
  const currentKYC = kycConfig[kycStatus] || kycConfig.NONE;

  const fetchBalances = useCallback(async () => {
    if (isConnected) {
      const result = await getBalances();
      setBalances(result);
    }
  }, [isConnected, getBalances]);

  // Fetch portfolio from API
  const fetchPortfolio = useCallback(async () => {
    if (!address) return;

    try {
      const response = await fetch(`/api/users/${address}`);

      if (!response.ok) {
        // User not found is expected for new users - not an error
        if (response.status === 404) {
          setUserProperties([]);
          setTotals({ totalTokens: 0, totalValue: 0, properties: 0 });
          return;
        }
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        // Set profile image from API
        if (data.data.profileImage) {
          setProfileImage(data.data.profileImage);
        }

        // Set user profile info from database
        if (data.data.name) {
          setUserName(data.data.name);
        }
        if (data.data.email) {
          setUserEmail(data.data.email);
        }

        const portfolio = data.data.portfolio || [];
        const properties: UserProperty[] = portfolio.map((item: PortfolioProperty) => {
          const pricePerFraction = Number(item.property.pricePerFraction) || 0;
          const currentValue = item.tokenAmount * pricePerFraction;
          const purchasePrice = item.purchasePrice || currentValue; // Fallback to current value if no purchase history

          // Determine status for display:
          // - SOLD_OUT means the property is fully sold
          // - For portfolio view, if user owns tokens, it's "active" for them
          let displayStatus: 'active' | 'pending' | 'sold' = 'active';
          if (item.property.status === 'SOLD_OUT') {
            displayStatus = 'sold';
          } else if (item.property.status === 'PAUSED') {
            displayStatus = 'pending';
          }

          return {
            id: item.property.id,
            name: item.property.name,
            location: item.property.location || '',
            imageUrl: item.property.images?.[0] || 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&q=80',
            tokensOwned: item.tokenAmount,
            totalTokens: item.property.totalFractions || 1000,
            currentValue,
            purchasePrice,
            status: displayStatus,
          };
        });

        setUserProperties(properties);
        setTotals({
          totalTokens: properties.reduce((sum, p) => sum + p.tokensOwned, 0),
          totalValue: properties.reduce((sum, p) => sum + p.currentValue, 0),
          properties: properties.length,
        });
      }
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    }
  }, [address]);

  // Fetch dividend history from API
  const fetchDividends = useCallback(async () => {
    if (!address) return;

    try {
      // Fetch claimed dividends history
      const response = await fetch('/api/dividends/history', {
        headers: {
          'x-wallet-address': address,
        },
      });

      // Handle 404 gracefully for new users
      if (response.ok) {
        const data = await response.json();

        if (data.success && data.data) {
          const royaltyHistory: RoyaltyPayment[] = (data.data.history || []).map((item: {
            id: string;
            property: { name: string };
            amount: string;
            claimedAt: string;
            txHash: string;
          }) => ({
            id: `claimed-${item.id}`,
            propertyName: item.property.name,
            amount: Number(item.amount),
            date: item.claimedAt,
            status: 'paid' as const,
            txHash: item.txHash,
          }));

          setRoyalties(royaltyHistory);
          setTotalRoyaltiesClaimed(Number(data.data.totalClaimed || 0));
        }
      } else if (response.status !== 404) {
        console.error('Error fetching dividend history:', response.status);
      }

      // Also fetch pending/claimable dividends
      const pendingResponse = await fetch('/api/dividends', {
        headers: {
          'x-wallet-address': address,
        },
      });

      console.log('Pending dividends response status:', pendingResponse.status);

      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json();
        console.log('Pending dividends data:', pendingData);

        if (pendingData.success && pendingData.data?.dividends) {
          const pendingRoyalties: RoyaltyPayment[] = pendingData.data.dividends.map((item: {
            id: string;
            claimId: string;
            property: { name: string };
            amount: string;
            distributedAt: string;
            onChainDistributionId: number;
          }) => ({
            id: `pending-${item.claimId}`,
            propertyName: item.property.name,
            amount: Number(item.amount),
            date: item.distributedAt,
            status: 'pending' as const,
            onChainDistributionId: item.onChainDistributionId,
          }));

          setRoyalties(prev => [...pendingRoyalties, ...prev]);
        }
      } else if (pendingResponse.status !== 404) {
        console.error('Error fetching pending dividends:', pendingResponse.status);
      }
    } catch (error) {
      console.error('Error fetching dividends:', error);
    }
  }, [address]);

  // Fetch transactions from API
  const fetchTransactions = useCallback(async () => {
    if (!address) return;

    try {
      const response = await fetch(`/api/users/${address}/transactions`);

      if (response.ok) {
        const data = await response.json();

        if (data.success && data.data) {
          setTransactions(data.data.transactions || []);
        }
      } else if (response.status !== 404) {
        console.error('Error fetching transactions:', response.status);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  }, [address]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchBalances(), fetchPortfolio(), fetchDividends(), fetchTransactions()]);
      setLoading(false);
    };

    if (isConnected && address) {
      loadData();
    }
  }, [isConnected, address, fetchBalances, fetchPortfolio, fetchDividends, fetchTransactions]);

  const handleClaimRoyalty = async (distributionId: string) => {
    setClaimingId(distributionId);
    setClaimResult(null);

    try {
      const result = await claimRoyalty(parseInt(distributionId));

      if (result.success) {
        setClaimResult({
          success: true,
          message: `Regalía reclamada exitosamente. TX: ${result.txHash?.slice(0, 10)}...`
        });
        // Refresh data after claim
        setTimeout(() => {
          fetchBalances();
          fetchDividends();
        }, 3000);
      } else {
        setClaimResult({
          success: false,
          message: result.error || 'Error al reclamar la regalía'
        });
      }
    } catch (error) {
      setClaimResult({
        success: false,
        message: 'Error inesperado al procesar la transacción'
      });
    } finally {
      setClaimingId(null);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !address) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/users/${address}/profile-image`, {
        method: 'POST',
        headers: {
          'x-wallet-address': address,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.data?.profileImage) {
        setProfileImage(data.data.profileImage);
      } else {
        console.error('Upload failed:', data.error);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async () => {
    if (!address) return;

    setUploadingImage(true);
    try {
      const response = await fetch(`/api/users/${address}/profile-image`, {
        method: 'DELETE',
        headers: {
          'x-wallet-address': address,
        },
      });

      const data = await response.json();

      if (data.success) {
        setProfileImage(null);
      }
    } catch (error) {
      console.error('Error removing image:', error);
    } finally {
      setUploadingImage(false);
    }
  };

  // Save profile (name and email)
  const handleSaveProfile = async () => {
    if (!address) return;

    // Validate email format if provided
    if (userEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
      setProfileSaveError('Por favor, ingresa un correo electrónico válido');
      return;
    }

    setSavingProfile(true);
    setProfileSaveError(null);
    setProfileSaveSuccess(false);

    try {
      const response = await fetch(`/api/users/${address}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': address,
        },
        body: JSON.stringify({
          name: userName.trim(),
          email: userEmail.trim().toLowerCase(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setProfileSaveSuccess(true);
        setEditingProfile(false);
        setTimeout(() => setProfileSaveSuccess(false), 3000);
      } else {
        setProfileSaveError(data.error?.message || 'Error al guardar');
      }
    } catch (error) {
      setProfileSaveError('Error al guardar los cambios');
    } finally {
      setSavingProfile(false);
    }
  };

  // Show purchase details for a property
  const handleShowPurchaseDetails = (property: UserProperty) => {
    // Filter transactions for this property
    const propertyTransactions = transactions.filter(
      tx => tx.propertyName === property.name && tx.type === 'BUY'
    );

    const detail: PropertyPurchaseDetail = {
      propertyId: property.id,
      propertyName: property.name,
      transactions: propertyTransactions,
      totalTokens: property.tokensOwned,
      totalInvested: property.purchasePrice,
      averagePrice: property.tokensOwned > 0 ? property.purchasePrice / property.tokensOwned : 0,
    };

    setSelectedPropertyDetail(detail);
    setShowPurchaseModal(true);
  };

  // Close purchase modal
  const closePurchaseModal = () => {
    setShowPurchaseModal(false);
    setSelectedPropertyDetail(null);
  };

  // If not connected, show connect prompt
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#1e3a5f]/10 flex items-center justify-center">
            <svg className="w-12 h-12 text-[#1e3a5f]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#1e3a5f] mb-2">Accede a tu Perfil</h2>
          <p className="text-gray-500 mb-6">
            Conecta tu wallet para ver tu portafolio, rendimientos y gestionar tu cuenta.
          </p>
          <button
            onClick={() => navigate('home')}
            className="px-8 py-3 bg-[#1e3a5f] text-white font-medium rounded-xl hover:bg-[#2d4a6f] transition-colors"
          >
            Conectar Wallet
          </button>
        </div>
      </div>
    );
  }

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Calculate totals from real data
  const totalInvested = userProperties.reduce((sum, p) => sum + p.purchasePrice, 0);
  const totalCurrentValue = userProperties.reduce((sum, p) => sum + p.currentValue, 0);
  const pendingRoyaltiesAmount = royalties
    .filter(r => r.status === 'pending')
    .reduce((sum, r) => sum + r.amount, 0);

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'portfolio', label: 'Mi Portafolio', icon: <PortfolioIcon /> },
    { id: 'royalties', label: 'Rendimientos', icon: <RoyaltiesIcon /> },
    { id: 'activity', label: 'Actividad', icon: <ActivityIcon /> },
    { id: 'settings', label: 'Configuración', icon: <SettingsIcon /> },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Profile Header Card */}
      <div className="bg-gradient-to-br from-[#1e3a5f] via-[#2d4a70] to-[#3d5a80] px-4 md:px-10 py-6 md:py-12 pb-20 md:pb-24">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 md:gap-6 max-w-7xl mx-auto">
          {/* Left: User Info */}
          <div className="flex items-center gap-4 md:gap-8">
            {/* Avatar with verified badge */}
            <div className="relative flex-shrink-0">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Usuario"
                  className="w-16 h-16 md:w-28 md:h-28 rounded-full object-cover border-2 md:border-4 border-white/30 shadow-xl"
                />
              ) : (
                <div className="w-16 h-16 md:w-28 md:h-28 rounded-full bg-white/20 backdrop-blur flex items-center justify-center border-2 md:border-4 border-white/30 shadow-xl">
                  <span className="text-white font-bold text-xl md:text-4xl">
                    {userName?.charAt(0)?.toUpperCase() ||
                      userInfo?.name?.charAt(0)?.toUpperCase() ||
                      userEmail?.charAt(0)?.toUpperCase() ||
                      address?.slice(2, 4)?.toUpperCase() ||
                      '?'}
                  </span>
                </div>
              )}
              {/* Verified badge */}
              {kycApproved && (
                <div className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 w-6 h-6 md:w-10 md:h-10 bg-green-500 rounded-full flex items-center justify-center border-2 md:border-3 border-white shadow-lg">
                  <svg className="w-3 h-3 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              {/* Online indicator */}
              <span className="absolute top-0 right-0 md:top-2 md:right-2 w-3 h-3 md:w-4 md:h-4 bg-green-400 border-2 border-white rounded-full" />
            </div>

            <div className="space-y-2 md:space-y-4 min-w-0">
              <h1 className="text-lg md:text-3xl font-bold text-white truncate">
                {userName || userInfo?.name || 'Usuario'}
              </h1>
              <button
                onClick={copyAddress}
                className="flex items-center gap-1.5 md:gap-2 text-white/70 hover:text-white transition-colors text-sm md:text-base"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span className="font-mono text-xs md:text-base">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                <CopyIcon />
                {copied && <span className="text-green-400 text-xs ml-1">✓</span>}
              </button>

              {/* KYC Status Badge */}
              <div className={`inline-flex items-center gap-1.5 md:gap-2 px-2.5 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-base ${currentKYC.bg}`}>
                {kycApproved ? (
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ) : kycPending ? (
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-amber-600 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
                <span className={`font-medium ${currentKYC.color}`}>
                  KYC: {currentKYC.label}
                </span>
                {currentKYC.action && (
                  <button
                    onClick={() => openPanel('kyc')}
                    className="text-xs md:text-sm font-medium text-[#1e3a5f] hover:underline ml-1 md:ml-2"
                  >
                    {currentKYC.action}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right: Balances & Notification */}
          <div className="flex items-center gap-3 md:gap-6 mt-2 md:mt-0">
            <NotificationBell />
            <div className="flex gap-2 md:gap-4 flex-1 md:flex-none">
              <div className="bg-white/15 backdrop-blur rounded-xl md:rounded-2xl px-3 md:px-6 py-2 md:py-4 text-center flex-1 md:flex-none md:min-w-[140px]">
                <p className="text-white/60 text-[10px] md:text-sm mb-0.5 md:mb-2">MATIC</p>
                <p className="font-bold text-white text-sm md:text-xl">{parseFloat(balances.matic).toFixed(2)}</p>
              </div>
              <div className="bg-white/15 backdrop-blur rounded-xl md:rounded-2xl px-3 md:px-6 py-2 md:py-4 text-center flex-1 md:flex-none md:min-w-[140px]">
                <p className="text-white/60 text-[10px] md:text-sm mb-0.5 md:mb-2">USDT</p>
                <p className="font-bold text-green-400 text-sm md:text-xl">${parseFloat(balances.usdt).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards - Overlapping header */}
      <div className="px-4 md:px-10 -mt-10 max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-6">
          {/* Total Invertido */}
          <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-6 shadow-xl border border-gray-100">
            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-4">
              <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-blue-50 flex items-center justify-center">
                <svg className="w-4 h-4 md:w-6 md:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium text-xs md:text-base">Invertido</p>
            </div>
            <p className="text-lg md:text-3xl font-bold text-[#1e3a5f]">${totalInvested.toLocaleString()}</p>
            <p className="text-[10px] md:text-sm text-gray-400 mt-1 md:mt-2">{userProperties.length} propiedades</p>
          </div>

          {/* Valor Actual */}
          <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-6 shadow-xl border border-gray-100">
            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-4">
              <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-purple-50 flex items-center justify-center">
                <svg className="w-4 h-4 md:w-6 md:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium text-xs md:text-base">Valor</p>
            </div>
            <p className="text-lg md:text-3xl font-bold text-[#1e3a5f]">${totalCurrentValue.toLocaleString()}</p>
            <p className={`text-[10px] md:text-sm mt-1 md:mt-2 ${totalCurrentValue >= totalInvested ? 'text-green-500' : 'text-red-500'}`}>
              {totalInvested > 0 ? (totalCurrentValue >= totalInvested ? '+' : '') + ((totalCurrentValue - totalInvested) / totalInvested * 100).toFixed(1) : '0'}%
            </p>
          </div>

          {/* Rendimientos Recibidos */}
          <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-6 shadow-xl border border-gray-100">
            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-4">
              <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-green-50 flex items-center justify-center">
                <svg className="w-4 h-4 md:w-6 md:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium text-xs md:text-base">Ganado</p>
            </div>
            <p className="text-lg md:text-3xl font-bold text-green-600">${totalRoyaltiesClaimed.toFixed(2)}</p>
            <p className="text-[10px] md:text-sm text-gray-400 mt-1 md:mt-2">
              {royalties.filter(r => r.status === 'paid').length} pagos
            </p>
          </div>

          {/* Rendimientos Pendientes */}
          <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-6 shadow-xl border border-gray-100">
            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-4">
              <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-amber-50 flex items-center justify-center">
                <svg className="w-4 h-4 md:w-6 md:h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium text-xs md:text-base">Pendiente</p>
            </div>
            <p className="text-lg md:text-3xl font-bold text-amber-600">${pendingRoyaltiesAmount.toFixed(2)}</p>
            <p className="text-[10px] md:text-sm text-gray-400 mt-1 md:mt-2">
              {royalties.filter(r => r.status === 'pending').length} disponibles
            </p>
          </div>
        </div>
      </div>

      {/* Tabs & Content Container */}
      <div className="px-4 md:px-10 mt-6 md:mt-10 pb-6 md:pb-10 max-w-7xl mx-auto">
        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg overflow-hidden">
          {/* Tabs Navigation */}
          <div className="flex border-b border-gray-200 px-2 md:px-4 bg-gray-50/50 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center md:justify-start gap-1.5 md:gap-2 px-3 md:px-6 py-3 md:py-4 font-medium transition-all border-b-2 -mb-[2px] whitespace-nowrap flex-1 md:flex-none ${
                  activeTab === tab.id
                    ? 'text-[#1e3a5f] border-[#1e3a5f] bg-white'
                    : 'text-gray-500 border-transparent hover:text-[#1e3a5f]'
                }`}
              >
                {tab.icon}
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-4 md:p-8">
        {activeTab === 'portfolio' && (
          <div className="space-y-4 md:space-y-6">
            <h3 className="text-lg md:text-xl font-semibold text-[#1e3a5f]">Mis Propiedades</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6">
              {userProperties.map((property) => (
                <div
                  key={property.id}
                  className="bg-gray-50 rounded-xl md:rounded-2xl overflow-hidden border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
                >
                  <div className="flex">
                    {/* Image */}
                    <div
                      className="w-24 md:w-44 h-28 md:h-44 bg-cover bg-center flex-shrink-0"
                      style={{ backgroundImage: `url(${property.imageUrl})` }}
                    />

                    {/* Content */}
                    <div className="flex-1 p-3 md:p-5 min-w-0">
                      <div className="flex items-start justify-between mb-1 md:mb-2 gap-2">
                        <div className="min-w-0">
                          <h4 className="font-semibold text-[#1e3a5f] text-sm md:text-base truncate">{property.name}</h4>
                          <p className="text-xs md:text-sm text-gray-500 truncate">{property.location}</p>
                        </div>
                        <span className={`px-1.5 md:px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium flex-shrink-0 ${
                          property.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : property.status === 'pending'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {property.status === 'active' ? 'Activo' : property.status === 'pending' ? 'Pendiente' : 'Vendido'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 md:gap-3 mt-2 md:mt-3">
                        <div>
                          <p className="text-[10px] md:text-xs text-gray-500">Tokens</p>
                          <p className="font-semibold text-[#1e3a5f] text-xs md:text-base">
                            {property.tokensOwned}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] md:text-xs text-gray-500">Participación</p>
                          <p className="font-semibold text-[#1e3a5f] text-xs md:text-base">
                            {((property.tokensOwned / property.totalTokens) * 100).toFixed(2)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] md:text-xs text-gray-500">Invertido</p>
                          <p className="font-semibold text-[#1e3a5f] text-xs md:text-base">${property.purchasePrice.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] md:text-xs text-gray-500">Valor</p>
                          <p className={`font-semibold text-xs md:text-base ${
                            property.currentValue >= property.purchasePrice ? 'text-green-600' : 'text-red-600'
                          }`}>
                            ${property.currentValue.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Ver detalles button */}
                      <button
                        onClick={() => handleShowPurchaseDetails(property)}
                        className="mt-3 w-full py-1.5 md:py-2 text-xs md:text-sm font-medium text-[#1e3a5f] bg-[#1e3a5f]/10 hover:bg-[#1e3a5f]/20 rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Ver detalles
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty state if no properties */}
            {userProperties.length === 0 && !loading && (
              <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-200">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                  <PortfolioIcon />
                </div>
                <h4 className="text-lg font-semibold text-[#1e3a5f] mb-3">Sin propiedades aún</h4>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto">Comienza a invertir en propiedades tokenizadas y construye tu portafolio</p>
                <button
                  onClick={() => navigate('explore')}
                  className="px-6 py-2 bg-[#1e3a5f] text-white font-medium rounded-xl hover:bg-[#2d4a6f] transition-colors"
                >
                  Explorar Proyectos
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'royalties' && (
          <div className="space-y-6">
            {/* Claim Result Toast */}
            {claimResult && (
              <div className={`p-4 rounded-xl ${claimResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center gap-2">
                  {claimResult.success ? (
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <p className={claimResult.success ? 'text-green-700' : 'text-red-700'}>{claimResult.message}</p>
                  <button onClick={() => setClaimResult(null)} className="ml-auto text-gray-400 hover:text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-[#1e3a5f]">Historial de Rendimientos</h3>
              <button className="text-sm text-[#1e3a5f] hover:underline font-medium">Exportar CSV</button>
            </div>

            <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-200">
              {royalties.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">Sin rendimientos disponibles</h4>
                  <p className="text-gray-500 text-sm max-w-md mx-auto">
                    Aún no tienes rendimientos por reclamar. Los rendimientos se generan cuando los administradores
                    distribuyen dividendos de las propiedades en las que tienes tokens.
                  </p>
                </div>
              ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Propiedad</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {royalties.map((royalty) => (
                    <tr key={royalty.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-[#1e3a5f]">{royalty.propertyName}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(royalty.date).toLocaleDateString('es-AR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-green-600">${royalty.amount.toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          royalty.status === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : royalty.status === 'pending'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {royalty.status === 'paid' ? 'Reclamado' : royalty.status === 'pending' ? 'Disponible' : 'Procesando'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {royalty.status === 'pending' && royalty.onChainDistributionId ? (
                          <button
                            onClick={() => handleClaimRoyalty(royalty.onChainDistributionId!.toString())}
                            disabled={claimingId === royalty.onChainDistributionId?.toString()}
                            className="px-4 py-1.5 bg-[#1e3a5f] text-white text-sm font-medium rounded-lg hover:bg-[#2d4a6f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {claimingId === royalty.onChainDistributionId?.toString() ? (
                              <>
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Firmando...
                              </>
                            ) : (
                              'Reclamar'
                            )}
                          </button>
                        ) : royalty.txHash ? (
                          <a
                            href={`${CHAIN_CONFIG.blockExplorerUrl}/tx/${royalty.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#1e3a5f] hover:underline text-sm flex items-center gap-1"
                          >
                            Ver TX
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )}
            </div>

            {/* Info about claiming */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-medium text-blue-800">¿Cómo funcionan los rendimientos?</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Los rendimientos se distribuyen proporcionalmente según tu participación en cada propiedad.
                    Para reclamarlas, haz clic en &quot;Reclamar&quot; y firma la transacción con tu wallet.
                    Los fondos se enviarán directamente a tu dirección.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-[#1e3a5f]">Actividad Reciente</h3>
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
              {transactions.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <ActivityIcon />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">Sin actividad reciente</h4>
                  <p className="text-gray-500 text-sm">
                    Tu actividad de compras y rendimientos aparecerá aquí.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx) => {
                    const isBuy = tx.type === 'BUY';
                    const isDividend = tx.type === 'DIVIDEND_CLAIM';
                    const typeLabel = {
                      BUY: 'Compra',
                      SELL: 'Venta',
                      DIVIDEND_CLAIM: 'Rendimiento reclamado',
                      DIVIDEND_DISTRIBUTION: 'Distribución',
                    }[tx.type];

                    return (
                      <div key={tx.id} className="bg-white rounded-xl p-4 border border-gray-200 hover:border-gray-300 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isBuy ? 'bg-blue-100' : isDividend ? 'bg-green-100' : 'bg-gray-100'
                          }`}>
                            {isBuy ? (
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            ) : isDividend ? (
                              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                              </svg>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium text-[#1e3a5f]">
                                  {typeLabel}
                                  {tx.tokenAmount && ` - ${tx.tokenAmount} token${tx.tokenAmount > 1 ? 's' : ''}`}
                                </p>
                                {tx.propertyName && (
                                  <p className="text-sm text-gray-600">{tx.propertyName}</p>
                                )}
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                                tx.status === 'CONFIRMED'
                                  ? 'bg-green-100 text-green-700'
                                  : tx.status === 'PENDING'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {tx.status === 'CONFIRMED' ? 'Confirmado' : tx.status === 'PENDING' ? 'Pendiente' : 'Fallido'}
                              </span>
                            </div>

                            <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                              <div>
                                <p className="text-xs text-gray-500">Fecha</p>
                                <p className="font-medium text-gray-700">
                                  {new Date(tx.createdAt).toLocaleDateString('es-AR', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Monto</p>
                                <p className={`font-semibold ${isDividend ? 'text-green-600' : 'text-[#1e3a5f]'}`}>
                                  ${tx.amount.toFixed(4)}
                                </p>
                              </div>
                              {isBuy && tx.tokenAmount && tx.tokenAmount > 0 && (
                                <div>
                                  <p className="text-xs text-gray-500">Precio/Token</p>
                                  <p className="font-medium text-gray-700">
                                    ${(tx.amount / tx.tokenAmount).toFixed(4)}
                                  </p>
                                </div>
                              )}
                            </div>

                            {tx.txHash && (
                              <a
                                href={`${CHAIN_CONFIG.blockExplorerUrl}/tx/${tx.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-3 inline-flex items-center gap-1 text-xs text-[#1e3a5f] hover:underline"
                              >
                                <span className="font-mono">{tx.txHash.slice(0, 10)}...{tx.txHash.slice(-8)}</span>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-8">
            <h3 className="text-xl font-semibold text-[#1e3a5f]">Configuración de Cuenta</h3>

            {/* Profile Photo */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <h4 className="font-medium text-[#1e3a5f] mb-4">Foto de Perfil</h4>
              <div className="flex items-center gap-6">
                {/* Current Photo */}
                <div className="relative">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Foto de perfil"
                      className="w-24 h-24 rounded-full object-cover border-4 border-gray-100"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#3d5a80] flex items-center justify-center border-4 border-gray-100">
                      <span className="text-white font-bold text-3xl">
                        {userName?.charAt(0)?.toUpperCase() ||
                          userInfo?.name?.charAt(0)?.toUpperCase() ||
                          address?.slice(2, 4)?.toUpperCase() ||
                          '?'}
                      </span>
                    </div>
                  )}
                  {uploadingImage && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <svg className="animate-spin h-8 w-8 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Upload Controls */}
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-3">
                    Sube una foto de perfil. Se recomienda una imagen cuadrada de al menos 256x256 píxeles.
                  </p>
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="profile-image-upload"
                    />
                    <label
                      htmlFor="profile-image-upload"
                      className={`px-4 py-2 bg-[#1e3a5f] text-white text-sm font-medium rounded-xl hover:bg-[#2d4a6f] transition-colors cursor-pointer ${
                        uploadingImage ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {profileImage ? 'Cambiar foto' : 'Subir foto'}
                    </label>
                    {profileImage && (
                      <button
                        onClick={handleRemoveImage}
                        disabled={uploadingImage}
                        className="px-4 py-2 border border-gray-300 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">JPG, PNG o WebP. Máximo 5MB.</p>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-[#1e3a5f]">Información Personal</h4>
                {!editingProfile ? (
                  <button
                    onClick={() => setEditingProfile(true)}
                    className="text-sm text-[#1e3a5f] hover:underline font-medium flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Editar
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingProfile(false);
                        setProfileSaveError(null);
                      }}
                      disabled={savingProfile}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                      className="px-4 py-1.5 bg-[#1e3a5f] text-white text-sm font-medium rounded-lg hover:bg-[#2d4a6f] transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {savingProfile ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Guardando...
                        </>
                      ) : (
                        'Guardar'
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Success Message */}
              {profileSaveSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm text-green-700">Cambios guardados correctamente</p>
                </div>
              )}

              {/* Error Message */}
              {profileSaveError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <p className="text-sm text-red-700">{profileSaveError}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Nombre Completo</label>
                  {editingProfile ? (
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Ingresa tu nombre"
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-700 placeholder-gray-400 focus:border-[#1e3a5f] focus:ring-1 focus:ring-[#1e3a5f] outline-none transition"
                    />
                  ) : (
                    <p className="px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-700">
                      {userName || <span className="text-gray-400 italic">No especificado</span>}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-500 mb-1">Correo Electrónico</label>
                  {editingProfile ? (
                    <input
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-700 placeholder-gray-400 focus:border-[#1e3a5f] focus:ring-1 focus:ring-[#1e3a5f] outline-none transition"
                    />
                  ) : (
                    <p className="px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-700">
                      {userEmail || <span className="text-gray-400 italic">No especificado</span>}
                    </p>
                  )}
                </div>

                {!editingProfile && !userName && !userEmail && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4">
                    <div className="flex gap-3">
                      <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="font-medium text-blue-800 text-sm">Completa tu perfil</p>
                        <p className="text-sm text-blue-700 mt-1">
                          Agrega tu nombre y correo electrónico para personalizar tu experiencia y recibir notificaciones importantes.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Wallet Info */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <h4 className="font-medium text-[#1e3a5f] mb-4">Información de Wallet</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Dirección de Wallet</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono text-gray-700">
                      {address}
                    </code>
                    <button
                      onClick={copyAddress}
                      className="px-3 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <CopyIcon />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Balance MATIC</p>
                    <p className="font-bold text-[#1e3a5f]">{balances.matic} MATIC</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Balance USDT</p>
                    <p className="font-bold text-green-600">${balances.usdt} USDT</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50/50 rounded-2xl p-6 border border-red-200">
              <h4 className="font-medium text-red-600 mb-4">Zona de Peligro</h4>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700">Cerrar Sesión</p>
                  <p className="text-sm text-gray-500">Desconectar tu wallet de {brandConfig.identity.appName}</p>
                </div>
                <button
                  onClick={logout}
                  className="px-4 py-2 border border-red-300 text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        )}
          </div>
        </div>
      </div>

      {/* Purchase Details Modal */}
      {showPurchaseModal && selectedPropertyDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closePurchaseModal}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2d4a70] px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Detalles de Compra</h3>
                  <p className="text-white/70 text-sm">{selectedPropertyDetail.propertyName}</p>
                </div>
                <button
                  onClick={closePurchaseModal}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Total Tokens</p>
                  <p className="text-xl font-bold text-[#1e3a5f]">{selectedPropertyDetail.totalTokens}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Total Invertido</p>
                  <p className="text-xl font-bold text-[#1e3a5f]">${selectedPropertyDetail.totalInvested.toFixed(4)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Precio Promedio</p>
                  <p className="text-xl font-bold text-[#1e3a5f]">${selectedPropertyDetail.averagePrice.toFixed(4)}</p>
                </div>
              </div>
            </div>

            {/* Transactions List */}
            <div className="px-6 py-4 max-h-[400px] overflow-y-auto">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Historial de Compras</h4>

              {selectedPropertyDetail.transactions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">No se encontraron transacciones detalladas.</p>
                  <p className="text-gray-400 text-xs mt-1">Las compras antiguas pueden no tener historial completo.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedPropertyDetail.transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="bg-gray-50 rounded-xl p-4 border border-gray-100"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-[#1e3a5f] text-sm">
                              Compra de {tx.tokenAmount || 1} token{(tx.tokenAmount || 1) > 1 ? 's' : ''}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(tx.createdAt).toLocaleDateString('es-AR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          tx.status === 'CONFIRMED'
                            ? 'bg-green-100 text-green-700'
                            : tx.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {tx.status === 'CONFIRMED' ? 'Confirmado' : tx.status === 'PENDING' ? 'Pendiente' : 'Fallido'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-200">
                        <div>
                          <p className="text-xs text-gray-500">Monto</p>
                          <p className="font-semibold text-[#1e3a5f]">${tx.amount.toFixed(4)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Precio/Token</p>
                          <p className="font-semibold text-[#1e3a5f]">
                            ${tx.tokenAmount && tx.tokenAmount > 0 ? (tx.amount / tx.tokenAmount).toFixed(4) : tx.amount.toFixed(4)}
                          </p>
                        </div>
                      </div>

                      {tx.txHash && (
                        <a
                          href={`${CHAIN_CONFIG.blockExplorerUrl}/tx/${tx.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 flex items-center gap-1 text-xs text-[#1e3a5f] hover:underline"
                        >
                          <span className="font-mono">{tx.txHash.slice(0, 10)}...{tx.txHash.slice(-8)}</span>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button
                onClick={closePurchaseModal}
                className="w-full py-2.5 bg-[#1e3a5f] text-white font-medium rounded-xl hover:bg-[#2d4a6f] transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
