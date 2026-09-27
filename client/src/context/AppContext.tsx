import React, { createContext, useContext, useMemo } from 'react';

export interface ContractItem {
  contract_id: string;
  filename: string;
  timestamp: string;
  analysis: string | Record<string, unknown>;
}

export interface AnalyticsState {
  totalAnnual: number;
  avgMonthlyBurn: number;
  upcomingPayments: { contract_id: string; party: string; expiry: string; annual_value: number; subject?: string }[];
  autoRenewalCount: number;
  noticeAvg: number;
  riskCounts: [string, number][];
  expiryClusters: { quarter: string; count: number }[];
  nextBig: { contract_id: string; party: string; expiry: string; subject: string; annual_value: number } | null;
  topCounterparties: { name: string; count: number; pct: number }[];
  totalContracts: number;
}

export interface AppContextValue {
  currentUser: string;
  userPicture: string | null;
  isGoogleConnected: boolean;
  history: ContractItem[];
  loading: boolean;
  uploadError: string;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  sortBy: 'timestamp' | 'alphabetical' | 'expiry';
  setSortBy: (v: 'timestamp' | 'alphabetical' | 'expiry') => void;
  loadUserData: () => Promise<ContractItem[]>;
  handleUploadFile: (file: File) => Promise<void>;
  handleUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDeleteContract: (id: string) => void;
  handleNotificationChange: (contractId: string, reminderSetting: string) => Promise<void>;
  handleFileClick: (contractId: string, e: React.MouseEvent) => void;
  setSelectedAnalysis: (v: string | null) => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
  filteredAndSortedHistory: ContractItem[];
  analytics: AnalyticsState;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

interface AppProviderProps {
  value: AppContextValue;
  children: React.ReactNode;
}

export function AppProvider({ value, children }: AppProviderProps) {
  const stable = useMemo(() => value, [
    value.currentUser,
    value.userPicture,
    value.isGoogleConnected,
    value.history,
    value.loading,
    value.uploadError,
    value.searchTerm,
    value.sortBy,
    value.filteredAndSortedHistory,
    value.analytics,
  ]);
  return <AppContext.Provider value={stable}>{children}</AppContext.Provider>;
}
