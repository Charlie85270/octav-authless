import type {
  PortfolioResponse,
  TransactionsResponse,
  NAVResponse,
  StatusResponse,
  CreditsResponse,
  TokenOverviewResponse,
  HistoricalResponse,
  SyncResponse,
} from "@/types/octav";

export class OctavAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: unknown
  ) {
    super(message);
    this.name = "OctavAPIError";
  }
}

export class AuthenticationError extends OctavAPIError {
  constructor(message = "Invalid API key") {
    super(message, 401);
    this.name = "AuthenticationError";
  }
}

export class InsufficientCreditsError extends OctavAPIError {
  constructor(
    message = "Insufficient credits",
    public creditsNeeded?: number
  ) {
    super(message, 402);
    this.name = "InsufficientCreditsError";
  }
}

export class RateLimitError extends OctavAPIError {
  constructor(
    message = "Rate limit exceeded",
    public retryAfter?: number
  ) {
    super(message, 429);
    this.name = "RateLimitError";
  }
}

const BASE_URL = "https://api.octav.fi/v1";

async function request<T>(
  endpoint: string,
  apiKey: string,
  method: "GET" | "POST" = "GET",
  body?: unknown
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorData: Record<string, unknown>;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { message: errorText };
    }
    const msg = (errorData.message as string) || `API error ${response.status}`;

    switch (response.status) {
      case 401:
        throw new AuthenticationError(msg);
      case 402:
        throw new InsufficientCreditsError(msg, errorData.creditsNeeded as number);
      case 429:
        throw new RateLimitError(msg, errorData.retryAfter as number);
      default:
        throw new OctavAPIError(msg, response.status, errorData);
    }
  }

  return (await response.json()) as T;
}

async function requestText(
  endpoint: string,
  apiKey: string,
  method: "GET" | "POST" = "GET",
  body?: unknown
): Promise<string> {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorData: Record<string, unknown>;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { message: errorText };
    }
    const msg = (errorData.message as string) || `API error ${response.status}`;

    switch (response.status) {
      case 401:
        throw new AuthenticationError(msg);
      case 402:
        throw new InsufficientCreditsError(msg, errorData.creditsNeeded as number);
      case 429:
        throw new RateLimitError(msg, errorData.retryAfter as number);
      default:
        throw new OctavAPIError(msg, response.status, errorData);
    }
  }

  return await response.text();
}

function addressParams(addresses: string[]): URLSearchParams {
  const params = new URLSearchParams();
  addresses.forEach((addr) => params.append("addresses", addr));
  return params;
}

// API functions (stateless — apiKey passed explicitly)

export function getPortfolio(apiKey: string, addresses: string[], options?: { waitForSync?: boolean }) {
  const params = addressParams(addresses);
  if (options?.waitForSync) params.append("waitForSync", "true");
  params.append("includeImages", "true");
  return request<PortfolioResponse>(`/portfolio?${params}`, apiKey);
}

export function getWallet(apiKey: string, addresses: string[]) {
  return request<PortfolioResponse>(`/wallet?${addressParams(addresses)}`, apiKey);
}

export function getNAV(apiKey: string, addresses: string[], currency = "USD") {
  const params = addressParams(addresses);
  params.append("currency", currency);
  return request<NAVResponse>(`/nav?${params}`, apiKey);
}

export function getTokenOverview(apiKey: string, addresses: string[], date: string) {
  const params = addressParams(addresses);
  params.append("date", date);
  return request<TokenOverviewResponse>(`/token-overview?${params}`, apiKey);
}

export function getTransactions(
  apiKey: string,
  addresses: string[],
  options: {
    chain?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    offset?: number;
    limit?: number;
  } = {}
) {
  const params = addressParams(addresses);
  if (options.chain) params.append("chain", options.chain);
  if (options.type) params.append("type", options.type);
  if (options.startDate) params.append("startDate", options.startDate);
  if (options.endDate) params.append("endDate", options.endDate);
  params.append("offset", (options.offset ?? 0).toString());
  params.append("limit", (options.limit ?? 50).toString());
  return request<TransactionsResponse>(`/transactions?${params}`, apiKey);
}

export async function syncTransactions(apiKey: string, addresses: string[]) {
  const text = await requestText("/sync-transactions", apiKey, "POST", { addresses });
  return text.replace(/^"|"$/g, "") as SyncResponse;
}

export function getHistorical(apiKey: string, addresses: string[], date: string) {
  const params = addressParams(addresses);
  params.append("date", date);
  return request<HistoricalResponse>(`/historical?${params}`, apiKey);
}

export function getStatus(apiKey: string, addresses: string[]) {
  return request<StatusResponse>(`/status?${addressParams(addresses)}`, apiKey);
}

export async function getCredits(apiKey: string): Promise<CreditsResponse> {
  const text = await requestText("/credits", apiKey);
  const num = Number(text);
  if (isNaN(num)) throw new OctavAPIError(`Unexpected credits response: ${text}`);
  return num;
}
