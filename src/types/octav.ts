// Portfolio types — matches actual /v1/portfolio response
// API returns an ARRAY (one entry per address)
export interface PortfolioAsset {
  address: string;
  symbol: string;
  name: string;
  balance: string;
  price: string;
  value: string;
  percentage: string;
  chainKey: string;
  chainContract: string;
  contract: string;
  decimal: string;
  openPnl: string;
  totalCostBasis: string;
  priceSource: string;
  imgSmall?: string;
  imgLarge?: string;
}

// Asset inside a DeFi sub-position (supply, borrow, reward, dex, etc.)
export interface DeFiAsset {
  symbol: string;
  name: string;
  balance: string;
  price: string;
  value: string;
  contract: string;
  chainContract: string;
  chainKey: string;
  decimal: string;
  priceSource: string;
  imgSmall?: string;
  imgLarge?: string;
  openPnl?: string;
  totalCostBasis?: string;
  // Margin/DEX specific
  marginUsed?: string;
  entryPrice?: string;
  leverage?: string;
  liquidationPrice?: string;
  type?: string;
}

// Nested position inside a DeFi protocol (e.g., an Aave lending position, a Pendle LP)
export interface DeFiSubPosition {
  name: string;
  value: string;
  siteUrl?: string;
  healthRate?: string;
  poolAddress?: string;
  vaultAddress?: string;
  unlockAt?: string;
  side?: string;
  assets: DeFiAsset[];
  supplyAssets: DeFiAsset[];
  borrowAssets: DeFiAsset[];
  rewardAssets: DeFiAsset[];
  dexAssets: DeFiAsset[];
  marginAssets: DeFiAsset[];
  baseAssets: DeFiAsset[];
  quoteAssets: DeFiAsset[];
}

export interface ProtocolPosition {
  name: string;
  assets: PortfolioAsset[];
  protocolPositions: DeFiSubPosition[];
  totalValue: string;
  totalOpenPnl: string;
  totalCostBasis: string;
  unlockAt: string;
}

export interface ChainEntry {
  name: string;
  key: string;
  value: string;
  imgSmall?: string;
  imgLarge?: string;
  totalCostBasis: string;
  totalClosedPnl: string;
  totalOpenPnl: string;
  protocolPositions: {
    [positionName: string]: ProtocolPosition;
  };
}

export interface ProtocolEntry {
  name: string;
  key: string;
  value: string;
  imgSmall?: string;
  imgLarge?: string;
  totalCostBasis: string;
  totalClosedPnl: string;
  totalOpenPnl: string;
  chains: {
    [chainKey: string]: ChainEntry;
  };
}

export interface PortfolioEntry {
  address: string;
  networth: string;
  lastUpdated: string;
  cashBalance: string;
  manualBalanceNetworth: string;
  assetByProtocols: {
    [protocolKey: string]: ProtocolEntry;
  };
  conversionRates: Record<string, string>;
  priceAdapters: string[];
}

export type PortfolioResponse = PortfolioEntry[];

// Transaction types
export interface TransactionAsset {
  symbol: string;
  name: string;
  imgSmall: string;
  imgLarge: string;
  contract: string;
  chainContract: string;
  chainKey: string;
  balance: string;
  price: string;
  value: string;
  decimal: string;
  from: string;
  to: string;
  explorerUrl: string;
  priceSource: string;
  costBasis: string;
  closedPnl: string;
  totalCostBasis: string;
  isAssetIn: boolean;
  isNativeAssetFees: boolean;
}

export interface Transaction {
  hash: string;
  timestamp: string;
  chain: {
    key: string;
    name: string;
    imgSmall: string;
    imgLarge: string;
  };
  from: string;
  to: string;
  type: string;
  protocol: {
    key: string;
    name: string;
    imgSmall: string;
    imgLarge: string;
  };
  assetsIn: TransactionAsset[];
  assetsOut: TransactionAsset[];
  valueFiat: string;
  fees: string;
  feesFiat: string;
  explorerUrl: string;
  functionName?: string;
  blockNumber?: number;
  confirmed?: string;
}

export interface TransactionsResponse {
  transactions: Transaction[];
}

export interface NAVResponse {
  nav: number;
  currency: string;
}

export interface StatusEntry {
  address: string;
  portfolioLastSync: string;
  transactionsLastSync: string | null;
  syncInProgress: boolean;
}

export type StatusResponse = StatusEntry[];

export type CreditsResponse = number;

export interface TokenOverviewItem {
  image: string;
  symbol: string;
  name: string;
  price: string;
  balance: string;
  value: string;
  percentage: string;
  protocolsDetailed: unknown[];
}

export type TokenOverviewResponse = TokenOverviewItem[];

export type HistoricalResponse = PortfolioEntry[];
export type SyncResponse = string;
